import { motion } from 'framer-motion'
import { useState } from 'react'

function AboutBattle({ darkMode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 rounded-2xl p-6 shadow-xl border-2 ${
        darkMode
          ? 'bg-gray-800/80 border-gray-600'
          : 'bg-blue-900/80 border-sonic-gold/50'
      }`}
      style={{ zIndex: 10 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-sonic-gold flex items-center gap-2">
          ⚔️ About the Battle
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all relative ${
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-blue-700 hover:bg-blue-600 text-white'
          }`}
          style={{ zIndex: 15, pointerEvents: 'auto' }}
        >
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <div>
            <h3 className="text-xl font-bold text-sonic-gold mb-2">What is Sonic Battle?</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-200'} leading-relaxed`}>
              Sonic Battle is a competitive coding arena that transforms competitive programming into an exciting, real-time racing experience. 
              Players compete to solve Codeforces problems as fast as possible, earning points based on problem difficulty and strategic multipliers.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-sonic-gold mb-2">Why Sonic Battle?</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-200'} leading-relaxed`}>
              Inspired by the speed and excitement of Sonic the Hedgehog, this platform adds visual excitement to competitive programming. 
              Watch your character race across the progress bar as you solve problems, compete with friends in real-time, and experience the thrill 
              of the "Final Lap" multiplier rush!
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-sonic-gold mb-2">Key Features</h3>
            <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-blue-200'}`}>
              <li>• <strong>Real-time Competition:</strong> See live updates as players solve problems</li>
              <li>• <strong>Mystery Multiplier:</strong> One randomly selected problem awards double points!</li>
              <li>• <strong>Final Lap Mode:</strong> Double points in the final 25% of match time</li>
              <li>• <strong>Smart Filtering:</strong> Only problems you haven't solved are included</li>
              <li>• <strong>Beautiful UI:</strong> Sonic-themed design with smooth animations</li>
              <li>• <strong>Flexible Setup:</strong> Choose categories, difficulty, duration, and more</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold text-sonic-gold mb-2">Perfect For</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-200'} leading-relaxed`}>
              Whether you're practicing for contests, competing with friends, hosting coding tournaments, or just having fun solving problems, 
              Sonic Battle makes competitive programming more engaging and exciting!
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default AboutBattle

