import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

const REPO_NAME = 'folk-art-portfolio';
const IS_BETA = process.env.DEPLOY_ENV === 'beta';
const base = IS_BETA ? `/${REPO_NAME}/beta/` : `/${REPO_NAME}/`;

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
