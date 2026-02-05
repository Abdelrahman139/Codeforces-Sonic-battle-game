import { getUserStatus } from './codeforcesApi'

const POLLING_INTERVAL = 5000 // 5 seconds

/**
 * Create a polling manager for match submissions
 */
export class MatchPollingManager {
  constructor(handles, matchStartTime, onNewSubmission) {
    this.handles = handles
    this.matchStartTime = matchStartTime
    this.onNewSubmission = onNewSubmission
    this.lastSubmissionIds = new Map() // handle -> last submission ID seen
    this.isPolling = false
    this.pollingInterval = null
    this.lastPollTime = new Map() // handle -> last poll timestamp
    
    // Initialize last submission IDs
    handles.forEach(handle => {
      this.lastSubmissionIds.set(handle, -1)
      this.lastPollTime.set(handle, 0)
    })
  }
  
  start() {
    if (this.isPolling) return
    
    this.isPolling = true
    this.poll()
    this.pollingInterval = setInterval(() => {
      this.poll()
    }, POLLING_INTERVAL)
  }
  
  stop() {
    this.isPolling = false
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }
  
  async poll() {
    // Poll each handle sequentially to respect rate limits
    for (const handle of this.handles) {
      try {
        await this.pollHandle(handle)
        // Small delay between handles
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error polling handle ${handle}:`, error)
      }
    }
  }
  
  async pollHandle(handle) {
    try {
      const submissions = await getUserStatus(handle)
      
      // Filter submissions from this match only
      const matchSubmissions = submissions.filter(sub => {
        const submissionTime = sub.creationTimeSeconds * 1000
        return submissionTime >= this.matchStartTime
      })
      
      // Sort by submission ID to find new ones
      matchSubmissions.sort((a, b) => a.id - b.id)
      
      const lastId = this.lastSubmissionIds.get(handle)
      const newSubmissions = matchSubmissions.filter(sub => sub.id > lastId)
      
      if (newSubmissions.length > 0) {
        // Update last seen ID
        const maxId = Math.max(...newSubmissions.map(s => s.id))
        this.lastSubmissionIds.set(handle, maxId)
        
        // Process new submissions
        newSubmissions.forEach(submission => {
          this.onNewSubmission(handle, submission)
        })
      }
    } catch (error) {
      console.error(`Error polling handle ${handle}:`, error)
    }
  }
}
