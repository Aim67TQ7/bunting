
// Utility to detect if the app is running in a native mobile container
export function isNativeMobile(): boolean {
  // Check for Capacitor
  return !!(window as any).Capacitor;
}

// Detect specific platforms
export function isIOS(): boolean {
  if (isNativeMobile()) {
    return (window as any).Capacitor?.getPlatform?.() === 'ios';
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (isNativeMobile()) {
    return (window as any).Capacitor?.getPlatform?.() === 'android';
  }
  return /Android/.test(navigator.userAgent);
}

// Get safe area values for manual calculations if needed
export function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  return {
    top: style.getPropertyValue('--safe-area-inset-top') || '0px',
    right: style.getPropertyValue('--safe-area-inset-right') || '0px',
    bottom: style.getPropertyValue('--safe-area-inset-bottom') || '0px',
    left: style.getPropertyValue('--safe-area-inset-left') || '0px',
  };
}
