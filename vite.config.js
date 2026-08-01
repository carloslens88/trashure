import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// HTTPS=1 activa certificado autofirmado: necesario para que el GPS funcione
// al probar desde el móvil en la red local (geolocalización exige contexto seguro).
export default defineConfig({
  plugins: [react(), process.env.HTTPS ? basicSsl() : undefined],
})
