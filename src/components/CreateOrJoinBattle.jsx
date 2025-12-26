import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function CreateOrJoinBattle({ darkMode }) {
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const handleCreateBattle = () => {
    navigate('/')
  }

  const handleJoinBattle = () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code')
      return
    }
    // For now, just navigate to match - in future this could validate the invite code
    // and load the match configuration from a backend or shared storage
    navigate(`/match?invite=${inviteCode.trim()}`)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : ''}`}>
      <div className={`max-w-2xl w-full rounded-2xl p-8 md:p-12 shadow-2xl ${
        darkMode
          ? 'bg-gray-800/90 border-2 border-gray-700'
          : 'bg-blue-900/90 border-2 border-sonic-gold/50'
      }`}>
        <h1 className={`text-4xl md:text-5xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-sonic-gold'} neon-glow`}>
          ⚔️ Create or Join Battle
        </h1>

        <div className="space-y-6">
          {/* Create Battle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-xl border-2 ${
              darkMode
                ? 'bg-gray-700/50 border-gray-600'
                : 'bg-blue-800/50 border-blue-600'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-sonic-gold'}`}>
              🎮 Create New Battle
            </h2>
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-blue-200'}`}>
              Set up a new competitive coding battle with custom rules, problems, and players.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateBattle}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl relative ${
                darkMode
                  ? 'bg-gradient-to-r from-sonic-gold via-yellow-500 to-sonic-gold text-gray-900 hover:from-yellow-400 hover:via-sonic-gold hover:to-yellow-400'
                  : 'bg-gradient-to-r from-sonic-gold via-yellow-500 to-sonic-gold text-blue-900 hover:from-yellow-400 hover:via-sonic-gold hover:to-yellow-400'
              }`}
              style={{ zIndex: 15, pointerEvents: 'auto' }}
            >
              Create Battle ⚡
            </motion.button>
          </motion.div>

          {/* Join Battle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-xl border-2 ${
              darkMode
                ? 'bg-gray-700/50 border-gray-600'
                : 'bg-blue-800/50 border-blue-600'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-sonic-gold'}`}>
              🔗 Join Battle
            </h2>
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-blue-200'}`}>
              Enter an invite code to join an existing battle.
            </p>
            
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 bg-red-900/50 border-2 border-red-500 rounded-lg text-red-100 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value)
                  setError('')
                }}
                placeholder="Enter invite code (e.g., match-1234567890-abc123)"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  darkMode
                    ? 'bg-gray-900/50 border-gray-600 text-white focus:border-sonic-gold focus:ring-2 focus:ring-sonic-gold/50'
                    : 'bg-blue-900/50 border-blue-500 text-white focus:border-sonic-gold focus:ring-2 focus:ring-sonic-gold/50'
                } focus:outline-none`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinBattle()
                  }
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinBattle}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl relative ${
                  darkMode
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
                }`}
                style={{ zIndex: 15, pointerEvents: 'auto' }}
              >
                Join Battle 🚀
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CreateOrJoinBattle

