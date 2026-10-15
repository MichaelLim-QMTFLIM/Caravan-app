import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Caravan-app',
  webDir: 'www',
  // Keep Android and the local backend on the same scheme/site for cookie auth.
  server: {
    androidScheme: 'http',
  },
};

export default config;
