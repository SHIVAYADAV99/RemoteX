import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
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
    define: {
    },
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
