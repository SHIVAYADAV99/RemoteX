import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    plugins: [react()],
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
            'events': path.resolve(__dirname, 'src/libs/polyfills/events.js'),
            'stream': path.resolve(__dirname, 'src/libs/polyfills/stream.js'),
            'util': path.resolve(__dirname, 'src/libs/polyfills/util.js'),
            'buffer': path.resolve(__dirname, 'src/libs/polyfills/buffer.js'),
            'process': path.resolve(__dirname, 'src/libs/polyfills/process.js'),
            'inherits': path.resolve(__dirname, 'src/libs/polyfills/inherits.js')
        }
    }
})
