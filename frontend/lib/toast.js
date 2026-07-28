// lib/toast.js - Safe toast wrapper with no SSR issues
let toastModule = null;

// Lazy load toast only on client side
export async function getToast() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!toastModule) {
    try {
      const module = await import('react-hot-toast');
      toastModule = module.default;
    } catch (error) {
      console.error('Failed to load toast:', error);
      return null;
    }
  }
  
  return toastModule;
}

// Safe toast functions
export async function showToast(message, type = 'success') {
  const toast = await getToast();
  if (!toast) return;
  
  if (type === 'success') toast.success(message);
  else if (type === 'error') toast.error(message);
  else if (type === 'loading') toast.loading(message);
  else if (type === 'custom') toast.custom(message);
  else toast(message);
}

// Sync version for use in event handlers (uses useEffect to load)
let toastInstance = null;
let toastLoading = false;
let toastCallbacks = [];

// Load toast once on client
if (typeof window !== 'undefined') {
  import('react-hot-toast').then(module => {
    toastInstance = module.default;
    toastLoading = false;
    // Execute queued callbacks
    toastCallbacks.forEach(cb => cb(toastInstance));
    toastCallbacks = [];
  });
}

export function toastSync(message, type = 'success') {
  if (typeof window === 'undefined') return;
  
  if (toastInstance) {
    if (type === 'success') toastInstance.success(message);
    else if (type === 'error') toastInstance.error(message);
    else toastInstance(message);
  } else {
    // Queue the toast for when it loads
    toastCallbacks.push((toast) => {
      if (type === 'success') toast.success(message);
      else if (type === 'error') toast.error(message);
      else toast(message);
    });
  }
}
