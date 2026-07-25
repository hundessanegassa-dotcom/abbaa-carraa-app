// components/SeatSelector.js - Backwards compatible wrapper around SeatMap.
// New code should use SeatCheckout (seats + payment + ticket) or SeatMap.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SeatMap from './SeatMap';

export {
  TIERS,
  TIER_IDS,
  VIP_POOLS,
  getTierConfig,
  getTierLabel,
  getDrawScheduleText
} from '../lib/seatPrograms';

export default function SeatSelector({
  onClose,
  onCancel,
  onSeatsSelected,
  user: userProp,
  ...props
}) {
  const [user, setUser] = useState(userProp || null);

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      return;
    }
    let cancelled = false;
    supabase?.auth.getUser().then(({ data }) => {
      if (!cancelled) setUser(data?.user || null);
    });
    return () => {
      cancelled = true;
    };
  }, [userProp]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 overflow-y-auto p-2 sm:p-4">
      <div className="max-w-4xl mx-auto my-4">
        <SeatMap {...props} user={user} onConfirm={onSeatsSelected} onCancel={onCancel || onClose} />
      </div>
    </div>
  );
}
