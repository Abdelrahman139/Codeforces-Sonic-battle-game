/**
 * Calculate Sonic Points based on problem rating
 * Formula: Points = 500 * (1.32^((Rating - 800)/200))
 */
export function calculatePoints(rating) {
  if (!rating || rating < 800) {
    rating = 800
  }
  
  const exponent = (rating - 800) / 200
  const points = 500 * Math.pow(1.32, exponent)
  
  // Round to nearest integer
  return Math.round(points)
}

/**
 * Calculate points for a problem with optional multiplier
 */
export function calculateProblemPoints(rating, multiplier = 1) {
  return Math.round(calculatePoints(rating) * multiplier)
}
