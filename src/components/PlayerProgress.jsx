import { motion, useAnimation } from 'framer-motion'
import { useEffect, useRef, memo } from 'react'

const PlayerProgress = memo(({ player, points, maxPoints, rank, previousPoints }) => {
  const percentage = maxPoints > 0 ? (points / maxPoints) * 100 : 0
  const previousPercentage = maxPoints > 0 && previousPoints !== undefined ? (previousPoints / maxPoints) * 100 : 0
  
  // Calculate animation speed based on points (higher points = faster)
  const animationDuration = Math.max(0.3, 2 - (points / maxPoints) * 1.7)
  
  // Sonic sprite position based on progress
  const spritePosition = `${percentage}%`
  const controls = useAnimation()
  const hasScoredRef = useRef(false)
  
  // Pulse animation when score updates
  useEffect(() => {
    if (previousPoints !== undefined && points > previousPoints) {
      hasScoredRef.current = true
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.5 }
      })
      setTimeout(() => {
        hasScoredRef.current = false
      }, 500)
    }
  }, [points, previousPoints, controls])
  
  const rankColors = {
    1: 'from-sonic-gold to-yellow-400',
    2: 'from-gray-300 to-gray-400',
    3: 'from-orange-600 to-orange-500',
    4: 'from-blue-400 to-blue-500'
  }
  
  const rankEmojis = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
    4: '🏃'
  }
  
  // Sonic running animation frames
  const sonicFrames = ['⚡', '💨', '⚡', '💨']
  
  return (
    <motion.div 
      className="relative mb-4"
      animate={controls}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{rankEmojis[rank] || '🏃'}</span>
          <span className="font-bold text-lg">{player.handle}</span>
          {player.rating > 0 && (
            <span className="text-sm text-blue-300">({player.rating})</span>
          )}
        </div>
        <motion.div 
          className="text-right"
          animate={hasScoredRef.current ? {
            scale: [1, 1.2, 1],
            color: ['#FFD700', '#FFFF00', '#FFD700']
          } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="text-xl font-bold text-sonic-gold">{points}</div>
          <div className="text-xs text-blue-300">points</div>
        </motion.div>
      </div>
      
      {/* Progress bar track */}
      <div className="track-lane h-8 rounded-full overflow-hidden relative">
        {/* Progress fill */}
        <motion.div
          initial={{ width: previousPercentage }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${rankColors[rank] || 'from-blue-500 to-blue-400'} shadow-lg relative`}
        >
          {/* Pulse effect on score update */}
          {hasScoredRef.current && (
            <motion.div
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-white/30 rounded-full"
            />
          )}
        </motion.div>
        
        {/* Enhanced Sonic sprite with running animation */}
        <motion.div
          initial={{ left: previousPercentage > 0 ? `${previousPercentage}%` : '0%' }}
          animate={{ left: spritePosition }}
          transition={{ 
            duration: 0.5,
            ease: 'easeOut'
          }}
          className="absolute top-0 h-8 w-8 flex items-center justify-center text-xl pointer-events-none"
          style={{ 
            transform: 'translateX(-50%)',
          }}
        >
          <span className="drop-shadow-lg">
            ⚡
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
})

PlayerProgress.displayName = 'PlayerProgress'

export default PlayerProgress
