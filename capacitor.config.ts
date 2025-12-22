import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.buntinggpt.bunting',
  appName: 'bunting',
  webDir: 'dist',
  server: {
    url: 'https://buntinggpt.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#1a365d',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a365d'
    }
  }
};

export default config;
