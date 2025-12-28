import { motion } from 'framer-motion'
import { useState } from 'react'
import sonicAvatar from '../assets/sonic-avatar.png'
import '../sonic-loader.css' // Ensure we have the loader styles available

function SonicCountdown({ countdown, inviteLink, darkMode }) {
  const [isCopied, setIsCopied] = useState(false)

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

  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      }).catch((err) => {
        console.error('Failed to copy:', err)
        // Fallback or just ignore if it fails silently
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mt-8 p-10 rounded-3xl border-2 backdrop-blur-xl relative overflow-hidden transition-all duration-300 ${darkMode
        ? 'bg-gray-900/80 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)]'
        : 'bg-blue-900/80 border-sonic-gold/50 shadow-[0_0_50px_rgba(251,191,36,0.3)]'
        }`}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="flex flex-col items-center text-center z-10 relative">

        {/* Sonic Avatar with Neon Ring */}
        <div className="sonic-neon-container mb-8 scale-110">
          <div className="sonic-avatar-container">
            <div className="sonic-ring-spinner"></div>
            <img
              src={sonicAvatar}
              alt="Sonic Waiting"
              className="sonic-avatar"
            />
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-8">
          <div className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-2">Time Until Battle</div>
          <div className={`text-6xl md:text-8xl font-black tabular-nums tracking-tight loading-text`}>
            {formatTime(countdown)}
          </div>
        </div>

        <p className={`text-xl font-medium mb-8 max-w-lg ${darkMode ? 'text-gray-300' : 'text-blue-100'}`}>
          Sharpen your claws! The zone is loading and the battle will start automatically.
        </p>

        {/* Invite Link Section */}
        {inviteLink && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`w-full max-w-2xl p-1 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-[2px]`}
          >
            <div className={`p-5 rounded-2xl ${darkMode ? 'bg-gray-900' : 'bg-blue-950'} h-full`}>
              <label className="block text-xs font-bold uppercase tracking-wider text-center text-blue-400 mb-3">
                <span className="mr-2">🔗</span>  Invite Challengers
              </label>

              <div className="flex flex-col md:flex-row gap-3">
                <div className={`flex-1 flex items-center px-4 py-3 rounded-xl border border-white/10 ${darkMode ? 'bg-black/40' : 'bg-black/30'} min-w-0 overflow-hidden`}>
                  <code className="text-sm text-blue-200 truncate font-mono select-all w-full">
                    {inviteLink}
                  </code>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 min-w-[140px] ${isCopied
                    ? 'bg-blue-600 text-white shadow-blue-500/20'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white shadow-green-500/20'
                    }`}
                >
                  <motion.span
                    key={isCopied ? "copied" : "copy"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {isCopied ? "COPIED! ✓" : "COPY"}
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default SonicCountdown

