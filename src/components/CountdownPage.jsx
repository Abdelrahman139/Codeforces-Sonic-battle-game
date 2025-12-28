import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SonicCountdown from './SonicCountdown'

function CountdownPage() {
  const navigate = useNavigate()
  const [matchConfig, setMatchConfig] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [inviteLink, setInviteLink] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return saved === 'true'
    }
    return document.body.classList.contains('dark-mode')
  })

  useEffect(() => {
    const inviteParam = new URLSearchParams(window.location.search).get('invite')
    let config = sessionStorage.getItem('matchConfig')

    // If no config in sessionStorage but we have an invite param, try localStorage
    if (!config && inviteParam) {
      config = localStorage.getItem(`matchConfig_${inviteParam}`)
      if (config) {
        sessionStorage.setItem('matchConfig', config)
      }
    }

    if (!config) {
      navigate('/')
      return
    }

    try {
      const parsed = JSON.parse(config)
      setMatchConfig(parsed)

      const startTime = parsed.startTime || Date.now()
      const now = Date.now()
      const initialCountdown = Math.max(0, startTime - now)
      setCountdown(initialCountdown)

      // Generate serverless invite link with encoded config
      const configString = JSON.stringify(parsed)
      // Use btoa for base64 encoding (handle unicode with encodeURIComponent)
      const encodedConfig = btoa(unescape(encodeURIComponent(configString)))
      const inviteUrl = `https://Abdelrahman139.github.io/Codeforces-Sonic-battle-game/#/?invite=${encodedConfig}`
      setInviteLink(inviteUrl)

      // Start countdown timer
      const interval = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, startTime - now)
        setCountdown(remaining)

        // When countdown reaches 0, navigate to home page (match will start there)
        if (remaining <= 0) {
          clearInterval(interval)
          navigate('/')
        }
      }, 1000)

      return () => clearInterval(interval)
    } catch (err) {
      console.error('Error loading match config:', err)
      navigate('/')
    }
  }, [navigate])

  // Listen for dark mode changes from navigation bar only
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      setDarkMode(e.detail)
    }
    window.addEventListener('darkModeChange', handleDarkModeChange)
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange)
  }, [])

  // Sync dark mode state with body class (but don't dispatch event - nav bar controls it)
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  if (!matchConfig) {
    return null
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 pt-20 relative transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`} style={{ zIndex: 10 }}>
      <div className="max-w-4xl mx-auto relative" style={{ zIndex: 10 }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 neon-glow" style={{ color: '#FFD700' }}>
            ⚡ Battle Starting Soon ⚡
          </h1>
        </div>

        <SonicCountdown
          countdown={countdown}
          inviteLink={inviteLink}
          darkMode={darkMode}
        />
      </div>
    </div>
  )
}

export default CountdownPage

