import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PREVIEWER_PORT || 6556}`,
        changeOrigin: true,
      },
    },
  },
});
