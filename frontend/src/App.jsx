import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <main className="app">
      <h1>LankaLink</h1>
      <p>Remote family &amp; property care for the Sri Lankan diaspora.</p>
      <p className="status">
        API: {error ? `unreachable (${error})` : health ? `${health.status}, database ${health.db}` : 'checking…'}
      </p>
    </main>
  )
}

export default App
