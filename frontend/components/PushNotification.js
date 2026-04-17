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
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key (generate this first)
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription)
        });
      }

      setIsSubscribed(true);
      setShowPrompt(false);
      toast.success('Notifications enabled! You will receive updates.');
    } catch (error) {
      console.error('Push subscription error:', error);
      toast.error('Failed to enable notifications');
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!isSupported || isSubscribed) return null;

  return (
    <>
      {!showPrompt && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => setShowPrompt(true)}
            className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700"
          >
            🔔 Enable Notifications
          </button>
        </div>
      )}

      {showPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-2">Enable Notifications</h3>
            <p className="text-gray-600 mb-4">
              Get notified when:
              • Your pool reaches target
              • Draws are happening
              • You win a prize!
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
