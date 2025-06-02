
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.72364e37ccc64ae3a9354ac2f1f66316',
  appName: 'bunting',
  webDir: 'dist',
  server: {
    url: 'https://72364e37-ccc6-4ae3-a935-4ac2f1f66316.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a365d',
      showSpinner: false
    }
  }
};

export default config;
