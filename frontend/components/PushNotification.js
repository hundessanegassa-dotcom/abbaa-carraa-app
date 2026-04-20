import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function PushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription)
        });
      }

      setIsSubscribed(true);
      setShowPrompt(false);
      toast.success('Notifications enabled!');
    } catch (error) {
      console.error('Push subscription error:', error);
      toast.error('Failed to enable notifications');
    }
  }

  if (!isSupported || isSubscribed) return null;

  return (
    <>
      {!showPrompt && (
        <div className="fixed bottom-20 left-4 z-50">
          <button
            onClick={() => setShowPrompt(true)}
            className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition"
            aria-label="Enable notifications"
          >
            🔔
          </button>
        </div>
      )}

      {showPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-2">Enable Notifications</h3>
            <p className="text-gray-600 mb-4">
              Get notified when:
              <br />• Your pool reaches target
              <br />• Draws are happening
              <br />• You win a prize!
            </p>
            <div className="flex space-x-3">
              <button
                onClick={subscribeToPush}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Allow
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
