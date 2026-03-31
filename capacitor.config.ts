import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.areca.app",
  appName: "Areca ERP",
  webDir: ".next",
  server: {
    androidScheme: "https",
  },
};

export default config;
