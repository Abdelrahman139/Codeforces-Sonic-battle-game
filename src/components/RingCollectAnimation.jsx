import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function RingCollectAnimation({ show, onComplete }) {
  const [visible, setVisible] = useState(show)
  
  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])
  
  if (!visible) return null
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, rotate: 0, opacity: 1 }}
        animate={{ scale: 2, rotate: 360, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-6xl"
      >
        💎
      </motion.div>
    </div>
  )
}

export default RingCollectAnimation
