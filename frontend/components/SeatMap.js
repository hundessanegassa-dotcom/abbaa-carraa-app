// components/SeatMap.js - Seat map for regular pools, City VIP and Merkato VIP
// Reads the total seat count of the program and renders every single seat.
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  resolveProgram,
  fetchTakenSeats,
  fetchOwnReservations,
  reserveSeats,
  releaseSeats,
  RESERVATION_MINUTES
} from '../lib/seatPrograms';

const SEATS_PER_ROW = 20;
const CHUNK = 1000; // seats added to the DOM each time the user reaches the end

export default function SeatMap({
  programType,
  tierId,
  city,
  pool,
  poolId,
  entryFee,
  totalSeats,
  prize,
  user,
  maxSeats = 5,
  language = 'am',
  onConfirm,
  onCancel
}) {
  const program = useMemo(
    () => resolveProgram({ programType, tierId, city, pool, poolId, entryFee, totalSeats, prize }),
    [programType, tierId, city, pool, poolId, entryFee, totalSeats, prize]
  );

  const [takenSeats, setTakenSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(CHUNK);
  const [seatQuery, setSeatQuery] = useState('');
  const sentinelRef = useRef(null);
  const isMounted = useRef(true);

  const t = (am, en) => (language === 'am' ? am : en);
  const takenSet = useMemo(() => new Set(takenSeats), [takenSeats]);
  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);
  const totalPrice = selectedSeats.length * program.entryFee;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadSeats = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      const { seats, error } = await fetchTakenSeats(program, user?.id);
      if (!isMounted.current) return;
      setTakenSeats(seats);
      setLoadError(error || null);
      setLoading(false);
    },
    [program, user?.id]
  );

  useEffect(() => {
    setSelectedSeats([]);
    setVisibleCount(CHUNK);
    loadSeats(true);
    const interval = setInterval(() => loadSeats(false), 30000);
    return () => clearInterval(interval);
  }, [loadSeats]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchOwnReservations(program, user.id).then(seats => {
      if (!cancelled && seats.length > 0) setSelectedSeats(seats.slice(0, maxSeats));
    });
    return () => {
      cancelled = true;
    };
  }, [program, user?.id, maxSeats]);

  // Progressive rendering: keep adding seats as the user reaches the bottom.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount(count => Math.min(count + CHUNK, program.totalSeats));
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [program.totalSeats, visibleCount]);

  const rows = useMemo(() => {
    const shown = Math.min(visibleCount, program.totalSeats);
    const built = [];
    for (let start = 0; start < shown; start += SEATS_PER_ROW) {
      const row = [];
      for (let seat = start + 1; seat <= Math.min(start + SEATS_PER_ROW, shown); seat++) {
        row.push(seat);
      }
      built.push(row);
    }
    return built;
  }, [visibleCount, program.totalSeats]);

  const toggleSeat = async seatNumber => {
    if (takenSet.has(seatNumber)) {
      toast.error(t(`መቀመጫ ${seatNumber} ተይዟል`, `Seat ${seatNumber} is already taken`));
      return;
    }

    if (selectedSet.has(seatNumber)) {
      setSelectedSeats(seats => seats.filter(s => s !== seatNumber));
      releaseSeats(program, user?.id, [seatNumber]);
      return;
    }

    if (selectedSeats.length >= maxSeats) {
      toast.error(t(`እስከ ${maxSeats} መቀመጫዎች ብቻ መምረጥ ይችላሉ`, `You can select up to ${maxSeats} seats`));
      return;
    }

    setSelectedSeats(seats => [...seats, seatNumber].sort((a, b) => a - b));
    const { ok } = await reserveSeats(program, user?.id, [seatNumber]);
    if (!ok) {
      setSelectedSeats(seats => seats.filter(s => s !== seatNumber));
      toast.error(t(`መቀመጫ ${seatNumber} አይገኝም`, `Seat ${seatNumber} is no longer available`));
      loadSeats(false);
    }
  };

  const jumpToSeat = () => {
    const seat = parseInt(seatQuery.trim(), 10);
    if (!Number.isFinite(seat) || seat < 1 || seat > program.totalSeats) {
      toast.error(t(`ከ1 እስከ ${program.totalSeats} ቁጥር ያስገቡ`, `Enter a number between 1 and ${program.totalSeats}`));
      return;
    }
    setVisibleCount(count => Math.max(count, Math.min(program.totalSeats, seat + SEATS_PER_ROW)));
    setTimeout(() => {
      document.getElementById(`seat-${seat}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const selectSeatsByNumber = async () => {
    const numbers = [
      ...new Set(
        seatQuery
          .split(',')
          .map(value => parseInt(value.trim(), 10))
          .filter(n => Number.isFinite(n) && n >= 1 && n <= program.totalSeats)
      )
    ];

    if (numbers.length === 0) {
      toast.error(t('ትክክለኛ መቀመጫ ቁጥሮች ያስገቡ', 'Enter valid seat numbers'));
      return;
    }

    const alreadyTaken = numbers.filter(n => takenSet.has(n));
    if (alreadyTaken.length > 0) {
      toast.error(t(`መቀመጫዎች ${alreadyTaken.join(', ')} ተይዘዋል`, `Seats ${alreadyTaken.join(', ')} are taken`));
      return;
    }

    const merged = [...new Set([...selectedSeats, ...numbers])].sort((a, b) => a - b);
    if (merged.length > maxSeats) {
      toast.error(t(`እስከ ${maxSeats} መቀመጫዎች ብቻ`, `You can select up to ${maxSeats} seats`));
      return;
    }

    setSelectedSeats(merged);
    setSeatQuery('');
    await reserveSeats(program, user?.id, numbers);
    toast.success(t(`${numbers.length} መቀመጫዎች ተመርጠዋል`, `${numbers.length} seat(s) selected`));
  };

  const confirm = () => {
    if (selectedSeats.length === 0) {
      toast.error(t('እባክዎ ቢያንስ አንድ መቀመጫ ይምረጡ', 'Please select at least one seat'));
      return;
    }
    onConfirm?.({
      seats: selectedSeats,
      totalAmount: totalPrice,
      seatCount: selectedSeats.length,
      tier: program.tierId,
      program
    });
  };

  if (program.totalSeats <= 0) {
    return (
      <div className="bg-white border rounded-2xl p-8 text-center">
        <p className="text-red-600 font-semibold">
          {t('የዚህ ፕሮግራም መቀመጫዎች አልተዘጋጁም', 'This program has no seats configured')}
        </p>
        <button onClick={onCancel} className="mt-4 bg-gray-200 px-6 py-2 rounded-lg">
          {t('ተመለስ', 'Go Back')}
        </button>
      </div>
    );
  }

  const availableCount = Math.max(0, program.totalSeats - takenSeats.length - selectedSeats.length);

  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      <div className="border-b p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{t('መቀመጫዎችን ይምረጡ', 'Select Your Seats')}</h3>
          <p className="text-xs text-gray-500">
            {program.label} • {t('ክፍያ', 'Entry')} ETB {program.entryFee.toLocaleString()} •{' '}
            {t('ሽልማት', 'Prize')} ETB {program.prize.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadSeats(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs"
          >
            🔄 {t('አድስ', 'Refresh')}
          </button>
          {onCancel && (
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
              ×
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat label={t('ጠቅላላ መቀመጫዎች', 'Total Seats')} value={program.totalSeats} tone="text-gray-800" />
          <Stat label={t('ክፍት', 'Available')} value={availableCount} tone="text-green-600" />
          <Stat label={t('የተያዙ', 'Taken')} value={takenSeats.length} tone="text-red-600" />
          <Stat label={t('የተመረጡ', 'Selected')} value={selectedSeats.length} tone="text-yellow-600" />
        </div>

        {loadError && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            ⚠️{' '}
            {t(
              'የተያዙ መቀመጫዎችን መጫን አልተቻለም. ምርጫዎ ከመጽደቁ በፊት ይረጋገጣል.',
              'Could not load taken seats. Your selection is re-checked before it is confirmed.'
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={seatQuery}
            onChange={e => setSeatQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && selectSeatsByNumber()}
            placeholder={t(`ቁጥር ያስገቡ (1 - ${program.totalSeats})`, `Seat number (1 - ${program.totalSeats})`)}
            className="flex-1 min-w-[180px] border rounded-lg px-3 py-2 text-sm"
            inputMode="numeric"
          />
          <button onClick={selectSeatsByNumber} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            🎯 {t('በቁጥር ምረጥ', 'Select by number')}
          </button>
          <button onClick={jumpToSeat} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
            🔍 {t('ወደ መቀመጫ ሂድ', 'Find seat')}
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-3 pb-3 border-b text-xs">
          <Legend className="bg-white border border-gray-300" label={t('ክፍት', 'Available')} />
          <Legend className="bg-green-600" label={t('የእርስዎ ምርጫ', 'Your selection')} />
          <Legend className="bg-red-400" label={t('የተያዙ', 'Taken')} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            {t('መቀመጫዎችን በመጫን ላይ...', 'Loading seats...')}
          </div>
        ) : (
          <>
            <div className="max-h-[55vh] overflow-y-auto pr-1">
              {rows.map((row, index) => (
                <div key={row[0]} className="flex items-center gap-1 mb-1">
                  <span className="w-10 shrink-0 text-[10px] font-mono text-gray-400 text-right">
                    {index * SEATS_PER_ROW + 1}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {row.map(seat => {
                      const isTaken = takenSet.has(seat);
                      const isSelected = selectedSet.has(seat);
                      const style = isSelected
                        ? 'bg-green-600 border-green-700 text-white'
                        : isTaken
                          ? 'bg-red-400 border-red-500 text-white opacity-70 cursor-not-allowed'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100';
                      return (
                        <button
                          key={seat}
                          id={`seat-${seat}`}
                          onClick={() => toggleSeat(seat)}
                          disabled={isTaken}
                          title={isTaken ? `Seat ${seat} taken` : `Select seat ${seat}`}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-[9px] sm:text-[10px] font-mono font-semibold transition ${style}`}
                        >
                          {seat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={sentinelRef} className="h-8" />
              <p className="text-center text-xs text-gray-400 py-2">
                {t(
                  `${Math.min(visibleCount, program.totalSeats).toLocaleString()} ከ ${program.totalSeats.toLocaleString()} መቀመጫዎች ታይተዋል`,
                  `Showing ${Math.min(visibleCount, program.totalSeats).toLocaleString()} of ${program.totalSeats.toLocaleString()} seats`
                )}
              </p>
              {visibleCount < program.totalSeats && (
                <button
                  onClick={() => setVisibleCount(program.totalSeats)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  {t('ሁሉንም መቀመጫዎች አሳይ', 'Show all seats')}
                </button>
              )}
            </div>

            <div className="mt-4 border-t pt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">{t('የተመረጡ መቀመጫዎች', 'Selected seats')}</p>
                <p className="font-bold text-sm">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}
                </p>
                <p className="text-[10px] text-gray-400">
                  ⏰ {t(`ምርጫዎ ለ${RESERVATION_MINUTES} ደቂቃ ተይዟል`, `Held for ${RESERVATION_MINUTES} minutes`)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('ጠቅላላ ክፍያ', 'Total amount')}</p>
                <p className="font-bold text-xl text-green-600">ETB {totalPrice.toLocaleString()}</p>
              </div>
              <button
                onClick={confirm}
                disabled={selectedSeats.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm"
              >
                {t('አረጋግጥ እና ወደ ክፍያ ቀጥል', 'Confirm & Proceed to Payment')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-2 text-center">
      <p className={`text-lg font-bold ${tone}`}>{value.toLocaleString()}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function Legend({ className, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded ${className}`} />
      {label}
    </span>
  );
}
