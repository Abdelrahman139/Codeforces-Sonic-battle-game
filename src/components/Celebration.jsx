import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export function Celebration() {
    useEffect(() => {
        const duration = 3000
        const end = Date.now() + duration

        const frame = () => {
            // launch a few confetti from the left edge
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFD700', '#0000FF']
            })
            // and launch a few from the right edge
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FFD700', '#0000FF']
            })

            if (Date.now() < end) {
                requestAnimationFrame(frame)
            }
        }

        frame()

        // Big burst at start
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        })
    }, [])

    return null
}
