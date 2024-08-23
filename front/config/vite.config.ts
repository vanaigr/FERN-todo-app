import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
    let server_url = command === 'serve' ? 'http://localhost:2999' : '/'

    return {
        root: './src',
        plugins: [react()],
        define: {
            __SERVER_URL__: JSON.stringify(server_url),
        },
        build: {
            outDir: '../dist'
        },
    }
})
