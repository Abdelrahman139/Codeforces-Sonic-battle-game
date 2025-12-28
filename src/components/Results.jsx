import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayerStatistics } from './PlayerStatistics'
import { Celebration } from './Celebration'

function Results() {
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [revealedMystery, setRevealedMystery] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('matchResults')
    if (stored) {
      setResults(JSON.parse(stored))
    } else {
      navigate('/')
    }
  }, [navigate])

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <motion.div
          animate={{
            x: [0, 30, -30, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🏃</div>
          <div className="text-2xl">Loading results...</div>
        </motion.div>
      </div>
    )
  }

  const { players, solvedProblems, mysteryProblemIndex, matchConfig } = results
  const solvedProblemsMap = new Map(solvedProblems)

  const handleRevealMystery = () => {
    setRevealedMystery(true)
  }

  const handleShareResults = () => {
    const shareUrl = `${window.location.origin}/results?match=${matchConfig?.matchId || 'current'}`

    if (navigator.share) {
      navigator.share({
        title: 'Sonic Battle Results',
        text: `Check out the results! Winner: ${players[0]?.handle || 'N/A'} with ${players[0]?.points || 0} points!`,
        url: shareUrl,
      }).catch(err => {
        console.log('Error sharing:', err)
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Results link copied to clipboard!')
      }).catch(() => {
        // Final fallback: show in prompt
        prompt('Copy this link to share:', shareUrl)
      })
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pt-20 relative" style={{ zIndex: 10 }}>
      {/* Celebration Effect for Winner */}
      {players.length > 0 && <Celebration />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 neon-glow" style={{ color: '#FFD700' }}>
            🏁 MATCH RESULTS 🏁
          </h1>
        </div>

        {/* Winner Announcement */}
        {players.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center mb-8 p-8 bg-gradient-to-r from-sonic-gold to-yellow-400 rounded-lg sonic-border"
          >
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-3xl md:text-4xl font-bold text-blue-900">
              Winner: {players[0].handle}
            </div>
            <div className="text-2xl text-blue-800 mt-2">
              {players[0].points} Sonic Points
            </div>
          </motion.div>
        )}

        {/* Final Leaderboard */}
        <div className="mb-8 bg-blue-900/50 rounded-lg p-6 sonic-border">
          <h2 className="text-2xl font-bold mb-4 text-sonic-gold">Final Standings</h2>
          <div className="space-y-4">
            {players.map((player, index) => (
              <motion.div
                key={player.handle}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-blue-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏃'}
                  </span>
                  <div>
                    <div className="text-xl font-bold">{player.handle}</div>
                    {player.playerInfo?.rating > 0 && (
                      <div className="text-sm text-blue-300">Rating: {player.playerInfo.rating}</div>
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-sonic-gold">
                  {player.points} pts
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mystery Problem Reveal */}
        {!revealedMystery && mysteryProblemIndex >= 0 && (
          <div className="mb-8 text-center">
            <button
              onClick={handleRevealMystery}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-xl transition-all transform hover:scale-105"
            >
              🔮 Reveal Mystery Problem (2x Points!)
            </button>
          </div>
        )}

        {revealedMystery && mysteryProblemIndex >= 0 && matchConfig?.problems && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 bg-purple-900/50 rounded-lg p-6 sonic-border"
          >
            <h2 className="text-2xl font-bold mb-4 text-purple-300">🔮 Mystery Problem</h2>
            {(() => {
              const mysteryProblem = matchConfig.problems[mysteryProblemIndex]
              const problemId = `${mysteryProblem.contestId}-${mysteryProblem.index}`
              const solved = solvedProblemsMap.get(problemId)

              return (
                <div className="p-4 bg-purple-800/50 rounded-lg">
                  <div className="text-xl font-bold mb-2">
                    {mysteryProblem.contestId}{mysteryProblem.index}. {mysteryProblem.name}
                  </div>
                  <div className="text-lg text-purple-200">
                    This problem awarded <span className="font-bold text-sonic-gold">2x points</span>!
                  </div>
                  {solved && (
                    <div className="mt-2 text-green-400">
                      ✓ Solved by {solved.handle}
                    </div>
                  )}
                </div>
              )
            })()}
          </motion.div>
        )}

        {/* Player Statistics */}
        <PlayerStatistics
          players={matchConfig?.players || []}
          solvedProblems={solvedProblems}
          problems={matchConfig?.problems || []}
        />

        {/* Problems Solved Summary */}
        <div className="mb-8 bg-blue-900/50 rounded-lg p-6 sonic-border">
          <h2 className="text-2xl font-bold mb-4 text-sonic-gold">Problems Solved</h2>
          <div className="space-y-2">
            {Array.from(solvedProblemsMap.entries()).map(([problemId, data]) => {
              const problem = matchConfig?.problems?.find(p =>
                `${p.contestId}-${p.index}` === problemId
              )
              if (!problem) return null

              return (
                <div key={problemId} className="flex items-center justify-between p-3 bg-blue-800/50 rounded-lg">
                  <div>
                    <a
                      href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-sonic-gold"
                    >
                      {problem.contestId}{problem.index}. {problem.name}
                    </a>
                  </div>
                  <div className="text-green-400 font-semibold">
                    Solved by {data.handle}
                  </div>
                </div>
              )
            })}
            {solvedProblemsMap.size === 0 && (
              <div className="text-center text-blue-300 py-8">
                No problems were solved in this match.
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-sonic-gold hover:bg-yellow-400 text-blue-900 font-bold text-xl rounded-lg transition-all"
          >
            New Match
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShareResults}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 font-bold text-xl rounded-lg transition-all text-white"
          >
            📤 Share Results
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default Results
