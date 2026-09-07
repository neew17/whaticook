import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const USE_HTTPS = process.env.VITE_HTTPS !== '0'

// https://vite.dev/config/
export default defineConfig({
  // HTTPS no dev para liberar câmera (getUserMedia) e Web Share fora do localhost —
  // ambos exigem contexto seguro. Certificado é autoassinado: aceite o aviso no celular.
  // `VITE_HTTPS=0 npm run dev` desliga (útil para ferramentas que não aceitam cert self-signed).
  plugins: [react(), ...(USE_HTTPS ? [basicSsl()] : [])],
  server: {
    host: true,
  },
})
