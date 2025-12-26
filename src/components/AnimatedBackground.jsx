import { motion } from 'framer-motion'
import React from 'react'

const FloatingRing = React.memo(({ delay, x, y, duration }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.2, 0.4, 0.2],
        scale: [0.8, 1.1, 0.8],
        x: [0, 15, 0],
        y: [0, -20, 0],
      }}
      transition={{
        duration: duration || 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute text-sonic-gold/15 text-3xl pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, willChange: 'transform, opacity' }}
    >
      ⭕
    </motion.div>
  )
})

FloatingRing.displayName = 'FloatingRing'

const Checkpoint = React.memo(({ delay, x, y }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.15, 0.35, 0.15],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute text-sonic-blue/25 text-xl pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, willChange: 'transform, opacity' }}
    >
      🚩
    </motion.div>
  )
})

Checkpoint.displayName = 'Checkpoint'

// Memoize background positions to avoid recalculation
const BACKGROUND_ELEMENTS = (() => {
  const rings = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }))

  const checkpoints = Array.from({ length: 2 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
  }))
  
  return { rings, checkpoints }
})()

export const AnimatedBackground = React.memo(() => {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0, pointerEvents: 'none' }}>
      {BACKGROUND_ELEMENTS.rings.map(ring => (
        <FloatingRing
          key={ring.id}
          delay={ring.delay}
          x={ring.x}
          y={ring.y}
          duration={ring.duration}
        />
      ))}
      {BACKGROUND_ELEMENTS.checkpoints.map(checkpoint => (
        <Checkpoint
          key={checkpoint.id}
          delay={checkpoint.delay}
          x={checkpoint.x}
          y={checkpoint.y}
        />
      ))}
    </div>
  )
})

AnimatedBackground.displayName = 'AnimatedBackground'

