import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/wb/statistics": {
        target: "https://statistics-api.wildberries.ru",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/wb\/statistics/, ""),
      },
    },
  },
});
