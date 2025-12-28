import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { validateHandles, getProblems, filterUnsolvedProblems, getAllTags, validateHandle } from '../services/codeforcesApi'
import { calculateProblemPoints } from '../utils/pointCalculator'
import { MatchPollingManager } from '../services/matchPolling'
import { ProgressIndicator } from './ProgressIndicator'
import HowToPlay from './HowToPlay'

import SonicCountdown from './SonicCountdown'
import ProblemCard from './ProblemCard'
import PlayerProgress from './PlayerProgress'
import RingCollectAnimation from './RingCollectAnimation'
import { ProblemSkeleton } from './SkeletonLoader'
import { CustomizeDropdown } from './CustomizeDropdown'
import sonicVsImg from '../assets/sonic-vs.png'
import '../sonic-loader.css'


// Will be populated from API
const PROBLEM_CATEGORIES = []

function Lobby() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [playerCount, setPlayerCount] = useState(2)
  // Smart Save: Initialize from localStorage if available
  const [players, setPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem('savedPlayerHandles')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length >= 2) {
          // Pad with empty strings if needed to match default count
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to load saved handles:', e)
    }
    return ['', '']
  })
  const [validatedPlayers, setValidatedPlayers] = useState({})
  const [validating, setValidating] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  const [finalLap, setFinalLap] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([]) // Empty means no categories selected
  const [maxRating, setMaxRating] = useState(2000)
  const [minRating, setMinRating] = useState(800)
  const [matchDuration, setMatchDuration] = useState(60)
  const [numberOfProblems, setNumberOfProblems] = useState(10)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [useAllTopics, setUseAllTopics] = useState(false) // Default: selected topics mode (no topics selected)
  const [darkMode] = useState(true)

  // Listen for dark mode changes from navigation bar
  const [problemCategories, setProblemCategories] = useState([]) // Tags from API
  const [selectedStartTime, setSelectedStartTime] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [matchId, setMatchId] = useState(null)
  const [inviteLink, setInviteLink] = useState('')

  // Match state (merged from Match component)
  const [matchConfig, setMatchConfig] = useState(null)
  const [playerScores, setPlayerScores] = useState(new Map())
  const [previousScores, setPreviousScores] = useState(new Map())
  const [solvedProblems, setSolvedProblems] = useState(new Map())
  const [problemStatuses, setProblemStatuses] = useState(new Map())
  const [ringAnimation, setRingAnimation] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [matchHasStarted, setMatchHasStarted] = useState(false)
  const pollingManagerRef = useRef(null)

  // Join battle state
  const [joinInviteCode, setJoinInviteCode] = useState('')
  const [showJoinSection, setShowJoinSection] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const categoryDropdownRef = useRef(null)
  const validationTimeoutsRef = useRef({})
  const countdownIntervalRef = useRef(null)

  // Fetch all tags from Codeforces API (only once)
  useEffect(() => {
    let mounted = true
    const fetchTags = async () => {
      try {
        const tags = await getAllTags()
        if (mounted) {
          setProblemCategories(tags)
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()
    return () => { mounted = false }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false)
      }
    }

    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [categoryDropdownOpen])

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])


  // Smart Save: Auto-save player handles when they change
  useEffect(() => {
    // Debounce slightly to avoid excessive writes
    const timer = setTimeout(() => {
      if (players.some(p => p.length > 0)) {
        localStorage.setItem('savedPlayerHandles', JSON.stringify(players))
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [players])

  // Initialize match from sessionStorage or invite param
  useEffect(() => {
    // Only load from session if we are NOT explicitly starting fresh (which Navigation handles by clearing it)
    const config = sessionStorage.getItem('matchConfig')
    // Check both hash params and main URL query params (handling pastes before #)
    const inviteParam = searchParams.get('invite') || new URLSearchParams(window.location.search).get('invite')

    // Helper to process a valid config object
    const processConfig = (parsed) => {
      if (parsed.players && Array.isArray(parsed.players) && parsed.players.length > 0 &&
        parsed.problems && Array.isArray(parsed.problems)) {
        const now = Date.now()
        const startTime = parsed.startTime || now
        const endTime = parsed.endTime || (startTime + (parsed.matchDuration || 60) * 60 * 1000)
        const hasStarted = now >= startTime

        setMatchConfig(parsed)
        setMatchHasStarted(hasStarted)
        setTimeRemaining(hasStarted ? Math.max(0, endTime - now) : Math.max(0, startTime - now))

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

        // Ensure session storage is updated if we loaded from invite
        if (!config || JSON.stringify(JSON.parse(config)) !== JSON.stringify(parsed)) {
          sessionStorage.setItem('matchConfig', JSON.stringify(parsed))
        }

        // Redirect based on match status
        if (!hasStarted) {
          // Match hasn't started - redirect to countdown page
          navigate('/countdown')
        }
        // If match has started, stay on home page (match UI will show)
      }
    }

    // 1. Priority: Invite Link (Deep Linking)
    if (inviteParam) {
      let loadedConfig = null;
      // Try to decode serverless config (base64)
      try {
        if (inviteParam.length > 50) {
          const decoded = decodeURIComponent(escape(window.atob(inviteParam)))
          const parsed = JSON.parse(decoded)
          if (parsed && parsed.matchId) {
            loadedConfig = parsed
            console.log('Successfully decoded serverless match config')
          }
        }
      } catch (e) { /* Not base64 */ }

      // If not serverless, try localStorage (legacy/local)
      if (!loadedConfig) {
        console.log('Loading match config from local storage for invite:', inviteParam)
        const storedConfig = localStorage.getItem(`matchConfig_${inviteParam}`)
        if (storedConfig) {
          try {
            loadedConfig = JSON.parse(storedConfig)
          } catch (e) { console.error('Error parsing local config:', e) }
        }
      }

      if (loadedConfig) {
        processConfig(loadedConfig)
        return // Stop here, don't check session storage if we found a specific invite
      } else {
        // If invite param was present but no config could be loaded
        setShowJoinSection(true)
        setJoinInviteCode(inviteParam)
        setError('Match not found. The invite link might be invalid or expired.')
        return
      }

    }

    // 2. Fallback: Active Session
    if (config) {
      try {
        const parsed = JSON.parse(config)
        processConfig(parsed)
      } catch (err) {
        console.error('Error parsing match config:', err)
      }
    }
  }, [searchParams])

  // Match timer
  useEffect(() => {
    if (!matchConfig) return
    const timer = setInterval(() => {
      const now = Date.now()
      const startTime = matchConfig.startTime || now
      const endTime = matchConfig.endTime || (startTime + (matchConfig.matchDuration || 60) * 60 * 1000)
      if (now < startTime) {
        setTimeRemaining(Math.max(0, startTime - now))
        setMatchHasStarted(false)
      } else {
        setMatchHasStarted(true)
        setTimeRemaining(Math.max(0, endTime - now))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [matchConfig])

  // Auto-end match
  useEffect(() => {
    if (!matchConfig || timeRemaining > 0 || !matchHasStarted) return
    if (pollingManagerRef.current) pollingManagerRef.current.stop()
    const results = {
      players: Array.from(playerScores.entries()).map(([handle, points]) => ({
        handle, points, playerInfo: matchConfig.players.find(p => p.handle === handle)
      })).sort((a, b) => b.points - a.points),
      solvedProblems: Array.from(solvedProblems.entries()),
      matchConfig
    }
    sessionStorage.setItem('matchResults', JSON.stringify(results))
    navigate('/results')
  }, [timeRemaining, matchConfig, playerScores, solvedProblems, navigate, matchHasStarted])

  // Update solved problem
  const updateSolvedProblem = useCallback((problemId, handle, submission) => {
    const submissionTime = submission.creationTimeSeconds * 1000
    setSolvedProblems(prev => {
      const newMap = new Map(prev)
      newMap.set(problemId, { handle, submissionId: submission.id, time: submissionTime })
      return newMap
    })
    if (matchConfig) {
      const problem = matchConfig.problems.find(p => `${p.contestId}-${p.index}` === problemId)
      if (problem && problem.rating) {
        const now = Date.now()
        const matchDuration = matchConfig.matchDuration * 60 * 1000
        const finalLapStart = matchConfig.startTime + (matchDuration * 0.75)
        const isFinalLap = matchConfig.finalLap && now >= finalLapStart
        let multiplier = 1
        if (isFinalLap) multiplier *= 2
        const pointsToAward = calculateProblemPoints(problem.rating, multiplier)
        setPlayerScores(prev => {
          const newMap = new Map(prev)
          const currentScore = newMap.get(handle) || 0
          setPreviousScores(new Map(prev))
          newMap.set(handle, currentScore + pointsToAward)
          return newMap
        })
        setRingAnimation(true)
        setTimeout(() => setRingAnimation(false), 600)
      }
    }
  }, [matchConfig])

  // Handle new submission - track all verdicts for status display
  const handleNewSubmission = useCallback((handle, submission) => {
    if (!matchConfig) return
    const problemId = `${submission.problem.contestId}-${submission.problem.index}`

    // Update problem statuses for all verdicts
    setProblemStatuses(prev => {
      const newMap = new Map(prev)
      if (!newMap.has(problemId)) {
        newMap.set(problemId, new Map())
      }
      newMap.get(problemId).set(handle, submission.verdict)
      return newMap
    })

    // Only process Accepted submissions for scoring
    if (submission.verdict === 'OK') {
      const submissionTime = submission.creationTimeSeconds * 1000
      const existing = solvedProblems.get(problemId)
      if (!existing || submissionTime < existing.time ||
        (submissionTime === existing.time && submission.id < existing.submissionId)) {
        updateSolvedProblem(problemId, handle, submission)
      }
    }
  }, [matchConfig, solvedProblems, updateSolvedProblem])

  // Start polling when match starts
  useEffect(() => {
    if (!matchConfig || !matchHasStarted) return
    const handles = matchConfig.players.map(p => p.handle)
    const manager = new MatchPollingManager(handles, matchConfig.startTime, handleNewSubmission)
    pollingManagerRef.current = manager
    manager.start()
    return () => manager.stop()
  }, [matchConfig, matchHasStarted, handleNewSubmission])

  // Update players array when player count changes
  const handlePlayerCountChange = (count) => {
    if (count < 2) count = 2 // Minimum 2 players
    setPlayerCount(count)
    const newPlayers = Array(count).fill('').map((_, i) => players[i] || '')
    setPlayers(newPlayers)
    setValidatedPlayers({})
    setValidationErrors({})
  }

  const incrementPlayerCount = () => {
    handlePlayerCountChange(playerCount + 1)
  }

  const decrementPlayerCount = () => {
    if (playerCount > 2) {
      handlePlayerCountChange(playerCount - 1)
    }
  }

  // Auto-validate handle with debounce
  const autoValidateHandle = useCallback(async (index, handle) => {
    if (!handle || handle.trim().length === 0) {
      // Clear validation if empty
      setValidatedPlayers(prev => {
        const newValidated = { ...prev }
        delete newValidated[index]
        return newValidated
      })
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[index]
        return newErrors
      })
      return
    }

    // Clear previous timeout
    if (validationTimeoutsRef.current[index]) {
      clearTimeout(validationTimeoutsRef.current[index])
    }

    // Set new timeout for debounce (500ms)
    validationTimeoutsRef.current[index] = setTimeout(async () => {
      try {
        const result = await validateHandle(handle.trim())
        if (result.valid) {
          setValidatedPlayers(prev => ({
            ...prev,
            [index]: result
          }))
          setValidationErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[index]
            return newErrors
          })
        } else {
          setValidationErrors(prev => ({
            ...prev,
            [index]: result.error || 'Invalid handle'
          }))
          setValidatedPlayers(prev => {
            const newValidated = { ...prev }
            delete newValidated[index]
            return newValidated
          })
        }
      } catch (error) {
        setValidationErrors(prev => ({
          ...prev,
          [index]: error.message || 'Validation error'
        }))
      }
    }, 500)
  }, [])

  // Handle player handle input
  const handlePlayerInput = (index, value) => {
    const newPlayers = [...players]
    newPlayers[index] = value.trim()
    setPlayers(newPlayers)

    // Auto-validate with debounce
    autoValidateHandle(index, value.trim())
  }

  // Validate all handles (deprecated - now using auto-validation)
  const handleValidateAll = async () => {
    const handlesToValidate = players.filter(h => h.length > 0)

    if (handlesToValidate.length !== playerCount) {
      setError('Please fill in all player handles')
      return
    }

    // Check for duplicates
    const uniqueHandles = new Set(handlesToValidate.map(h => h.toLowerCase()))
    if (uniqueHandles.size !== handlesToValidate.length) {
      setError('All handles must be unique')
      return
    }

    setValidating(true)
    setError('')
    setValidationErrors({})

    try {
      const results = await validateHandles(handlesToValidate)

      const newValidated = {}
      const newErrors = {}
      let allValid = true

      results.forEach((result, index) => {
        // Find the index in the original players array
        const handleIndex = players.findIndex((p, i) =>
          p.toLowerCase() === handlesToValidate[index].toLowerCase()
        )

        if (handleIndex === -1) {
          // Should not happen, but handle gracefully
          return
        }

        if (result.valid) {
          newValidated[handleIndex] = result
        } else {
          newErrors[handleIndex] = result.error || 'Invalid handle'
          allValid = false
        }
      })

      setValidatedPlayers(newValidated)
      setValidationErrors(newErrors)

      if (!allValid) {
        setError('Some handles are invalid. Please check and try again.')
      }
    } catch (err) {
      setError(`Validation failed: ${err.message}`)
    } finally {
      setValidating(false)
    }
  }

  // Toggle between All Topics and Selected Topics
  const handleTopicModeChange = (allTopics) => {
    setUseAllTopics(allTopics)
    if (allTopics) {
      setSelectedCategories([]) // Empty means all
      setCategoryDropdownOpen(false)
    } else {
      // When switching to selected topics, keep current selection (don't auto-select all)
      // If no selection, open dropdown for user to select
      if (selectedCategories.length === 0) {
        setCategoryDropdownOpen(true)
      }
    }
  }

  // formatTime moved below with other hooks

  // Toggle category selection
  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
      return newCategories
    })
  }

  // Select all categories
  const selectAllCategories = () => {
    setSelectedCategories([...problemCategories])
  }

  // Deselect all categories
  const deselectAllCategories = () => {
    setSelectedCategories([])
  }


  // Handle Start Battle button click - completely reimplemented
  const handleStartBattle = async () => {
    console.log('Start Battle button clicked')

    // Validate start time
    if (!selectedStartTime) {
      setError('Please select a start time before starting the battle')
      return
    }

    const startTime = new Date(selectedStartTime).getTime()
    const now = Date.now()

    if (startTime <= now) {
      setError('Start time must be in the future')
      return
    }

    // Validate all players are entered and validated
    if (Object.keys(validatedPlayers).length !== playerCount) {
      setError('Please wait for all handles to be validated')
      return
    }

    // Set loading state
    setLoading(true)
    setError('')

    try {
      // Generate unique match ID
      const newMatchId = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      console.log('Generated match ID:', newMatchId)

      // Removed: inviteUrl is now generated after matchConfig is created

      // Use empty array if all topics mode is selected
      const categoriesToUse = useAllTopics ? [] : selectedCategories

      console.log('Fetching problems...')
      // Get problems matching criteria
      const allProblems = await getProblems(categoriesToUse, maxRating, minRating)

      if (allProblems.length === 0) {
        setError('No problems found matching the criteria')
        setLoading(false)
        return
      }

      console.log(`Found ${allProblems.length} problems, filtering unsolved...`)
      // Filter out problems solved by any player
      const playerHandles = Object.values(validatedPlayers).map(p => p.handle)
      const unsolvedProblems = await filterUnsolvedProblems(allProblems, playerHandles)

      if (unsolvedProblems.length === 0) {
        setError('No unsolved problems found. Try adjusting categories or max rating.')
        setLoading(false)
        return
      }

      console.log(`Found ${unsolvedProblems.length} unsolved problems`)
      // Limit to selected number of problems (randomly select)
      let problemsToUse = unsolvedProblems
      if (numberOfProblems > 0 && numberOfProblems < unsolvedProblems.length) {
        // Shuffle and take first N problems
        const shuffled = [...unsolvedProblems].sort(() => Math.random() - 0.5)
        problemsToUse = shuffled.slice(0, numberOfProblems)
      }

      console.log(`Selected ${problemsToUse.length} problems for match`)

      // Prepare match configuration
      const matchConfig = {
        players: Object.values(validatedPlayers),
        problems: problemsToUse,
        finalLap,
        selectedCategories: categoriesToUse,
        maxRating,
        minRating,
        matchDuration,
        numberOfProblems,
        startTime: startTime,
        endTime: startTime + (matchDuration * 60 * 1000),
        matchId: newMatchId
      }

      // Store in sessionStorage for the match component (for creator)
      sessionStorage.setItem('matchConfig', JSON.stringify(matchConfig))

      // Generate serverless invite link with encoded config
      const configString = JSON.stringify(matchConfig)
      // Use btoa for base64 encoding (handle unicode with encodeURIComponent)
      const encodedConfig = btoa(unescape(encodeURIComponent(configString)))
      const inviteUrl = `https://Abdelrahman139.github.io/Codeforces-Sonic-battle-game/#/?invite=${encodedConfig}`
      setInviteLink(inviteUrl) // Assuming there is a setInviteLink state or we pass it down

      // Also store in localStorage with matchId so others can join via invite link (legacy/local backup)
      localStorage.setItem(`matchConfig_${newMatchId}`, JSON.stringify(matchConfig))

      console.log('Match prepared, redirecting to countdown page...')
      setLoading(false)

      // Redirect to countdown page immediately
      navigate('/countdown')
    } catch (err) {
      console.error('Error starting match:', err)
      setError(`Failed to start match: ${err.message}`)
      setLoading(false)
    }
  }

  // Calculate match values (hooks must be before conditional returns)
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
      if (isFinalLap) multiplier *= 2
      const pointsValue = calculateProblemPoints(rating, multiplier)
      const problemId = `${problem.contestId}-${problem.index}`
      points.set(problemId, pointsValue)
    })
    return points
  }, [matchConfig?.problems, matchConfig?.matchDuration, matchConfig?.startTime, matchConfig?.finalLap])

  const sortedPlayers = useMemo(() => {
    if (!matchConfig?.players) return []
    return Array.from(playerScores.entries())
      .map(([handle, points]) => ({
        handle, points, player: matchConfig.players.find(p => p.handle === handle)
      }))
      .filter(item => item.player)
      .sort((a, b) => b.points - a.points)
  }, [playerScores, matchConfig?.players])

  const maxPoints = sortedPlayers.length > 0 ? sortedPlayers[0].points : 1

  const sortedProblemsList = useMemo(() => {
    if (!matchConfig?.problems || !Array.isArray(matchConfig.problems)) return []
    return [...matchConfig.problems]
      .map((problem) => {
        if (!problem) return null
        const problemId = `${problem.contestId}-${problem.index}`
        const points = problemPoints.get(problemId) || 0
        return { problem, problemId, points }
      })
      .filter(Boolean)
      .sort((a, b) => (a.problem.rating || 0) - (b.problem.rating || 0))
  }, [matchConfig?.problems, problemPoints])

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Show loading overlay when loading
  if (loading) {
    return <ProgressIndicator message={error || "Preparing match..."} />
  }

  // Handle leaving the match
  const handleLeaveBattle = () => {
    // Stop polling if active
    if (pollingManagerRef.current) {
      pollingManagerRef.current.stop()
    }

    // Clear match config from sessionStorage
    sessionStorage.removeItem('matchConfig')

    // Reset match state
    setMatchConfig(null)
    setMatchHasStarted(false)
    setPlayerScores(new Map())
    setPreviousScores(new Map())
    setSolvedProblems(new Map())
    setProblemStatuses(new Map())
    setTimeRemaining(0)
    setRingAnimation(false)

    // Reset URL if there's an invite param
    navigate('/', { replace: true })
  }

  // If match has started, show match UI instead of lobby
  if (matchConfig && matchHasStarted) {
    const matchDuration = matchConfig.matchDuration * 60 * 1000
    const finalLapStart = matchConfig.startTime + (matchDuration * 0.75)
    const isFinalLap = matchConfig.finalLap && Date.now() >= finalLapStart

    return (
      <div className={`min-h-screen p-4 md:p-8 pt-20 relative transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`} style={{ zIndex: 10 }}>
        {/* Background Decor */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-yellow-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-[95%] 2xl:max-w-[1800px] mx-auto relative px-4" style={{ zIndex: 10 }}>
          <div className="absolute top-4 right-4" style={{ zIndex: 20 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLeaveBattle}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-md ${darkMode
                ? 'bg-red-900/80 hover:bg-red-800 text-white border border-red-500/50'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/50'
                }`}
            >
              <span className="text-xl">🚪</span>
              <span>Leave Battle</span>
            </motion.button>
          </div>
          <AnimatePresence>
            {ringAnimation && (
              <RingCollectAnimation
                show={ringAnimation}
                onComplete={() => setRingAnimation(false)}
              />
            )}
          </AnimatePresence>
          {/* Battle Header with Versus Image */}
          <div className="flex flex-col items-center mb-10 relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 1.5 }}
              className="mb-8 relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center bg-black/50 rounded-full"
            >
              <div className="sonic-ring-spinner" style={{ borderWidth: '4px' }}></div>
              <img
                src={sonicVsImg}
                alt="Sonic vs Sonic"
                className="w-[90%] h-[90%] object-cover rounded-full drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]"
              />
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter italic" style={{
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 0px #b45309'
            }}>
              SONIC BATTLE
            </h1>

            <div className="flex items-center gap-6 mt-4 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-1">Time Remaining</span>
                <div className={`text-4xl font-mono font-bold tracking-widest ${timeRemaining < 60000 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>

              {isFinalLap && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-bold text-white animate-pulse shadow-lg shadow-red-500/30"
                >
                  🏁 FINAL LAP - 2x POINTS!
                </motion.div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Leaderboard Column */}
            <div className="lg:col-span-1">
              <div className={`sticky top-24 rounded-3xl overflow-hidden border-2 shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-gray-900/80 border-blue-500/30' : 'bg-blue-900/80 border-sonic-gold/50'}`}>
                <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10">
                  <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sonic-gold to-yellow-300 uppercase tracking-wider flex items-center gap-2">
                    🏆 Leaderboard
                  </h2>
                </div>
                <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
              </div>
            </div>

            {/* Problems Grid */}
            <div className="lg:col-span-2">
              <div className={`rounded-3xl p-6 border-2 shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white/10 border-white/20'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-3xl">🧩</span>
                    <span>Problems</span>
                    <span className="text-sm font-normal px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Sorted by Difficulty (Low → High)
                    </span>
                  </h2>
                </div>

                {!matchConfig.problems || matchConfig.problems.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <ProblemSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4" style={{ contain: 'layout style paint' }}>
                    {sortedProblemsList.map(({ problem, problemId, points }) => {
                      const solved = solvedProblems.get(problemId)
                      const statusMap = problemStatuses.get(problemId) || new Map()
                      let statusToShow = null
                      if (solved) {
                        statusToShow = 'AC'
                      } else {
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
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-300 relative ${darkMode ? 'bg-gray-900' : ''}`} style={{ zIndex: 10 }}>
      {/* Lobby content follows... */}
      <div className="max-w-6xl mx-auto relative" style={{ zIndex: 10 }}>
        {/* Header */}
        <div className="text-center mb-10 relative" style={{ zIndex: 10 }}>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl md:text-7xl font-extrabold mb-4 tracking-tight ${darkMode ? '' : 'neon-glow'}`}
            style={{ color: '#FFD700' }}
          >
            ⚡ SONIC BATTLE ⚡
          </motion.h1>
          <p className={`text-xl md:text-2xl font-medium ${darkMode ? 'text-gray-300' : 'text-blue-200'}`}>
            Competitive Coding Arena
          </p>
        </div>

        {/* Join Battle Section */}
        {showJoinSection && (
          <div className={`mb-8 rounded-2xl p-6 shadow-xl border-2 ${darkMode
            ? 'bg-gray-800/80 border-gray-600'
            : 'bg-blue-900/80 border-sonic-gold/50'
            }`}>
            <h2 className="text-2xl font-bold mb-4 text-sonic-gold">Join Battle</h2>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={joinInviteCode}
                onChange={(e) => setJoinInviteCode(e.target.value)}
                placeholder="Enter invite code or paste link"
                className={`flex-1 px-4 py-3 rounded-xl text-white input-field ${darkMode ? 'input-field-dark-mode' : ''}`}
                style={{ zIndex: 15, pointerEvents: 'auto' }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Join button clicked, invite code:', joinInviteCode)

                  const code = joinInviteCode.trim()
                  if (!code) {
                    setError('Please enter an invite code or paste the invite link.')
                    return
                  }

                  // 1. Try to decode serverless config directly (support full URL or base64 code)
                  let serverlessConfig = null;
                  try {
                    let potentialCode = code;
                    // Extract from URL if present
                    if (code.includes('invite=')) {
                      const match = code.match(/invite=([^&]+)/);
                      if (match) potentialCode = match[1];
                    }

                    if (potentialCode.length > 50) {
                      const decoded = decodeURIComponent(escape(window.atob(potentialCode)));
                      const parsed = JSON.parse(decoded);
                      if (parsed && parsed.matchId) {
                        serverlessConfig = parsed;
                      }
                    }
                  } catch (e) {
                    // Not a valid encoded config, continue to legacy lookup
                  }

                  if (serverlessConfig) {
                    console.log('Serverless match config decoded manually:', serverlessConfig);
                    const parsed = serverlessConfig;
                    const now = Date.now();
                    const startTime = parsed.startTime || now;
                    const hasStarted = now >= startTime;

                    sessionStorage.setItem('matchConfig', JSON.stringify(parsed));
                    setError('');
                    setShowJoinSection(false);

                    if (hasStarted) navigate('/');
                    else navigate('/countdown');
                    return;
                  }

                  // 2. Legacy/Local: Extract invite code/ID from URL
                  let inviteCode = code
                  const urlMatch = code.match(/invite=([^&]+)/)
                  if (urlMatch) {
                    inviteCode = urlMatch[1]
                  } else if (code.includes('http')) {
                    // Try to extract from full URL
                    try {
                      const url = new URL(code)
                      inviteCode = url.searchParams.get('invite') || code
                    } catch (err) {
                      // Not a valid URL, use as-is
                      inviteCode = code
                    }
                  }

                  console.log('Extracted invite ID (legacy):', inviteCode)

                  // Try to load match config from localStorage
                  const storageKey = `matchConfig_${inviteCode}`
                  console.log('Looking for match config with key:', storageKey)
                  const storedConfig = localStorage.getItem(storageKey)

                  if (storedConfig) {
                    try {
                      const parsed = JSON.parse(storedConfig)
                      console.log('Match config found:', parsed)

                      // Check if match has started
                      const now = Date.now()
                      const startTime = parsed.startTime || now
                      const hasStarted = now >= startTime

                      console.log('Match status:', { now, startTime, hasStarted })

                      // Store in sessionStorage
                      sessionStorage.setItem('matchConfig', JSON.stringify(parsed))

                      // Clear error and join section
                      setError('')
                      setShowJoinSection(false)

                      // Redirect based on match status
                      if (hasStarted) {
                        console.log('Match has started, redirecting to home page')
                        navigate('/')
                      } else {
                        console.log('Match has not started, redirecting to countdown')
                        navigate('/countdown')
                      }
                    } catch (err) {
                      console.error('Error loading match:', err)
                      setError(`Failed to load match: ${err.message}. Please check the invite code.`)
                    }
                  } else {
                    console.log('Match config not found in localStorage')
                    // List all localStorage keys for debugging
                    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('matchConfig_'))
                    console.log('Available match configs in localStorage:', allKeys)
                    setError(`Match not found. The invite link may have expired or the battle was created on a different browser. Available matches: ${allKeys.length}`)
                  }
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all relative"
                style={{ zIndex: 15, pointerEvents: 'auto' }}
              >
                Join
              </motion.button>
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-900/50 border-2 border-red-500 rounded-xl text-red-100 text-sm font-semibold"
              >
                {error}
              </motion.div>
            )}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => {
                  setShowJoinSection(false)
                  setError('')
                  setJoinInviteCode('')
                  navigate('/', { replace: true })
                }}
                className="text-sm text-blue-300 hover:text-blue-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!showJoinSection && !matchConfig && (
          <div className="mb-8 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowJoinSection(true)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              style={{ zIndex: 15, pointerEvents: 'auto' }}
            >
              ➕ Join Battle with Code
            </motion.button>
          </div>
        )}

        {/* How to Play Section */}
        <HowToPlay darkMode={darkMode} />


        {/* Main Lobby Card */}
        <div className={`rounded-2xl p-4 md:p-10 shadow-2xl backdrop-blur-sm transition-all duration-300 relative ${darkMode
          ? 'card-elevated-dark border-2 border-gray-700'
          : 'card-elevated sonic-border'
          }`} style={{ zIndex: 10 }}>

          {/* Player Count Selection - Counter */}
          <div className="mb-8">
            <label className="block text-xl font-bold mb-4 text-sonic-gold">
              Number of Players
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={decrementPlayerCount}
                disabled={playerCount <= 2}
                className="w-12 h-12 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-xl rounded-lg transition-all relative"
                style={{ zIndex: 15, pointerEvents: playerCount <= 2 ? 'none' : 'auto' }}
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                min="2"
                value={playerCount}
                lang="en-US"
                dir="ltr"
                translate="no"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPlayerCount(val); // Allow temporary invalid state like "1" or ""

                  // Only update the actual player list if valid number >= 2
                  const count = Number(val);
                  if (count >= 2) {
                    const newPlayers = Array(count).fill('').map((_, i) => players[i] || '');
                    setPlayers(newPlayers);
                    setValidatedPlayers({});
                    setValidationErrors({});
                  }
                }}
                onBlur={() => {
                  let count = Number(playerCount) || 2;
                  if (count < 2) count = 2;
                  setPlayerCount(count);

                  // Ensure final sync
                  const newPlayers = Array(count).fill('').map((_, i) => players[i] || '');
                  setPlayers(newPlayers);
                  // matches original behavior of resetting validation on count change
                  if (Number(playerCount) !== count) {
                    setValidatedPlayers({});
                    setValidationErrors({});
                  }
                }}
                className={`w-24 px-4 py-3 border-2 rounded-lg text-center text-xl font-bold focus:outline-none focus:border-sonic-gold focus:ring-2 focus:ring-sonic-gold/50 ${darkMode
                  ? 'bg-gray-800/50 border-gray-600 text-white'
                  : 'bg-blue-800/50 border-blue-600 text-white'
                  }`}
              />
              <button
                onClick={incrementPlayerCount}
                className="w-12 h-12 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xl rounded-lg transition-all relative"
                style={{ zIndex: 15, pointerEvents: 'auto' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Player Handles */}
          <div className="mb-10">
            <label className={`block text-xl font-bold mb-5 ${darkMode ? 'text-gray-200' : 'text-sonic-gold'}`}>
              Player Handles
            </label>
            <div className="space-y-4">
              {players.map((player, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch md:items-center">
                    <input
                      type="text"
                      placeholder={`Player ${index + 1} Handle`}
                      value={player}
                      onChange={(e) => handlePlayerInput(index, e.target.value)}
                      className={`flex-1 px-5 py-3.5 input-field text-white placeholder-opacity-60 ${darkMode ? 'bg-gray-800/50 border-gray-600 placeholder-gray-400' : 'placeholder-blue-300'
                        }`}
                      disabled={validating}
                    />
                    {validatedPlayers[index] && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 border-2 border-green-500 rounded-xl text-green-400 text-sm md:text-base font-bold whitespace-nowrap"
                      >
                        <span className="text-2xl">✓</span>
                        <span className="font-semibold">
                          {validatedPlayers[index].rating > 0
                            ? `Rating: ${validatedPlayers[index].rating}`
                            : 'Unrated'}
                        </span>
                      </motion.div>
                    )}
                    {validationErrors[index] && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-4 py-2 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-400 font-semibold"
                      >
                        ✗ {validationErrors[index]}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <div className="space-y-6 mb-8">
            {/* Customize Dropdown (Replaces old individual toggles) */}
            <CustomizeDropdown
              darkMode={darkMode}
              options={[
                {
                  label: "Restrict to Specific Topics (Filter)",
                  checked: !useAllTopics,
                  onChange: (checked) => handleTopicModeChange(!checked)
                },
                {
                  label: "Final Lap Mode (2x Points in last 25%)",
                  checked: finalLap,
                  onChange: setFinalLap
                }
              ]}
            >
              {/* Topic Filter Selection - Only shown if "Restrict to Specific Topics" is ON (inside dropdown) */}
              {!useAllTopics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>
                      Select Topics ({selectedCategories.length})
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllCategories}
                        className="text-xs px-2 py-1 bg-green-600 rounded text-white hover:bg-green-500 transition-colors"
                      >
                        All
                      </button>
                      <button
                        onClick={deselectAllCategories}
                        className="text-xs px-2 py-1 bg-red-600 rounded text-white hover:bg-red-500 transition-colors"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div className={`max-h-64 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                    {problemCategories.map(category => (
                      <label
                        key={category}
                        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors hover:translate-x-1 ${darkMode
                          ? 'hover:bg-gray-700/50'
                          : 'hover:bg-blue-800/50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="w-4 h-4 mr-3 accent-sonic-gold cursor-pointer"
                        />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-white'}`}>
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className={`text-xs text-center italic ${darkMode ? 'text-gray-500' : 'text-blue-300'}`}>
                    {selectedCategories.length === 0 ? "No topics selected (Defaults to All Topics)" : ""}
                  </p>
                </motion.div>
              )}
            </CustomizeDropdown>

            {/* Max Rating, Match Duration, and Number of Problems - Better Styled Inputs with Arrow Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-xl p-4 border-2 backdrop-blur-sm transition-all duration-200 ${darkMode
                ? 'bg-gray-800/40 border-gray-700'
                : 'bg-blue-800/20 border-blue-600/40'
                }`}>
                <label className={`block text-md font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-sonic-gold'}`}>
                  Rating Range
                </label>
                <div className="flex gap-2">
                  {/* Min Rating */}
                  <div className="flex-1 flex items-center gap-2">
                    <label className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>Min</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minRating}
                      lang="en-US"
                      dir="ltr"
                      translate="no"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val === '') setMinRating('');
                        else {
                          const num = Number(val);
                          if (num <= 3500) setMinRating(num);
                        }
                      }}
                      onBlur={() => {
                        let num = Number(minRating) || 800;
                        // Clamp between 800 and maxRating
                        num = Math.max(800, Math.min(Number(maxRating) || 3500, num));
                        setMinRating(num);
                      }}
                      className={`w-full px-1 py-2 text-white text-center text-lg font-bold rounded-lg input-field shadow-inner ${darkMode ? 'bg-gray-900/50 border-gray-600' : ''}`}
                      style={{ fontFeatureSettings: '"tnum"' }}
                    />
                  </div>

                  {/* Max Rating */}
                  <div className="flex-1 flex items-center gap-2">
                    <label className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>Max</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxRating}
                      lang="en-US"
                      dir="ltr"
                      translate="no"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val === '') setMaxRating('');
                        else {
                          const num = Number(val);
                          if (num <= 3500) setMaxRating(num);
                        }
                      }}
                      onBlur={() => {
                        let num = Number(maxRating) || 2000;
                        // Clamp between minRating and 3500
                        num = Math.max(Number(minRating) || 800, Math.min(3500, num));
                        setMaxRating(num);
                      }}
                      className={`w-full px-1 py-2 text-white text-center text-lg font-bold rounded-lg input-field shadow-inner ${darkMode ? 'bg-gray-900/50 border-gray-600' : ''}`}
                      style={{ fontFeatureSettings: '"tnum"' }}
                    />
                  </div>
                </div>
                <p className={`mt-2 text-center text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>800 - 3500</p>
              </div>

              <div className={`rounded-xl p-4 border-2 backdrop-blur-sm transition-all duration-200 ${darkMode
                ? 'bg-gray-800/60 border-gray-600'
                : 'bg-blue-800/30 border-blue-600/50'
                }`}>
                <label className={`block text-lg font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-sonic-gold'}`}>
                  Duration (min)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={matchDuration}
                    lang="en-US"
                    dir="ltr"
                    translate="no"
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val === '') setMatchDuration('');
                      else {
                        const num = Number(val);
                        // Clamp MAX only while typing
                        if (num <= 120) setMatchDuration(num);
                      }
                    }}
                    onBlur={() => {
                      // Clamp on blur
                      let num = Number(matchDuration) || 20;
                      num = Math.max(20, Math.min(120, num));
                      setMatchDuration(num);
                    }}
                    className={`w-full px-4 py-3.5 pr-14 text-white text-center text-xl font-bold rounded-xl input-field shadow-inner ${darkMode ? 'bg-gray-900/50 border-gray-600' : ''
                      }`}
                    style={{ fontFeatureSettings: '"tnum"' }}
                  />
                  <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center gap-0.5">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setMatchDuration(Math.min(120, matchDuration + 5))}
                      className={`w-7 h-6 flex items-center justify-center text-xs font-bold text-white rounded-t-md border-b transition-all ${darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                        : 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-blue-500 shadow-md'
                        }`}
                    >
                      ▲
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setMatchDuration(Math.max(20, matchDuration - 5))}
                      className={`w-7 h-6 flex items-center justify-center text-xs font-bold text-white rounded-b-md transition-all ${darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-md'
                        }`}
                    >
                      ▼
                    </motion.button>
                  </div>
                </div>
                <p className={`mt-3 text-center text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>20 - 120 min</p>
              </div>

              <div className={`rounded-xl p-4 border-2 backdrop-blur-sm transition-all duration-200 ${darkMode
                ? 'bg-gray-800/60 border-gray-600'
                : 'bg-blue-800/30 border-blue-600/50'
                }`}>
                <label className={`block text-lg font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-sonic-gold'}`}>
                  # Problems
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={numberOfProblems}
                    lang="en-US"
                    dir="ltr"
                    translate="no"
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val === '') setNumberOfProblems('');
                      else {
                        const num = Number(val);
                        // Clamp MAX only while typing
                        if (num <= 100) setNumberOfProblems(num);
                      }
                    }}
                    onBlur={() => {
                      let num = Number(numberOfProblems) || 1;
                      num = Math.max(1, Math.min(100, num));
                      setNumberOfProblems(num);
                    }}
                    className={`w-full px-4 py-3.5 pr-14 text-white text-center text-xl font-bold rounded-xl input-field shadow-inner ${darkMode ? 'bg-gray-900/50 border-gray-600' : ''
                      }`}
                    style={{ fontFeatureSettings: '"tnum"' }}
                  />
                  <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center gap-0.5">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setNumberOfProblems(Math.min(100, numberOfProblems + 1))}
                      className={`w-7 h-6 flex items-center justify-center text-xs font-bold text-white rounded-t-md border-b transition-all ${darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                        : 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-blue-500 shadow-md'
                        }`}
                    >
                      ▲
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setNumberOfProblems(Math.max(1, numberOfProblems - 1))}
                      className={`w-7 h-6 flex items-center justify-center text-xs font-bold text-white rounded-b-md transition-all ${darkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-md'
                        }`}
                    >
                      ▼
                    </motion.button>
                  </div>
                </div>
                <p className={`mt-3 text-center text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>1 - 100</p>
              </div>
            </div>
          </div>



          {/* Start Time Selection - Static Redesign */}
          <div className={`mb-8 p-6 rounded-xl border-2 backdrop-blur-sm transition-all duration-200 ${darkMode
            ? 'bg-gray-800/60 border-gray-600'
            : 'bg-blue-800/30 border-blue-600/50'
            }`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📅</span>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-200' : 'text-sonic-gold'}`}>
                  Schedule Match
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>
                  Set a start time to sync all players
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Date and Time Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Input */}
                <div className="space-y-2">
                  <label className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedStartTime ? selectedStartTime.split('T')[0] : ''}
                      placeholder="YYYY-MM-DD"
                      lang="en-US"
                      dir="ltr"
                      translate="no"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9-]/g, '');
                        const time = selectedStartTime ? selectedStartTime.split('T')[1] || '00:00' : '00:00';
                        setSelectedStartTime(`${val}T${time}`);
                      }}
                      className={`w-full px-4 py-3.5 pr-12 rounded-xl border-2 font-mono text-lg transition-all outline-none 
                        ${darkMode
                          ? 'bg-gray-900/50 border-gray-600 focus:border-sonic-gold text-white'
                          : 'bg-blue-900/30 border-blue-500/50 focus:border-sonic-gold text-white'
                        }`}
                      disabled={!!countdown}
                    />
                    {/* Hidden Date Picker Trigger */}
                    <div className="absolute right-2 top-0 bottom-0 flex items-center justify-center w-10">
                      <input
                        type="date"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = selectedStartTime ? selectedStartTime.split('T')[1] || '00:00' : '00:00';
                          setSelectedStartTime(`${date}T${time}`);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={!!countdown}
                      />
                      <span className="text-xl pointer-events-none">📅</span>
                    </div>
                  </div>
                </div>

                {/* Time Input */}
                <div className="space-y-2">
                  <label className={`text-sm font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-blue-300'}`}>
                    Time (HH:MM)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedStartTime ? selectedStartTime.split('T')[1] || '00:00' : ''}
                      placeholder="HH:MM"
                      lang="en-US"
                      dir="ltr"
                      translate="no"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9:]/g, '');
                        const date = selectedStartTime ? selectedStartTime.split('T')[0] : new Date().toISOString().split('T')[0];
                        setSelectedStartTime(`${date}T${val}`);
                      }}
                      className={`w-full px-4 py-3.5 pr-12 rounded-xl border-2 font-mono text-lg transition-all outline-none 
                        ${darkMode
                          ? 'bg-gray-900/50 border-gray-600 focus:border-sonic-gold text-white'
                          : 'bg-blue-900/30 border-blue-500/50 focus:border-sonic-gold text-white'
                        }`}
                      disabled={!!countdown}
                    />
                    {/* Hidden Time Picker Trigger */}
                    <div className="absolute right-2 top-0 bottom-0 flex items-center justify-center w-10">
                      <input
                        type="time"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => {
                          const time = e.target.value;
                          const date = selectedStartTime ? selectedStartTime.split('T')[0] : new Date().toISOString().split('T')[0];
                          setSelectedStartTime(`${date}T${time}`);
                        }}
                        disabled={!!countdown}
                      />
                      <span className="text-xl pointer-events-none">🕒</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Time Options */}
              {!countdown && (
                <div>
                  <label className={`block text-xs font-semibold mb-3 uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-blue-300'}`}>
                    Quick Start Options
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Now (+2m)', mins: 2 },
                      { label: '+5 min', mins: 5 },
                      { label: '+10 min', mins: 10 },
                      { label: '+15 min', mins: 15 },
                      { label: '+30 min', mins: 30 },
                      { label: '+1 hour', mins: 60 }
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          const now = new Date()
                          now.setMinutes(now.getMinutes() + opt.mins)
                          const offsetMs = now.getTimezoneOffset() * 60 * 1000
                          const localISOTime = new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
                          setSelectedStartTime(localISOTime)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all hover:scale-105 active:scale-95 ${darkMode
                          ? 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white hover:border-sonic-gold'
                          : 'bg-blue-700/30 border-blue-500/50 text-blue-100 hover:bg-blue-600 hover:text-white hover:border-sonic-gold'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 bg-red-900/50 border-2 border-red-500 rounded-xl text-red-100 font-semibold shadow-lg backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Start Battle Button - Start time is MANDATORY */}
          {!matchConfig && (
            <motion.button
              whileHover={{
                scale: (loading || Object.keys(validatedPlayers).length !== playerCount || !selectedStartTime) ? 1 : 1.02
              }}
              whileTap={{
                scale: (loading || Object.keys(validatedPlayers).length !== playerCount || !selectedStartTime) ? 1 : 0.98
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Button clicked, calling handleStartBattle')
                handleStartBattle()
              }}
              disabled={loading || Object.keys(validatedPlayers).length !== playerCount || !selectedStartTime}
              className={`w-full py-5 font-extrabold text-2xl rounded-2xl transition-all duration-300 shadow-2xl relative ${loading || Object.keys(validatedPlayers).length !== playerCount || !selectedStartTime
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 cursor-not-allowed'
                : darkMode
                  ? 'bg-gradient-to-r from-sonic-gold via-yellow-500 to-sonic-gold text-gray-900 hover:from-yellow-400 hover:via-sonic-gold hover:to-yellow-400 shadow-yellow-500/50'
                  : 'bg-gradient-to-r from-sonic-gold via-yellow-500 to-sonic-gold text-blue-900 hover:from-yellow-400 hover:via-sonic-gold hover:to-yellow-400 shadow-yellow-500/50'
                }`}
              style={{
                zIndex: 15,
                pointerEvents: (loading || Object.keys(validatedPlayers).length !== playerCount || !selectedStartTime) ? 'none' : 'auto'
              }}
            >
              {loading
                ? 'Preparing Battle...'
                : !selectedStartTime
                  ? '⚠️ Please Select Start Time (Required)'
                  : players.some(p => !p.trim())
                    ? '⚠️ Please Enter Player Handles'
                    : Object.keys(validatedPlayers).length !== playerCount
                      ? 'Please Wait for Validation'
                      : 'START BATTLE ⚡'
              }
            </motion.button>
          )}

        </div>
      </div>
    </div>
  )
}

export default Lobby
