import { motion } from 'framer-motion'

export function ProblemSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-lg border-2 bg-blue-900/50 border-blue-600 animate-pulse"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-6 bg-blue-700/50 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-blue-700/30 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-16 bg-blue-700/50 rounded"></div>
      </div>
    </motion.div>
  )
}

export function PlayerSkeleton() {
  return (
    <div className="relative mb-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-700/50 rounded-full"></div>
          <div className="h-5 bg-blue-700/50 rounded w-32"></div>
        </div>
        <div className="h-6 bg-blue-700/50 rounded w-20"></div>
      </div>
      <div className="h-8 bg-blue-700/30 rounded-full"></div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-lg border-2 bg-blue-900/50 border-blue-600 animate-pulse">
      <div className="h-6 bg-blue-700/50 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-blue-700/30 rounded w-full"></div>
        <div className="h-4 bg-blue-700/30 rounded w-5/6"></div>
        <div className="h-4 bg-blue-700/30 rounded w-4/6"></div>
      </div>
    </div>
  )
}

