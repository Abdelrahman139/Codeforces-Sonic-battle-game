import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import sonicRunningGif from '../assets/sonic-running.gif'

function SonicCountdown({ countdown, inviteLink, darkMode, onCopy }) {
  const [animationFrame, setAnimationFrame] = useState(0)

  // ... (interval effect can be removed or kept, doesn't hurt) ...
  useEffect(() => {
    // We can keep this if we want to use frames later, but for GIF it's not needed
    // Leaving it to minimize diff noise or removing it if unused.
    // Let's remove it for cleanliness as we use a GIF now.
  }, [])

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-6 p-8 bg-gradient-to-br from-purple-900/60 to-blue-900/60 border-2 border-sonic-gold rounded-2xl shadow-2xl"
    >
      <div className="text-center">
        {/* Sonic Running Animation */}
        <div className="mb-6 relative h-32 flex justify-center items-center overflow-hidden">
          <img
            src={sonicRunningGif}
            alt="Sonic Waiting"
            className="h-full object-contain"
          />
        </div>

        {/* Countdown Timer */}
        <div className={`text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-sonic-gold'} neon-glow flex items-center justify-center gap-3`}>
          <span>{formatTime(countdown)}</span>
        </div>

        <p className={`text-xl font-semibold mb-6 ${darkMode ? 'text-gray-300' : 'text-blue-200'}`}>
          Battle will start automatically!
        </p>

        {/* Invite Link */}
        {inviteLink && (
          <div className="mt-6 p-4 bg-green-900/40 border-2 border-green-500 rounded-xl">
            <label className={`block text-sm font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-green-300'}`}>
              📤 Invite Link (Share with players):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-2 bg-black/50 border border-green-600 rounded-lg text-white text-sm font-mono"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCopy}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all relative"
                style={{ zIndex: 15, pointerEvents: 'auto' }}
              >
                Copy
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default SonicCountdown

