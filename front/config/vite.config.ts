import type { UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default {
    root: './src',
    plugins: [react()],
    build: {
        outDir: '../dist'
    },
} satisfies UserConfig
