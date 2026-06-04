// pages/cities/payment.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Optimized file upload utilities
const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024;
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, WEBP)');
  }
  
  if (file.size > MAX_SIZE) {
    throw new Error('File size must be less than 5MB');
  }
  
  return true;
};

const optimizeImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { 
            type: 'image/jpeg' 
          });
          resolve(optimizedFile);
        }, 'image/jpeg', 0.7);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// City Ticket Component
const CityTicket = ({ participant, pool, cityName, type = 'unverified' }) => {
  const ticketRef = useRef();

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' });
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`city-ticket-${participant.ticket_number}.pdf`);
      toast.success('Ticket downloaded!', { id: 'pdf-gen' });
      
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  const statusConfig = type === 'verified' ? {
    bg: 'bg-gray-50',
    border: 'border-gray-600',
    badge: 'bg-gray-700',
    badgeText: 'VERIFIED',
    text: 'Approved Entry'
  } : {
    bg: 'bg-gray-50',
    border: 'border-gray-400',
    badge: 'bg-gray-500',
    badgeText: 'UNVERIFIED',
    text: 'Awaiting Admin Approval'
  };

  return (
    <div className="space-y-4">
      <div 
        ref={ticketRef}
        className={`${statusConfig.bg} border-2 ${statusConfig.border} rounded-2xl p-6 max-w-2xl mx-auto shadow-xl`}
      >
        <div className="text-center border-b pb-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <div className="text-xs text-gray-500 font-mono">Ticket #{participant.ticket_number}</div>
              <div className="text-sm font-semibold text-gray-700">
                {participant.created_at ? new Date(participant.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div className={`${statusConfig.badge} text-white px-3 py-1 rounded-full text-xs font-bold`}>
              {statusConfig.badgeText}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">🏙️ {cityName} VIP</h2>
          <p className="text-sm text-gray-600">የሚሊየነር ቲኬት | Millionaire Ticket</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Participant Name</p>
            <p className="font-semibold text-sm">{participant.user_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-semibold text-sm">{participant.user_email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pool Type</p>
            <p className="font-semibold text-sm capitalize">{participant.pool_type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">City</p>
            <p className="font-semibold text-sm">{participant.city || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Seat Numbers</p>
            <p className="font-semibold text-sm">{participant.seat_numbers?.join(', ') || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Contribution</p>
            <p className="font-semibold text-sm text-green-600">ETB {participant.contribution_amount?.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-center py-4 border-t border-b border-dashed">
          <div className="bg-white p-3 rounded-xl shadow-md">
            <QRCodeSVG 
              value={JSON.stringify({
                ticket: participant.ticket_number,
                name: participant.user_name,
                city: participant.city,
                seats: participant.seat_numbers,
                pool: participant.pool_type,
                verified: type === 'verified'
              })}
              size={120}
              level="H"
            />
          </div>
        </div>

        {type === 'unverified' && (
          <div className="bg-gray-100 rounded-lg p-3 mt-4 text-center">
            <p className="text-gray-800 text-sm font-semibold">⏳ Awaiting Admin Verification</p>
            <p className="text-gray-600 text-xs">Your ticket will be activated once payment is confirmed</p>
          </div>
        )}

        <div className="text-center text-xs text-gray-400 mt-4 pt-4 border-t">
          <p>Abbaa Carraa • City VIP Program</p>
          <p>Keep this ticket safe for prize claims</p>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={downloadTicket}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Ticket (PDF)
        </button>
      </div>
    </div>
  );
};

export default function CityPayment() {
  const router = useRouter();
  const { participant, seats, amount, type, city } = router.query;
  const [user, setUser] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ticketGenerated, setTicketGenerated] = useState(false);

  useEffect(() => {
    checkUser();
    if (participant) {
      fetchParticipant();
    }
  }, [participant]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const fetchParticipant = async () => {
    try {
      const { data, error } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('id', participant)
        .single();
      
      if (error) throw error;
      setParticipantData(data);
    } catch (error) {
      console.error('Error fetching participant:', error);
      toast.error('Participant record not found');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      validateFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      setSelectedFile(file);
      toast.success('File selected successfully');
    } catch (error) {
      toast.error(error.message);
      e.target.value = '';
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!reference.trim()) {
      toast.error('Please enter reference number');
      return;
    }
    if (!selectedFile) {
      toast.error('Please upload payment screenshot');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Processing payment...');

    try {
      const optimizedFile = await optimizeImage(selectedFile);
      
      const fileName = `city-payments/${participant}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, optimizedFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('city_vip_participants')
        .update({
          payment_status: 'pending_verification',
          payment_proof_url: publicUrl,
          reference: reference,
          payment_submitted_at: new Date().toISOString()
        })
        .eq('id', participant);
      
      if (updateError) throw updateError;
      
      const { data: updatedParticipant } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('id', participant)
        .single();
      
      setParticipantData(updatedParticipant);
      setTicketGenerated(true);
      
      toast.success('Payment submitted! Your unverified ticket is ready', { id: loadingToast });
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to submit payment', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const seatNumbersArray = seats ? (typeof seats === 'string' ? seats.split(',') : seats) : [];
  const totalAmount = amount || (seatNumbersArray.length * 500);
  const cityName = city || (participantData?.city?.split('|')[0] || 'City');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (ticketGenerated && participantData) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => router.back()} 
              className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center gap-1"
            >
              ← Back
            </button>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-center mb-6">🎫 Your City VIP Ticket</h2>
              <CityTicket
                participant={participantData}
                cityName={cityName}
                type="unverified"
              />
              <div className="text-center mt-6">
                <p className="text-sm text-yellow-600">
                  ⏳ This is an UNVERIFIED ticket. Your seats will be confirmed after admin verifies your payment.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Complete Payment - City VIP | Abbaa Carraa</title>
      </Head>

      <div className="min-h-screen bg-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <button 
            onClick={() => router.back()} 
            className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 text-white">
              <h1 className="text-2xl font-bold">Complete Payment</h1>
              <p className="text-sm opacity-80 mt-1">City VIP Program - {cityName}</p>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                <p className="text-sm text-gray-600">Selected Seats</p>
                <p className="font-bold text-lg">{seatNumbersArray.join(', ')}</p>
                <p className="text-2xl font-bold text-green-600 mt-2">ETB {totalAmount.toLocaleString()}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="font-semibold text-sm mb-2">Send payment to:</p>
                <p className="font-mono text-sm">📱 TeleBirr: 0913277922</p>
                <p className="font-mono text-sm mt-1">🏦 CBE Bank: 1000601091686</p>
                <p className="text-xs text-gray-600 mt-2">Account Name: Negassa Hundessa</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reference Number *</label>
                  <input
                    type="text"
                    placeholder="Enter transaction ID"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bank Transfer Screenshot *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-500 transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="paymentScreenshot"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="paymentScreenshot" className="cursor-pointer">
                      {previewUrl ? (
                        <div>
                          <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                          <p className="text-green-600">✓ {selectedFile?.name}</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 mt-2">Click to upload screenshot</p>
                          <p className="text-xs text-gray-400">JPEG, PNG (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold mt-6 hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Submit Payment & Get Ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
