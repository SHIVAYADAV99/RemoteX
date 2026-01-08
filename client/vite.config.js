const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const path = require('path')

module.exports = defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'global': 'window',
    'process': 'window.process'
  },
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'events': 'events',
      'stream': 'stream-browserify',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process',
      'inherits': 'inherits'
    }
  }
})