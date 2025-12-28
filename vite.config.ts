import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@core': path.resolve(__dirname, './src/core'),
            '@personas': path.resolve(__dirname, './src/personas'),
            '@shared': path.resolve(__dirname, './src/shared'),
            '@types': path.resolve(__dirname, './src/types'),
        },
    },
})

