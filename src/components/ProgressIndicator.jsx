import { motion } from 'framer-motion'
import { SonicLoader } from './SonicLoader'

export function ProgressIndicator({ message = 'Loading...' }) {
  return <SonicLoader message={message} />
}

export function InlineProgress({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-sonic-gold border-t-transparent rounded-full mx-auto mb-3"
        />
        <p className="text-blue-200 font-medium">{message}</p>
      </div>
    </div>
  )
}

