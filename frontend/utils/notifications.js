// frontend/utils/notifications.js
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

export function sendNotification(title, body, icon = '/images/abbaa-carraa-bg.png') {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon });
  }
}

export function checkAndNotify(preferences, type, data) {
  if (!preferences?.push_enabled) return;
  
  if (type === 'win') {
    sendNotification(
      '🎉 Congratulations! You Won! 🎉',
      `You won ${data.poolName} worth ETB ${data.prizeAmount.toLocaleString()}!`,
      '/images/abbaa-carraa-bg.png'
    );
  }
}
