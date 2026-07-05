import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  build: {
    target: 'es2020', // Modern JS — avoids unnecessary transpilation for older browsers
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split large vendor libs into separate chunks for parallel download + caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query': ['@tanstack/react-query'],
          'framer-motion': ['framer-motion'],
          'recharts': ['recharts'],
          'dnd': ['@hello-pangea/dnd'],
          'hook-form': ['react-hook-form'],
        },
      },
    },
  },
});