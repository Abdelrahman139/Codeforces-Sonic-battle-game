import { motion } from 'framer-motion'

function EmojiBurst({ emoji, id }) {
  // Generate multiple particles for burst effect
  const particleCount = 8
  const particles = Array.from({ length: particleCount }, (_, i) => i)
  
  return (
    <>
      {particles.map((particleIndex) => {
        const angle = (particleIndex / particleCount) * Math.PI * 2
        const distance = 150 + Math.random() * 50
        const delay = Math.random() * 0.2
        
        return (
          <motion.div
            key={`${id}-${particleIndex}`}
            initial={{
              scale: 0,
              opacity: 1,
              x: 0,
              y: 0
            }}
            animate={{
              scale: [0, 1.2, 0.8, 0],
              opacity: [1, 1, 0.8, 0],
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              rotate: [0, 360]
            }}
            transition={{
              duration: 1.5,
              delay,
              ease: 'easeOut'
            }}
            className="fixed pointer-events-none z-50 text-4xl"
            style={{
              left: '50%',
              top: '50%',
            }}
          >
            {emoji}
          </motion.div>
        )
      })}
    </>
  )
}

export default EmojiBurst
