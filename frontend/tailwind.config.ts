import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parking: {
          available: '#10b981',
          occupied: '#ef4444',
          reserved: '#f59e0b',
          outOfService: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}

export default config
