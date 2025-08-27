import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/gcd": {
        target: "http://65.21.150.222:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

