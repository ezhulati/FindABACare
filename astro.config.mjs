import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: true
    },
    imageService: false
  }),
  integrations: [
    react()
  ],
  server: {
    port: 4321
  },
});
