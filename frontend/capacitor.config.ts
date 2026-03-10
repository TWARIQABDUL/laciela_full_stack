import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lacielo.app',
  appName: 'La Cielo',
  webDir: 'build',
  server: {
    cleartext: true
  }
};

export default config;
