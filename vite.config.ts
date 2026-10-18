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
    server: {
        // Vite refuses requests whose Host header is not localhost, which blocks tunnelled and
        // sandboxed previews. Pass the hostname(s) you reach it by; without this the default
        // same-origin protection stays in force.
        allowedHosts: process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',') : undefined,
    },
})

