import { motion } from 'framer-motion'
import sonicAvatar from '../assets/sonic-avatar.png'
import '../sonic-loader.css'

export function SonicLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="sonic-neon-container">
        {/* Avatar with Spinning Rings */}
        <div className="sonic-avatar-container">
          <div className="sonic-ring-spinner"></div>
          <img
            src={sonicAvatar}
            alt="Sonic Loading"
            className="sonic-avatar"
          />
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold loading-text mb-2">
            {message}
          </h2>
          <p className="loading-subtext">
            Preparing the Zone...
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export function InlineSonicLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
        <div className="sonic-ring-spinner" style={{ borderWidth: '3px' }}></div>
        <img
          src={sonicAvatar}
          alt="Sonic Loading"
          className="w-20 h-20 rounded-full object-contain drop-shadow-lg"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        />
      </div>
      <p className="text-blue-300 font-bold tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  )
}

