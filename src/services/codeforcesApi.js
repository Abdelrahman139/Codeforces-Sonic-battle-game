import axios from 'axios'

const CODEFORCES_API_BASE = 'https://codeforces.com/api'
const RATE_LIMIT_DELAY = 2000 // 2 seconds between requests

let lastRequestTime = 0

/**
 * Rate-limited wrapper for Codeforces API calls
 */
async function rateLimitedRequest(url) {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest))
  }

  lastRequestTime = Date.now()

  try {
    const response = await axios.get(url, { timeout: 10000 })

    if (response.data.status === 'OK') {
      return response.data.result
    } else {
      throw new Error(response.data.comment || 'Codeforces API error')
    }
  } catch (error) {
    if (error.response) {
      throw new Error(`Codeforces API error: ${error.response.status} - ${error.response.data?.comment || 'Unknown error'}`)
    }
    throw error
  }
}

/**
 * Validate a Codeforces handle
 */
export async function validateHandle(handle) {
  try {
    const result = await rateLimitedRequest(
      `${CODEFORCES_API_BASE}/user.info?handles=${handle}`
    )

    if (result && result.length > 0) {
      return {
        valid: true,
        handle: result[0].handle,
        rating: result[0].rating || 0,
        maxRating: result[0].maxRating || 0,
        avatar: result[0].avatar || null
      }
    }

    return { valid: false, error: 'Handle not found' }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

/**
 * Validate multiple handles in a single request
 */
export async function validateHandles(handles) {
  if (handles.length === 0) return []

  const handlesStr = handles.join(';')

  try {
    const result = await rateLimitedRequest(
      `${CODEFORCES_API_BASE}/user.info?handles=${handlesStr}`
    )

    return handles.map(handle => {
      const userInfo = result.find(u => u.handle.toLowerCase() === handle.toLowerCase())
      if (userInfo) {
        return {
          valid: true,
          handle: userInfo.handle,
          rating: userInfo.rating || 0,
          maxRating: userInfo.maxRating || 0,
          avatar: userInfo.avatar || null
        }
      }
      return { valid: false, error: 'Handle not found', handle }
    })
  } catch (error) {
    // If batch fails, try individual validation
    const results = []
    for (const handle of handles) {
      results.push(await validateHandle(handle))
    }
    return results
  }
}

/**
 * Get all available tags from Codeforces
 */
export async function getAllTags() {
  try {
    const result = await rateLimitedRequest(
      `${CODEFORCES_API_BASE}/problemset.problems`
    )

    if (!result || !result.problems) {
      return []
    }

    // Extract all unique tags
    const tagSet = new Set()
    result.problems.forEach(problem => {
      if (problem.tags && Array.isArray(problem.tags)) {
        problem.tags.forEach(tag => tagSet.add(tag))
      }
    })

    // Sort tags alphabetically
    return Array.from(tagSet).sort()
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

/**
 * Get problems list filtered by tags and max rating
 */
export async function getProblems(tags = [], maxRating = 3000, minRating = 800) {
  try {
    const result = await rateLimitedRequest(
      `${CODEFORCES_API_BASE}/problemset.problems`
    )

    if (!result || !result.problems) {
      return []
    }

    let filtered = result.problems.filter(problem => {
      // Filter by rating
      if (problem.rating && (problem.rating > maxRating || problem.rating < minRating)) {
        return false
      }

      // Filter by tags if specified
      if (tags.length > 0) {
        return tags.some(tag => problem.tags.includes(tag))
      }

      return true
    })

    return filtered
  } catch (error) {
    console.error('Error fetching problems:', error)
    throw error
  }
}

/**
 * Get user's submission status
 */
export async function getUserStatus(handle) {
  try {
    const result = await rateLimitedRequest(
      `${CODEFORCES_API_BASE}/user.status?handle=${handle}`
    )

    return result || []
  } catch (error) {
    console.error(`Error fetching status for ${handle}:`, error)
    throw error
  }
}

/**
 * Get multiple users' submission statuses
 */
export async function getMultipleUserStatuses(handles) {
  const results = {}

  // Fetch sequentially to respect rate limits
  for (const handle of handles) {
    try {
      results[handle] = await getUserStatus(handle)
    } catch (error) {
      console.error(`Failed to fetch status for ${handle}:`, error)
      results[handle] = []
    }
  }

  return results
}

/**
 * Filter out problems that have been solved by any of the players
 * Optimized version that processes in batches
 */
export async function filterUnsolvedProblems(problems, handles) {
  if (handles.length === 0) return problems

  // Create a set of solved problem IDs
  const solvedProblemIds = new Set()

  // Process handles in batches to optimize
  const batchSize = 2
  for (let i = 0; i < handles.length; i += batchSize) {
    const batch = handles.slice(i, i + batchSize)
    const batchStatuses = await getMultipleUserStatuses(batch)

    Object.values(batchStatuses).forEach(submissions => {
      submissions.forEach(submission => {
        if (submission.verdict === 'OK') {
          const problemId = `${submission.problem.contestId}-${submission.problem.index}`
          solvedProblemIds.add(problemId)
        }
      })
    })
  }

  // Filter out solved problems
  return problems.filter(problem => {
    const problemId = `${problem.contestId}-${problem.index}`
    return !solvedProblemIds.has(problemId)
  })
}
