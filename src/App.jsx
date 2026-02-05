import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Lobby from './components/Lobby'
import CountdownPage from './components/CountdownPage'
import Results from './components/Results'
import Navigation from './components/Navigation'
import { AnimatedBackground } from './components/AnimatedBackground'

function AppContent() {
  const location = useLocation()

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -20,
    },
  }

  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.25,
  }

  return (
    <>
      <AnimatedBackground />
      <Navigation />
      <div className="relative pt-16" style={{ zIndex: 10, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
          <Route 
            path="/" 
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <Lobby />
              </motion.div>
            } 
          />
          <Route 
            path="/countdown" 
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <CountdownPage />
              </motion.div>
            } 
          />
          <Route 
            path="/results" 
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <Results />
              </motion.div>
            } 
          />
        </Routes>
      </AnimatePresence>
      </div>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
