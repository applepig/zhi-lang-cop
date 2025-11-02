import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  root: resolve(__dirname),
  server: {
    port: 5173
  },
  build: {
    outDir: resolve(__dirname, '../../dist'),
    emptyOutDir: true
  }
});
