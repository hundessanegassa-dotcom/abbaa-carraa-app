/**
 * Push Notification Utilities for Abbaa Carraa
 * Supports browser notifications for winners, pool updates, and reminders
 */

// Request permission for browser notifications
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    }
  }
  
  console.log('Notification permission denied');
  return false;
}

// Send a browser notification
export function sendNotification(title, body, icon = '/images/abbaa-carraa-bg.png', url = null) {
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  const notification = new Notification(title, {
    body: body,
    icon: icon,
    badge: '/images/abbaa-carraa-bg.png',
    tag: 'abbaa-carraa',
    renotify: true,
    vibrate: [200, 100, 200],
  });

  if (url) {
    notification.onclick = () => {
      window.focus();
      window.open(url, '_blank');
    };
  }

  return true;
}

// Subscribe to push notifications (for service workers)
export async function subscribeToPushNotifications(userId, registration) {
  try {
    // Generate VAPID keys (you'll need to add these to your env)
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.log('VAPID public key not configured');
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Save subscription to your backend
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription,
      }),
    });

    if (response.ok) {
      console.log('Push subscription saved');
      return true;
    }
  } catch (error) {
    console.error('Push subscription error:', error);
  }
  return false;
}

// Helper function to convert VAPID key
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

// Send winner notification (to be called when user wins)
export function notifyWinner(poolName, prizeAmount, poolUrl) {
  sendNotification(
    '🎉 Congratulations! You Won! 🎉',
    `You have won the ${poolName} prize pool worth ETB ${prizeAmount.toLocaleString()}! Click to claim your prize.`,
    '/images/abbaa-carraa-bg.png',
    poolUrl
  );
}

// Send pool update notification
export function notifyPoolUpdate(poolName, message, poolUrl) {
  sendNotification(
    `📢 ${poolName} Update`,
    message,
    '/images/abbaa-carraa-bg.png',
    poolUrl
  );
}

// Send reminder notification
export function notifyReminder(poolName, daysLeft, poolUrl) {
  sendNotification(
    `⏰ Pool Ending Soon!`,
    `${poolName} ends in ${daysLeft} days. Join now for a chance to win!`,
    '/images/abbaa-carraa-bg.png',
    poolUrl
  );
}

// Send charity notification
export function notifyCharityUpdate(amount) {
  sendNotification(
    '💚 Making a Difference!',
    `Abbaa Carraa has donated ETB ${amount.toLocaleString()} to support kidney & heart disease patients. Thank you for being part of this!`,
    '/images/abbaa-carraa-bg.png',
    '/about#charity'
  );
}

// Check and send notifications based on user preferences
export function checkAndNotify(userPreferences, type, data) {
  if (!userPreferences?.push_enabled) return;
  
  switch (type) {
    case 'win':
      notifyWinner(data.poolName, data.prizeAmount, data.poolUrl);
      break;
    case 'pool_update':
      notifyPoolUpdate(data.poolName, data.message, data.poolUrl);
      break;
    case 'reminder':
      notifyReminder(data.poolName, data.daysLeft, data.poolUrl);
      break;
    case 'charity':
      notifyCharityUpdate(data.amount);
      break;
    default:
      console.log('Unknown notification type');
  }
}
