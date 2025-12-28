import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

function Navigation() {
  const location = useLocation()
  // Force dark mode
  const [darkMode] = useState(true)

  // Sync dark mode with body class
  useEffect(() => {
    document.body.classList.add('dark-mode')
    localStorage.setItem('darkMode', 'true')
  }, [])


  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-900/95 to-blue-800/95 backdrop-blur-md border-b-2 border-sonic-gold/50 shadow-lg" style={{ zIndex: 50 }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <button
            onClick={() => {
              sessionStorage.removeItem('matchConfig')
              if (location.pathname === '/') {
                window.location.reload()
              } else {
                window.location.href = '#/'
              }
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-3xl"
            >
              ⚡
            </motion.div>
            <span className="text-xl font-bold text-sonic-gold neon-glow">
              SONIC BATTLE
            </span>
          </button>

          {/* Navigation Links and Dark Mode Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                // Clear match state to allow creating a new one
                sessionStorage.removeItem('matchConfig')
                // Force navigation to home/lobby
                if (location.pathname === '/') {
                  window.location.reload()
                } else {
                  window.location.href = '#/'
                }
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 relative ${isActive('/') && location.pathname === '/'
                ? 'bg-sonic-gold text-blue-900 shadow-lg shadow-yellow-500/50'
                : 'text-white hover:bg-blue-700/50 cursor-pointer'
                }`}
              style={{ zIndex: 15, pointerEvents: 'auto' }}
            >
              Home
            </button>
            {location.pathname === '/results' && (
              <span className="px-4 py-2 rounded-lg font-semibold bg-green-600/80 text-white">
                Results
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

