import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

function SubmissionFeedItem({ submission, player }) {
  const getStatusColor = (verdict) => {
    switch (verdict) {
      case 'OK':
        return 'text-green-400 bg-green-900/30 border-green-500'
      case 'WRONG_ANSWER':
        return 'text-red-400 bg-red-900/30 border-red-500'
      case 'TIME_LIMIT_EXCEEDED':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-500'
      default:
        return 'text-blue-300 bg-blue-900/30 border-blue-500'
    }
  }

  const getStatusText = (verdict) => {
    switch (verdict) {
      case 'OK':
        return 'AC'
      case 'WRONG_ANSWER':
        return 'WA'
      case 'TIME_LIMIT_EXCEEDED':
        return 'TLE'
      default:
        return verdict
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-3 rounded-lg border-2 mb-2 ${getStatusColor(submission.verdict)}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{player.handle}</span>
            <span className="text-sm opacity-75">
              {submission.problem.contestId}{submission.problem.index}
            </span>
          </div>
          <div className="text-xs mt-1 opacity-75">
            {formatTime(submission.creationTimeSeconds)}
          </div>
        </div>
        <div className={`px-3 py-1 rounded font-bold text-sm ${getStatusColor(submission.verdict)}`}>
          {getStatusText(submission.verdict)}
        </div>
      </div>
    </motion.div>
  )
}

export function SubmissionFeed({ submissions = [], players = [] }) {
  const [displayedSubmissions, setDisplayedSubmissions] = useState([])

  useEffect(() => {
    // Add new submissions with a delay for animation
    submissions.forEach((sub, index) => {
      setTimeout(() => {
        setDisplayedSubmissions(prev => {
          // Avoid duplicates
          if (prev.some(s => s.id === sub.id)) return prev
          return [sub, ...prev].slice(0, 20) // Keep last 20
        })
      }, index * 100)
    })
  }, [submissions])

  const getPlayer = (handle) => {
    return players.find(p => p.handle === handle) || { handle }
  }

  return (
    <div className="bg-blue-900/50 rounded-lg p-4 sonic-border max-h-96 overflow-y-auto">
      <h3 className="text-xl font-bold mb-4 text-sonic-gold">Live Submission Feed</h3>
      <AnimatePresence>
        {displayedSubmissions.length === 0 ? (
          <div className="text-center text-blue-300 py-8">
            No submissions yet...
          </div>
        ) : (
          displayedSubmissions.map(submission => {
            const player = getPlayer(submission.handle || '')
            return (
              <SubmissionFeedItem
                key={submission.id}
                submission={submission}
                player={player}
              />
            )
          })
        )}
      </AnimatePresence>
    </div>
  )
}

