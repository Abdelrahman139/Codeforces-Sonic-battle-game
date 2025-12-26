import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function CustomizeDropdown({ options, darkMode, children }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div className="relative mb-6" ref={dropdownRef}>
            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 border-2 shadow-lg ${darkMode
                    ? 'bg-gray-800/60 border-gray-600 text-white hover:bg-gray-700/60'
                    : 'bg-blue-900/60 border-sonic-gold text-white hover:bg-blue-800/70'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">⚙️</span>
                    <span>Customize Match</span>
                </div>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sonic-gold"
                >
                    ▼
                </motion.span>
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`mt-2 rounded-xl overflow-hidden shadow-2xl border-2 backdrop-blur-xl ${darkMode
                            ? 'bg-gray-900/95 border-gray-600'
                            : 'bg-black/80 border-sonic-gold'
                            }`}
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {options.map((option, index) => (
                                <div key={index} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${darkMode
                                    ? 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                                    : 'bg-blue-800/20 border-blue-400/30 hover:border-sonic-gold/50 hover:bg-blue-800/30'
                                    }`}>
                                    <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-white'}`}>
                                        {option.label}
                                    </span>

                                    {/* Custom Toggle Switch */}
                                    <button
                                        onClick={() => option.onChange(!option.checked)}
                                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${option.checked
                                            ? 'bg-sonic-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]'
                                            : 'bg-gray-600'
                                            }`}
                                    >
                                        <motion.div
                                            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md"
                                            animate={{ x: option.checked ? 24 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
