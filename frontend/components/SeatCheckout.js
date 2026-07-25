// components/SeatCheckout.js - Seat selection -> in-app payment proof -> ticket
// One flow shared by regular pools, City VIP and Merkato VIP:
//   1. pick seats on the seat map (all seats of the program are shown)
//   2. upload the payment screenshot without leaving the app (goes to the admin)
//   3. download the unverified PNG ticket, which becomes verified once the
//      admin approves the payment.
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import SeatMap from './SeatMap';
import TicketImage from './TicketImage';
import {
  resolveProgram,
  fetchTakenSeats,
  releaseSeats,
  buildTicketNumber
} from '../lib/seatPrograms';

const PAYMENT_ACCOUNTS = [
  { icon: '📱', label: 'TeleBirr', value: '0913277922' },
  { icon: '🏦', label: 'CBE Bank', value: '1000601091686' }
];
const ACCOUNT_NAME = 'NEGASSA HUNDESSA DUGA';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const VERIFICATION_POLL_MS = 15000;

export default function SeatCheckout({
  programType,
  tierId,
  city,
  pool,
  poolId,
  entryFee,
  totalSeats,
  prize,
  poolName,
  user,
  maxSeats = 5,
  language = 'am',
  onClose,
  onCompleted
}) {
  const program = useMemo(
    () => resolveProgram({ programType, tierId, city, pool, poolId, entryFee, totalSeats, prize }),
    [programType, tierId, city, pool, poolId, entryFee, totalSeats, prize]
  );

  const [step, setStep] = useState('seats'); // seats | payment | ticket
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [participant, setParticipant] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reserving, setReserving] = useState(false);
  const isMounted = useRef(true);

  const t = (am, en) => (language === 'am' ? am : en);
  const isVerified = participant?.payment_status === 'verified';
  const totalAmount = selectedSeats.length * program.entryFee;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const refreshParticipant = useCallback(async () => {
    if (!participant?.id || !supabase) return;
    const { data } = await supabase.from(program.table).select('*').eq('id', participant.id).maybeSingle();
    if (!data || !isMounted.current) return;
    setParticipant(previous => {
      if (previous?.payment_status !== 'verified' && data.payment_status === 'verified') {
        toast.success(t('✅ ቲኬትዎ ተረጋግጧል!', '✅ Your ticket has been verified!'));
      }
      return data;
    });
  }, [participant?.id, program.table]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll until the admin verifies the payment.
  useEffect(() => {
    if (step !== 'ticket' || !participant?.id || isVerified) return;
    const interval = setInterval(refreshParticipant, VERIFICATION_POLL_MS);
    return () => clearInterval(interval);
  }, [step, participant?.id, isVerified, refreshParticipant]);

  const handleSeatsConfirmed = async ({ seats }) => {
    if (!user?.id) {
      toast.error(t('እባክዎ ወደ ስርዓት ይግቡ', 'Please login to continue'));
      return;
    }

    setReserving(true);
    try {
      // Final availability check right before the seats are claimed.
      const { seats: taken } = await fetchTakenSeats(program, user.id);
      const conflicts = seats.filter(seat => taken.includes(seat));
      if (conflicts.length > 0) {
        toast.error(
          t(`መቀመጫዎች ${conflicts.join(', ')} ተይዘዋል. ሌላ ይምረጡ`, `Seats ${conflicts.join(', ')} were just taken. Please pick others.`)
        );
        return;
      }

      const created = await insertParticipant(program, user, seats, poolName);
      if (!isMounted.current) return;

      setParticipant(created);
      setSelectedSeats(seats);
      setStep('payment');
      toast.success(t('መቀመጫዎች ተይዘዋል! እባክዎ ክፍያ ይፈጽሙ', 'Seats reserved! Please complete payment.'));
    } catch (error) {
      console.error('Seat reservation failed:', error);
      toast.error(`${t('መቀመጫዎችን ማስያዝ አልተቻለም', 'Failed to reserve seats')}: ${error.message}`);
    } finally {
      if (isMounted.current) setReserving(false);
    }
  };

  const handleFileChange = event => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      toast.error(t('የምስል ፋይል ይስቀሉ', 'Please select an image file'));
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      toast.error(t('ምስሉ ከ5MB በታች መሆን አለበት', 'Image must be smaller than 5MB'));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const submitPayment = async () => {
    if (!file) {
      toast.error(t('እባክዎ የክፍያ ማስረጃ ይስቀሉ', 'Please upload your payment screenshot'));
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading(t('የክፍያ ማስረጃ እየተላከ ነው...', 'Sending payment screenshot...'));

    try {
      const compressed = await compressImage(file);
      const path = `${user.id}/${Date.now()}_${program.programType}_${program.tierId || program.poolId}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, compressed, { cacheControl: '3600', contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const {
        data: { publicUrl }
      } = supabase.storage.from('payment-proofs').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from(program.table)
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participant.id);
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);

      await notifyAdmin(program, participant, publicUrl, selectedSeats, totalAmount);
      // The seats now belong to the participant row, the temporary hold can go.
      await releaseSeats(program, user.id, selectedSeats);

      const { data: updated } = await supabase
        .from(program.table)
        .select('*')
        .eq('id', participant.id)
        .maybeSingle();

      if (!isMounted.current) return;
      setParticipant(updated || { ...participant, payment_status: 'pending_verification', payment_proof_url: publicUrl });
      setStep('ticket');
      toast.success(t('ክፍያ ለአስተዳዳሪ ተልኳል! ያልተረጋገጠ ቲኬትዎ ዝግጁ ነው', 'Sent to the admin! Your unverified ticket is ready'), {
        id: loadingToast
      });
    } catch (error) {
      console.error('Payment submission failed:', error);
      toast.error(error.message || t('ክፍያ መላክ አልተቻለም', 'Failed to submit payment'), { id: loadingToast });
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const cancelSeats = () => {
    releaseSeats(program, user?.id);
    onClose?.();
  };

  const finish = () => {
    onCompleted?.(participant);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 overflow-y-auto p-2 sm:p-4">
      <div className="max-w-4xl mx-auto my-4">
        {step === 'seats' && (
          <div className="relative">
            {reserving && (
              <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-2xl">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
              </div>
            )}
            <SeatMap
              programType={program.programType}
              tierId={program.tierId}
              city={program.city}
              pool={pool}
              poolId={program.poolId}
              entryFee={program.entryFee}
              totalSeats={program.totalSeats}
              prize={program.prize}
              user={user}
              maxSeats={maxSeats}
              language={language}
              onConfirm={handleSeatsConfirmed}
              onCancel={cancelSeats}
            />
          </div>
        )}

        {step === 'payment' && (
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">{t('ክፍያ ያጠናቅቁ', 'Complete Payment')}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                <p className="text-sm text-gray-600">{program.label}</p>
                <p className="text-sm text-gray-600">
                  {t('መቀመጫዎች:', 'Seats:')} {selectedSeats.join(', ')}
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">ETB {totalAmount.toLocaleString()}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="font-semibold mb-2">{t('የክፍያ ዘዴዎች', 'Payment methods')}</p>
                {PAYMENT_ACCOUNTS.map(account => (
                  <p key={account.label} className="font-semibold">
                    {account.icon} {account.label}: {account.value}
                  </p>
                ))}
                <p className="text-sm text-gray-600 mt-2">
                  {t('የሂሳብ ባለቤት:', 'Account name:')} {ACCOUNT_NAME}
                </p>
              </div>

              <div className="border-2 border-dashed rounded-xl p-4 text-center mb-4 hover:border-green-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="seatCheckoutProof"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="seatCheckoutProof" className="cursor-pointer block">
                  {previewUrl ? (
                    <div>
                      <img src={previewUrl} alt="Payment proof" className="max-h-40 mx-auto mb-2 rounded" />
                      <p className="text-green-600 text-sm">✓ {t('ማስረጃ ተመርጧል', 'Screenshot selected')}</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-gray-500 mt-2">
                        {t('የክፍያ ማስረጃ ለመጫን ጠቅ ያድርጉ', 'Tap to attach your payment screenshot')}
                      </p>
                      <p className="text-xs text-gray-400">JPEG, PNG (max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>

              <button
                onClick={submitPayment}
                disabled={submitting || !file}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition"
              >
                {submitting
                  ? t('በሂደት ላይ...', 'Sending...')
                  : t('ለአስተዳዳሪ ላክ እና ቲኬት አግኝ', 'Send to admin & get ticket')}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                {t(
                  'ማስረጃው በቀጥታ ወደ አስተዳዳሪው ይላካል - መተግበሪያውን መልቀቅ አያስፈልግም',
                  'The screenshot goes straight to the admin - no need to leave the app'
                )}
              </p>
            </div>
          </div>
        )}

        {step === 'ticket' && participant && (
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="border-b p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">🎫 {t('የእርስዎ ቲኬት', 'Your Ticket')}</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {isVerified ? `✅ ${t('የተረጋገጠ', 'Verified')}` : `⏳ ${t('ያልተረጋገጠ', 'Unverified')}`}
                </span>
              </div>
              <button onClick={finish} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                ×
              </button>
            </div>
            <div className="p-6">
              <TicketImage
                participant={participant}
                pool={{
                  prize_name: poolName || program.label,
                  target_amount: program.prize,
                  prize: program.prize
                }}
                isVerified={isVerified}
                seatNumbers={participant.seat_numbers || selectedSeats}
                ticketNumber={participant.ticket_number}
                amount={participant.contribution_amount}
                createdAt={participant.created_at}
                poolType={program.programType}
                language={language}
              />

              <div
                className={`mt-4 rounded-lg border p-4 text-center text-sm ${
                  isVerified ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}
              >
                {isVerified
                  ? t('✅ ክፍያዎ ተረጋግጧል. የተረጋገጠ ቲኬትዎን ያውርዱ.', '✅ Payment verified. Download your verified ticket.')
                  : t(
                      '⏳ ክፍያዎ በአስተዳዳሪ እየተረጋገጠ ነው. ይህ ቲኬት ከተረጋገጠ በኋላ በራሱ ይዘምናል.',
                      '⏳ The admin is reviewing your payment. This ticket updates to verified automatically.'
                    )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button onClick={refreshParticipant} className="bg-gray-200 hover:bg-gray-300 px-5 py-2 rounded-lg text-sm font-semibold">
                  🔄 {t('ሁኔታ አድስ', 'Check status')}
                </button>
                <button onClick={finish} className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-semibold">
                  {t('ዝጋ', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function insertParticipant(program, user, seats, poolName) {
  const payload = {
    user_id: user.id,
    user_email: user.email,
    user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    seat_numbers: seats,
    contribution_amount: seats.length * program.entryFee,
    prize_amount: program.prize,
    payment_status: 'pending',
    ticket_number: buildTicketNumber(program),
    status: 'active',
    created_at: new Date().toISOString()
  };

  if (program.programType === 'regular') {
    payload.pool_id = program.poolId;
    payload.pool_name = poolName || program.label;
  } else {
    payload.pool_type = program.tierId;
    payload.tier = program.tierId;
    payload.city = program.programType === 'merkato' ? 'Merkato' : program.city;
  }

  return insertWithColumnFallback(program.table, payload);
}

// Deployments differ slightly in their columns; drop the ones the database does
// not know about instead of failing the whole booking.
async function insertWithColumnFallback(table, payload, attempt = 0) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (!error) return data;

  const unknownColumn = extractUnknownColumn(error);
  if (unknownColumn && attempt < 5 && unknownColumn in payload) {
    const { [unknownColumn]: _removed, ...rest } = payload;
    return insertWithColumnFallback(table, rest, attempt + 1);
  }

  throw new Error(error.message);
}

function extractUnknownColumn(error) {
  if (!error) return null;
  if (!['PGRST204', '42703'].includes(error.code)) return null;
  const match = /'([^']+)'|"([^"]+)"/.exec(error.message || '');
  return match?.[1] || match?.[2] || null;
}

async function notifyAdmin(program, participant, proofUrl, seats, amount) {
  try {
    await supabase.from('admin_notifications').insert({
      title: '📸 New payment proof submitted',
      message: `${participant.user_name || participant.user_email} sent ETB ${amount.toLocaleString()} for ${program.label} (seats ${seats.join(', ')}). Ticket ${participant.ticket_number}.`,
      type: 'payment_proof',
      metadata: {
        table: program.table,
        participant_id: participant.id,
        ticket_number: participant.ticket_number,
        proof_url: proofUrl,
        seats,
        amount
      }
    });
  } catch (error) {
    console.error('Admin notification failed:', error);
  }
}

function compressImage(file, maxSize = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image'));
    reader.onload = event => {
      const image = new Image();
      image.onerror = () => reject(new Error('Could not read the selected image'));
      image.onload = () => {
        let { width, height } = image;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Could not process the selected image'));
              return;
            }
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      image.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}
