import { motion } from 'framer-motion'
import { memo } from 'react'

// Status types: 'AC' (Accepted), 'WA' (Wrong Answer), 'TLE' (Time Limit Exceeded), null (not attempted)
const ProblemCard = memo(({ problem, sonicPoints, status, solvedBy, onClick }) => {
  const problemUrl = `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
  
  // Determine status styling
  const getStatusStyle = () => {
    switch (status) {
      case 'AC':
        return {
          bg: 'bg-green-900/40',
          border: 'border-green-500',
          text: 'text-green-400',
          badge: 'bg-green-600',
          label: 'AC'
        }
      case 'WA':
        return {
          bg: 'bg-red-900/40',
          border: 'border-red-500',
          text: 'text-red-400',
          badge: 'bg-red-600',
          label: 'WA'
        }
      case 'TLE':
        return {
          bg: 'bg-yellow-900/40',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          badge: 'bg-yellow-600',
          label: 'TLE'
        }
      default:
        return {
          bg: 'bg-blue-900/50',
          border: 'border-blue-600',
          text: 'text-blue-300',
          badge: null,
          label: null
        }
    }
  }
  
  const statusStyle = getStatusStyle()
  const isSolved = status === 'AC'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative p-4 rounded-lg border-2 transition-all ${statusStyle.bg} ${statusStyle.border} hover:border-sonic-gold`}
      style={{ willChange: 'auto' }}
    >
      {statusStyle.badge && (
        <div className={`absolute top-2 right-2 px-2 py-1 ${statusStyle.badge} text-white text-xs font-bold rounded`}>
          {statusStyle.label}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <a
            href={problemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-bold text-white hover:text-sonic-gold transition-colors"
          >
            {problem.contestId}{problem.index}. {problem.name}
          </a>
          {solvedBy && (
            <div className={`text-sm mt-1 ${statusStyle.text} font-semibold`}>
              ✓ Solved by: {solvedBy}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-sonic-gold neon-glow">
            {Math.round(sonicPoints)}
          </div>
          <div className="text-xs text-blue-300">Points</div>
        </div>
      </div>
    </motion.div>
  )
})

ProblemCard.displayName = 'ProblemCard'

export default ProblemCard
