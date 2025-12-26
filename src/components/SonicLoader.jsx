import { motion } from 'framer-motion'
import sonicRunningGif from '../assets/sonic-running.gif'
import '../sonic-loader.css'

export function SonicLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900/90 border border-white/10 rounded-2xl p-10 text-center relative max-w-sm w-full shadow-2xl overflow-hidden"
      >
        {/* Background Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -z-10 animate-pulse"></div>

        <div className="flex flex-col items-center justify-center relative">
          {/* Sonic Running GIF */}
          <div className="relative mb-6 mt-4">
            <img
              src={sonicRunningGif}
              alt="Sonic Running"
              className="w-32 h-auto object-contain"
            />
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden border border-gray-700 mb-6 relative shadow-inner">
            {/* Green Hill Zone Style Bar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute top-0 left-0 w-1/2 h-full green-hill-bar rounded-full"
            >
              <div className="green-hill-grass"></div>
            </motion.div>
          </div>

          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 neon-glow">
            {message}
          </h3>
          <p className="text-blue-200/60 text-sm animate-pulse">Gotta Go Fast!</p>
        </div>
      </motion.div>
    </div>
  )
}

export function InlineSonicLoader({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="text-center relative">
        <div className="relative mb-4 mx-auto w-24">
          <img
            src={sonicRunningGif}
            alt="Sonic Running"
            className="w-full h-auto object-contain"
          />
        </div>
        <p className="text-blue-200 font-medium text-lg animate-pulse">{message}</p>
      </div>
    </div>
  )
}

