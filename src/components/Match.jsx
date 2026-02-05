import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateProblemPoints } from '../utils/pointCalculator'
import { MatchPollingManager } from '../services/matchPolling'
import ProblemCard from './ProblemCard'
import PlayerProgress from './PlayerProgress'
import RingCollectAnimation from './RingCollectAnimation'
import { ProblemSkeleton } from './SkeletonLoader'
import { ProgressIndicator } from './ProgressIndicator'
import CreateOrJoinBattle from './CreateOrJoinBattle'
import SonicCountdown from './SonicCountdown'

function Match() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [matchConfig, setMatchConfig] = useState(null)
  const [showCreateOrJoin, setShowCreateOrJoin] = useState(false)
  const [playerScores, setPlayerScores] = useState(new Map())
  const [previousScores, setPreviousScores] = useState(new Map())
  const [solvedProblems, setSolvedProblems] = useState(new Map()) // problemId -> { handle, submissionId, time }
  const [problemStatuses, setProblemStatuses] = useState(new Map()) // problemId -> { handle -> status } (AC, WA, TLE)
  const [ringAnimation, setRingAnimation] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const pollingManagerRef = useRef(null)
  const [matchHasStarted, setMatchHasStarted] = useState(false)
  const countdownIntervalRef = useRef(null)
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or body class or default to false
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return saved === 'true'
    }
    return document.body.classList.contains('dark-mode')
  })
  
  // Get mystery problem index from config (selected at match start)
  const mysteryProblemIndex = matchConfig?.mysteryProblemIndex ?? -1
  
  // Calculate problem points with multipliers
  const problemPoints = useMemo(() => {
    if (!matchConfig?.problems || !Array.isArray(matchConfig.problems)) return new Map()
    
    const points = new Map()
    const now = Date.now()
    const matchDuration = ((matchConfig.matchDuration || 60) * 60 * 1000)
    const startTime = matchConfig.startTime || now
    const finalLapStart = startTime + (matchDuration * 0.75)
    const isFinalLap = matchConfig.finalLap && now >= finalLapStart
    
    matchConfig.problems.forEach((problem, index) => {
      if (!problem) return
      const rating = problem.rating || 1500
      let multiplier = 1
      
      // Mystery problem gets 2x
      if (index === mysteryProblemIndex) {
        multiplier *= 2
      }
      
      // Final Lap doubles all points
      if (isFinalLap) {
        multiplier *= 2
      }
      
      const pointsValue = calculateProblemPoints(rating, multiplier)
      const problemId = `${problem.contestId}-${problem.index}`
      points.set(problemId, pointsValue)
    })
    
    return points
  }, [matchConfig?.problems, matchConfig?.matchDuration, matchConfig?.startTime, matchConfig?.finalLap, mysteryProblemIndex])
  
  // Initialize match
  useEffect(() => {
    const config = sessionStorage.getItem('matchConfig')
    const inviteParam = searchParams.get('invite')
    
    // If no config and no invite param, show create/join screen
    if (!config && !inviteParam) {
      setShowCreateOrJoin(true)
      setLoading(false)
      return
    }
    
    if (config) {
      try {
        const parsed = JSON.parse(config)
        
        // Validate parsed config has required fields
        if (!parsed.players || !Array.isArray(parsed.players) || parsed.players.length === 0) {
          console.error('Invalid match config: missing players')
          setShowCreateOrJoin(true)
          setLoading(false)
          return
        }
        
        if (!parsed.problems || !Array.isArray(parsed.problems)) {
          console.error('Invalid match config: missing problems')
          setShowCreateOrJoin(true)
          setLoading(false)
          return
        }
        
        // Set initial time remaining FIRST to determine if match has started
        const now = Date.now()
        const startTime = parsed.startTime || now
        const endTime = parsed.endTime || (startTime + (parsed.matchDuration || 60) * 60 * 1000)
        const hasStarted = now >= startTime
        
        console.log('Match initialization:', { 
          now, 
          startTime, 
          endTime, 
          hasStarted,
          problemsCount: parsed.problems?.length,
          playersCount: parsed.players?.length
        })
        
        // Set state in correct order
        setMatchConfig(parsed)
        setMatchHasStarted(hasStarted)
        setTimeRemaining(hasStarted ? Math.max(0, endTime - now) : Math.max(0, startTime - now))
        
        // Initialize player scores
        const scores = new Map()
        const prevScores = new Map()
        parsed.players.forEach(player => {
          if (player && player.handle) {
            scores.set(player.handle, 0)
            prevScores.set(player.handle, 0)
          }
        })
        setPlayerScores(scores)
        setPreviousScores(prevScores)
        
        setLoading(false)
        
        if (hasStarted) {
          console.log('✅ Match has already started, match UI should render')
        } else {
          console.log('⏳ Match has not started yet, countdown should show')
        }
      } catch (err) {
        console.error('Error parsing match config:', err)
        setShowCreateOrJoin(true)
        setLoading(false)
      }
    } else if (inviteParam) {
      // Handle invite code - for now, show create/join screen
      // In future, this could fetch match config from backend
      setShowCreateOrJoin(true)
      setLoading(false)
    }
  }, [navigate, searchParams])
  
  // Timer countdown - handles both pre-match countdown and match timer
  useEffect(() => {
    if (!matchConfig) return
    
    const timer = setInterval(() => {
      const now = Date.now()
      const startTime = matchConfig.startTime || now
      const endTime = matchConfig.endTime || (startTime + (matchConfig.matchDuration || 60) * 60 * 1000)
      
      // Check if match has started
      if (now < startTime) {
        // Match hasn't started yet - countdown to start (show time until start)
        const remaining = Math.max(0, startTime - now)
        setTimeRemaining(remaining)
        setMatchHasStarted(false)
      } else {
        // Match has started - show remaining match time
        setMatchHasStarted(true)
        const matchTimeRemaining = Math.max(0, endTime - now)
        setTimeRemaining(matchTimeRemaining)
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [matchConfig])

  
  // Handle match end (manual or automatic)
  const handleMatchEnd = () => {
    if (pollingManagerRef.current) {
      pollingManagerRef.current.stop()
    }
    
    // Store results for results screen
    const results = {
      players: Array.from(playerScores.entries()).map(([handle, points]) => ({
        handle,
        points,
        playerInfo: matchConfig.players.find(p => p.handle === handle)
      })).sort((a, b) => b.points - a.points),
      solvedProblems: Array.from(solvedProblems.entries()),
      mysteryProblemIndex,
      matchConfig
    }
    
    sessionStorage.setItem('matchResults', JSON.stringify(results))
    navigate('/results')
  }
  
  // Timer countdown
  useEffect(() => {
    if (!matchConfig) return
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, matchConfig.endTime - Date.now())
      setTimeRemaining(remaining)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [matchConfig])
  
  // Check if match should end automatically
  useEffect(() => {
    if (!matchConfig || timeRemaining > 0) return
    
    // Match ended automatically - use a ref to avoid dependency issues
    const endMatch = () => {
      if (pollingManagerRef.current) {
        pollingManagerRef.current.stop()
      }
      
      const results = {
        players: Array.from(playerScores.entries()).map(([handle, points]) => ({
          handle,
          points,
          playerInfo: matchConfig.players.find(p => p.handle === handle)
        })).sort((a, b) => b.points - a.points),
        solvedProblems: Array.from(solvedProblems.entries()),
        mysteryProblemIndex,
        matchConfig
      }
      
      sessionStorage.setItem('matchResults', JSON.stringify(results))
      navigate('/results')
    }
    
    endMatch()
  }, [timeRemaining, matchConfig, playerScores, solvedProblems, mysteryProblemIndex, navigate])
  
  // Update solved problem and award points
  const updateSolvedProblem = useCallback((problemId, handle, submission) => {
    const submissionTime = submission.creationTimeSeconds * 1000
    
    setSolvedProblems(prev => {
      const newMap = new Map(prev)
      newMap.set(problemId, {
        handle,
        submissionId: submission.id,
        time: submissionTime
      })
      return newMap
    })
    
    // Award points - calculate fresh to get current multipliers
    if (matchConfig) {
      const problem = matchConfig.problems.find(p => 
        `${p.contestId}-${p.index}` === problemId
      )
      if (problem && problem.rating) {
        const now = Date.now()
        const matchDuration = matchConfig.matchDuration * 60 * 1000
        const finalLapStart = matchConfig.startTime + (matchDuration * 0.75)
        const isFinalLap = matchConfig.finalLap && now >= finalLapStart
        let multiplier = 1
        if (matchConfig.problems.indexOf(problem) === mysteryProblemIndex) {
          multiplier *= 2
        }
        if (isFinalLap) {
          multiplier *= 2
        }
        const pointsToAward = calculateProblemPoints(problem.rating, multiplier)
        
        setPlayerScores(prev => {
          const newMap = new Map(prev)
          const currentScore = newMap.get(handle) || 0
          setPreviousScores(new Map(prev)) // Store previous scores for animation
          newMap.set(handle, currentScore + pointsToAward)
          return newMap
        })
      }
    }
  }, [matchConfig, mysteryProblemIndex])
  
  // Handle new submission
  const handleNewSubmission = useCallback((handle, submission) => {
    if (!matchConfig) return
    
    // Only process Accepted submissions
    if (submission.verdict !== 'OK') return
    
    const problemId = `${submission.problem.contestId}-${submission.problem.index}`
    const submissionTime = submission.creationTimeSeconds * 1000
    
    // Check if already solved
    setSolvedProblems(prev => {
      if (prev.has(problemId)) {
        const existing = prev.get(problemId)
        // If this submission is earlier or has smaller ID, it wins
        const existingTime = existing.time
        
        if (
          submissionTime < existingTime ||
          (submissionTime === existingTime && submission.id < existing.submissionId)
        ) {
          // This submission wins - will update below
          return prev
        } else {
          // Existing solution is better
          return prev
        }
      }
      
      // New solution - update
      return prev
    })
    
    // Update solved problem and award points (only if this is the winning submission)
    updateSolvedProblem(problemId, handle, submission)
    setRingAnimation(true)
  }, [matchConfig, updateSolvedProblem])
  
  // Start polling - only when match has started
  useEffect(() => {
    if (!matchConfig || !matchHasStarted) return
    
    const handles = matchConfig.players.map(p => p.handle)
    const manager = new MatchPollingManager(
      handles,
      matchConfig.startTime,
      handleNewSubmission
    )
    
    pollingManagerRef.current = manager
    manager.start()
    
    return () => {
      manager.stop()
    }
  }, [matchConfig, matchHasStarted, handleNewSubmission])
  
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Calculate values that might be used in render, but use safe defaults
  const matchDuration = matchConfig ? (matchConfig.matchDuration * 60 * 1000) : 0
  const finalLapStart = matchConfig ? (matchConfig.startTime + (matchDuration * 0.75)) : 0
  const isFinalLap = matchConfig && matchConfig.finalLap && Date.now() >= finalLapStart
  
  // Sort players by score - always call, but return empty array if no config
  const sortedPlayers = useMemo(() => {
    if (!matchConfig?.players) return []
    return Array.from(playerScores.entries())
      .map(([handle, points]) => ({
        handle,
        points,
        player: matchConfig.players.find(p => p.handle === handle)
      }))
      .filter(item => item.player) // Filter out invalid entries
      .sort((a, b) => b.points - a.points)
  }, [playerScores, matchConfig?.players])
  
  const maxPoints = sortedPlayers.length > 0 ? sortedPlayers[0].points : 1
  
  // Prepare sorted problems list - always call, but return empty array if no config
  const sortedProblemsList = useMemo(() => {
    if (!matchConfig?.problems || !Array.isArray(matchConfig.problems)) return []
    
    const sortedProblems = [...matchConfig.problems]
      .map((problem) => {
        if (!problem) return null
        const problemId = `${problem.contestId}-${problem.index}`
        const points = problemPoints.get(problemId) || 0
        return { problem, problemId, points }
      })
      .filter(Boolean)
      .sort((a, b) => b.points - a.points) // Sort by points descending
    
    return sortedProblems
  }, [matchConfig?.problems, problemPoints])
  
  // Sync dark mode with body class
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])
  
  // NOW we can do conditional returns AFTER all hooks
  if (loading) {
    return <ProgressIndicator message="Loading match..." />
  }

  // Show create/join screen if no match config
  if (showCreateOrJoin || !matchConfig) {
    return <CreateOrJoinBattle darkMode={darkMode} />
  }

  // Show countdown page ONLY if match hasn't started yet AND start time is in the future
  const now = Date.now()
  const shouldShowCountdown = !matchHasStarted && matchConfig && matchConfig.startTime && now < matchConfig.startTime
  
  console.log('Render check:', { matchHasStarted, hasConfig: !!matchConfig, startTime: matchConfig?.startTime, now, shouldShowCountdown })
  
  if (shouldShowCountdown) {
    console.log('Showing countdown page')
    const inviteLink = matchConfig.matchId 
      ? `${window.location.origin}/match?invite=${matchConfig.matchId}`
      : null
    
    return (
      <div className={`min-h-screen p-4 md:p-8 pt-20 relative transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`} style={{ zIndex: 10 }}>
        <div className="max-w-4xl mx-auto relative" style={{ zIndex: 10 }}>
          <div className="absolute top-4 right-4" style={{ zIndex: 30 }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg relative ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-500/50'
              }`}
              style={{ pointerEvents: 'auto', zIndex: 30 }}
            >
              <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
              <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
            </button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 neon-glow" style={{ color: '#FFD700' }}>
              ⚡ Battle Starting Soon ⚡
            </h1>
          </div>
          
          <SonicCountdown
            countdown={timeRemaining}
            inviteLink={inviteLink}
            darkMode={darkMode}
            onCopy={() => {
              if (inviteLink) {
                navigator.clipboard.writeText(inviteLink).then(() => {
                  alert('Link copied to clipboard!')
                }).catch(() => {
                  prompt('Copy this link:', inviteLink)
                })
              }
            }}
          />
        </div>
      </div>
    )
  }
  
  // If we reach here, the match has started - show the match UI
  console.log('Rendering match UI', { 
    problemsCount: matchConfig.problems?.length, 
    playersCount: matchConfig.players?.length,
    matchHasStarted 
  })

  return (
    <div className={`min-h-screen p-4 md:p-8 pt-20 relative transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`} style={{ zIndex: 10 }}>
      <div className="max-w-7xl mx-auto relative" style={{ zIndex: 10 }}>
        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4" style={{ zIndex: 20 }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-500/50'
            }`}
          >
            <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
            <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        </div>
      <AnimatePresence>
        {ringAnimation && (
          <RingCollectAnimation
            show={ringAnimation}
            onComplete={() => setRingAnimation(false)}
          />
        )}
      </AnimatePresence>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 neon-glow" style={{ color: '#FFD700' }}>
            ⚡ SONIC BATTLE ⚡
          </h1>
          
          {/* Timer and Final Lap indicator */}
          <div className="flex items-center justify-center gap-4">
            <div className={`text-2xl font-bold ${timeRemaining < 60000 ? 'text-red-400' : darkMode ? 'text-white' : 'text-white'}`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
            {isFinalLap && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 bg-red-600 rounded-lg font-bold text-white animate-pulse"
              >
                🏁 FINAL LAP - 2x POINTS!
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Player Progress Bars */}
        <div className={`mb-8 rounded-lg p-6 sonic-border ${darkMode ? 'bg-gray-800/50' : 'bg-blue-900/50'}`}>
          <h2 className="text-2xl font-bold mb-4 text-sonic-gold">Leaderboard</h2>
            {sortedPlayers.map((playerData, index) => (
              <PlayerProgress
                key={playerData.handle}
                player={playerData.player}
                points={playerData.points}
                previousPoints={previousScores.get(playerData.handle)}
                maxPoints={maxPoints}
                rank={index + 1}
              />
            ))}
        </div>
        
            {/* Problems List - Vertical */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4 text-sonic-gold">Problems</h2>
              {!matchConfig.problems || matchConfig.problems.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <ProblemSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3" style={{ contain: 'layout style paint' }}>
                  {sortedProblemsList.map(({ problem, problemId, points }) => {
                    const solved = solvedProblems.get(problemId)
                    const statusMap = problemStatuses.get(problemId) || new Map()
                    
                    // Determine the status to show (prioritize AC if any player has it)
                    let statusToShow = null
                    if (solved) {
                      statusToShow = 'AC'
                    } else {
                      // Get the best status from any player (AC > TLE > WA)
                      const statuses = Array.from(statusMap.values())
                      if (statuses.includes('OK')) {
                        statusToShow = 'AC'
                      } else if (statuses.includes('TIME_LIMIT_EXCEEDED')) {
                        statusToShow = 'TLE'
                      } else if (statuses.includes('WRONG_ANSWER')) {
                        statusToShow = 'WA'
                      }
                    }
                    
                    return (
                      <ProblemCard
                        key={problemId}
                        problem={problem}
                        sonicPoints={points}
                        status={statusToShow}
                        solvedBy={solved?.handle}
                      />
                    )
                  })}
                </div>
              )}
            </div>
        
      </div>
    </div>
  )
}

export default Match
