import { motion } from 'framer-motion'
import { useMemo } from 'react'

export function PlayerStatistics({ players, solvedProblems, problems }) {
  const playerStats = useMemo(() => {
    const stats = {}
    const solvedProblemsMap = new Map(solvedProblems)

    players.forEach(player => {
      const solvedCount = Array.from(solvedProblemsMap.values()).filter(
        solveData => solveData.handle === player.handle
      ).length

      const solvedProblemIds = Array.from(solvedProblemsMap.entries())
        .filter(([_, solveData]) => solveData.handle === player.handle)
        .map(([problemId, _]) => problemId)

      const solvedProblemDetails = solvedProblemIds.map(problemId => {
        const problem = problems.find(p => `${p.contestId}-${p.index}` === problemId)
        return problem ? {
          id: problemId,
          name: `${problem.contestId}${problem.index}. ${problem.name}`,
          rating: problem.rating || 0,
        } : null
      }).filter(Boolean)

      stats[player.handle] = {
        handle: player.handle,
        solvedCount,
        solvedProblems: solvedProblemDetails,
        totalProblems: problems.length,
      }
    })

    return stats
  }, [players, solvedProblems, problems])

  return (
    <div className="bg-blue-900/50 rounded-lg p-6 sonic-border">
      <h2 className="text-2xl font-bold mb-4 text-sonic-gold">Player Statistics</h2>
      <div className="space-y-4">
        {Object.values(playerStats).map((stat, index) => (
          <motion.div
            key={stat.handle}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-blue-800/50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-white">{stat.handle}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-sonic-gold">
                  {stat.solvedCount}/{stat.totalProblems}
                </div>
                <div className="text-sm text-blue-300">Problems Solved</div>
              </div>
            </div>
            
            {stat.solvedProblems.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-blue-200 mb-2">Solved Problems:</h4>
                <div className="flex flex-wrap gap-2">
                  {stat.solvedProblems.map(problem => (
                    <motion.span
                      key={problem.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-3 py-1 bg-green-900/50 border border-green-500 rounded-lg text-sm text-green-300"
                    >
                      {problem.name}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

