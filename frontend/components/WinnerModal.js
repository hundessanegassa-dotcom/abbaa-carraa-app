import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function WinnerModal({ poolId, isOpen, onClose }) {
  const { t } = useTranslation();
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawDetails, setDrawDetails] = useState(null);

  useEffect(() => {
    if (isOpen && poolId) {
      fetchWinner();
    }
  }, [isOpen, poolId]);

  async function fetchWinner() {
    setLoading(true);
    try {
      // Fetch winner info
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select(`
          id,
          prize_name,
          winner_id,
          profiles!winner_id (full_name)
        `)
        .eq('id', poolId)
        .single();

      if (poolError) throw poolError;

      // Fetch draw details
      const { data: draw, error: drawError } = await supabase
        .from('draws')
        .select('*')
        .eq('pool_id', poolId)
        .single();

      if (drawError && drawError.code !== 'PGRST116') throw drawError;

      setWinner(pool);
      setDrawDetails(draw);
    } catch (error) {
      console.error('Error fetching winner:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-600">
              🏆 {t('draw.winner_announced')}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">{t('common.loading')}</p>
            </div>
          ) : winner ? (
            <div className="space-y-4">
              {/* Winner Badge */}
              <div className="text-center py-4 bg-green-50 rounded-lg">
                <div className="text-5xl mb-2">🎉</div>
                <p className="text-sm text-gray-600">{t('draw.congratulations')}</p>
                <p className="text-xl font-bold text-green-700">
                  {winner.profiles?.full_name || 'Anonymous Winner'}
                </p>
              </div>

              {/* Prize Info */}
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">{t('pools.winner_gets')}</p>
                <p className="font-bold text-lg">{winner.prize_name}</p>
              </div>

              {/* Cryptographic Proof */}
              {drawDetails && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold mb-2">🔐 {t('draw.verified_draw')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">{t('draw.random_seed')}:</span> <code className="text-xs break-all">{drawDetails.random_seed}</code></p>
                    <p><span className="text-gray-500">{t('draw.ticket_count')}:</span> {drawDetails.ticket_count}</p>
                    <p><span className="text-gray-500">{t('draw.draw_date')}:</span> {new Date(drawDetails.created_at).toLocaleString()}</p>
                    <p className="text-green-600 text-xs mt-2">✓ {t('draw.verified_draw')}</p>
                  </div>
                </div>
              )}

              {/* Prize Claim Instruction */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  📞 {t('draw.prize_claim_instruction') || 'The winner will be contacted within 24 hours for prize delivery.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('draw.no_winner_yet') || 'Draw not completed yet.'}</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
