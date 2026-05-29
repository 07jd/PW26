import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

const root_folder = path.resolve(__dirname, "src");
const out_folder = path.resolve(__dirname, "dist");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: root_folder,
  build: {
    outDir: out_folder,
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        main: path.resolve(root_folder, "index.html"),
        auth: path.resolve(root_folder, "auth.html"),
        dashboard: path.resolve(root_folder, "dashboard.html"),
      },
    },
  },
  server: {
    proxy: {
      "/user": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/plan": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/user/session": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/herb": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/lote": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/herb/get/": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/herb/upload/": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
