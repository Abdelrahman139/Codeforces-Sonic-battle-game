import { motion } from 'framer-motion'
import { useMemo } from 'react'

function TimelineEvent({ event, index, total }) {
  const position = (index / (total - 1 || 1)) * 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="absolute"
      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
    >
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full border-2 ${
          event.type === 'AC' 
            ? 'bg-green-500 border-green-300' 
            : 'bg-blue-500 border-blue-300'
        }`} />
        <div className="mt-2 text-xs text-center max-w-[80px]">
          <div className="font-semibold text-white">{event.player}</div>
          <div className="text-blue-300">{event.problem}</div>
          {event.type === 'AC' && (
            <div className="text-green-400 font-bold">+{event.points}</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function MatchTimeline({ solvedProblems = [], problems = [], players = [], matchStartTime, matchDuration }) {
  const timelineEvents = useMemo(() => {
    const events = []
    const solvedArray = solvedProblems instanceof Map 
      ? Array.from(solvedProblems.entries()) 
      : solvedProblems || []
    
    solvedArray.forEach(([problemId, solveData]) => {
      const problem = problems.find(p => `${p.contestId}-${p.index}` === problemId)
      if (problem) {
        const relativeTime = ((solveData.time - matchStartTime) / (matchDuration * 60 * 1000)) * 100
        events.push({
          id: problemId,
          player: solveData.handle,
          problem: `${problem.contestId}${problem.index}`,
          time: solveData.time,
          relativeTime: Math.max(0, Math.min(100, relativeTime)),
          type: 'AC',
          points: solveData.points || 0,
        })
      }
    })
    
    return events.sort((a, b) => a.time - b.time)
  }, [solvedProblems, problems, matchStartTime, matchDuration])

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-blue-900/50 rounded-lg p-6 sonic-border">
        <h3 className="text-xl font-bold mb-4 text-sonic-gold">Match Timeline</h3>
        <div className="text-center text-blue-300 py-8">
          No events yet...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-900/50 rounded-lg p-6 sonic-border">
      <h3 className="text-xl font-bold mb-6 text-sonic-gold">Match Timeline</h3>
      <div className="relative h-32">
        {/* Timeline line */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-blue-700 rounded-full" />
        
        {/* Start marker */}
        <div className="absolute left-0 top-6">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-300" />
          <div className="mt-2 text-xs text-blue-300">Start</div>
        </div>
        
        {/* End marker */}
        <div className="absolute right-0 top-6">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-300" />
          <div className="mt-2 text-xs text-blue-300 text-right">End</div>
        </div>
        
        {/* Events */}
        {timelineEvents.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            index={index}
            total={timelineEvents.length}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-blue-200">Accepted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="text-blue-200">Event</span>
        </div>
      </div>
    </div>
  )
}

