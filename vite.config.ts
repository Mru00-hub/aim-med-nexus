import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: true
  },
  plugins: [react()], // Temporarily removed componentTagger()
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
