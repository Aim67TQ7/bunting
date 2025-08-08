
export const DEMO_KEY = 'demoMode';
export const DEMO_EMAIL_KEY = 'demoEmail';

export const isDemoMode = (): boolean => {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(DEMO_KEY) === 'true';
  } catch {
    return false;
  }
};

export const enableDemoMode = (email: string = 'demo@buntingmagnetics.com') => {
  try {
    localStorage.setItem(DEMO_KEY, 'true');
    localStorage.setItem(DEMO_EMAIL_KEY, email);
  } catch {}
};

export const disableDemoMode = () => {
  try {
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(DEMO_EMAIL_KEY);
  } catch {}
};

export const getDemoEmail = (): string | null => {
  try {
    return localStorage.getItem(DEMO_EMAIL_KEY);
  } catch {
    return null;
  }
};
