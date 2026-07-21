import { useState } from 'react'

function App() {
  const [status] = useState('Bootstrapped')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-emerald-400">Metropolis Parking</h1>
        <p className="mt-4 text-gray-400">System status: <span className="text-emerald-500 font-semibold">{status}</span></p>
      </div>
    </div>
  )
}

export default App
