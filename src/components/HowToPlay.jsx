import { motion } from 'framer-motion'
import { useState } from 'react'

function HowToPlay({ darkMode }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const sections = [
    {
      title: "Game Setup",
      icon: "🎮",
      content: [
        "Choose 2-4 players with unique Codeforces handles.",
        "Select specific topics or All Topics.",
        "Set difficulty (800-3000) and duration.",
        "Enable 'Final Lap' for 2x points in last 25%!"
      ]
    },
    {
      title: "Match Logic",
      icon: "🎯",
      content: [
        "Hidden 'Mystery Problem' awards 2x points.",
        "First to solve gets the points (lowest submission ID).",
        "Already solved problems are filtered out.",
        "Real-time 5s checks for submissions."
      ]
    },
    {
      title: "Scoring System",
      icon: "💎",
      content: [
        "Points = 500 × (1.32^((Rating - 800)/200))",
        "Stack multipliers: Mystery (2x) + Final Lap (2x) = 4x!",
        "Example: 1500 rating = ~1134 points base."
      ]
    },
    {
      title: "Problem Status",
      icon: "📊",
      content: [
        "✅ AC: Points awarded",
        "❌ WA: Incorrect output",
        "⚠️ TLE: Too slow",
        "Ratings & Tags hidden during match!"
      ]
    },
    {
      title: "Features",
      icon: "⚡",
      content: [
        "Live Leaderboard with Sonic sprites",
        "Ring Collection Animations",
        "Dark Mode Default",
        "Detailed Results & Mystery Reveal"
      ]
    },
    {
      title: "Tips & Strategy",
      icon: "💡",
      content: [
        "Speed is key for claiming points.",
        "Save hard problems for Final Lap (2x).",
        "Balance difficulty vs time.",
        "Watch opponents' progress!"
      ]
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl p-0.5 relative bg-gradient-to-r from-sonic-gold/30 to-blue-500/30"
      style={{ zIndex: 10 }}
    >
      <div className={`rounded-2xl p-6 shadow-xl backdrop-blur-md ${darkMode
          ? 'bg-gray-900/90'
          : 'bg-blue-900/90'
        }`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">📚</span> How to Play
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-6 py-2 rounded-xl font-bold transition-all duration-200 border-2 ${darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600'
                : 'bg-blue-700 hover:bg-blue-600 text-white border-blue-400'
              }`}
          >
            {isExpanded ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-5 rounded-xl border-2 transition-all hover:scale-[1.02] ${darkMode
                    ? 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                    : 'bg-blue-800/20 border-blue-400/30 hover:border-sonic-gold/50'
                  }`}
              >
                <h3 className="text-xl font-bold text-sonic-gold mb-3 flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span> {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className={`text-sm flex items-start gap-2 ${darkMode ? 'text-gray-300' : 'text-blue-100'}`}>
                      <span className="text-sonic-gold mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default HowToPlay
