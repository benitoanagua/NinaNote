// Tipos para tweets
export interface ThreadTweet {
  id: string
  content: string
  charCount: number
  imageUrl?: string
}

export interface SavedThread {
  id: string
  url: string
  title: string
  tweets: ThreadTweet[]
  createdAt: string
}

// Tipos para servicios de IA
export interface AIModel {
  id: string
  name: string
  provider: string
  available: boolean
}

export interface AIResponse {
  content: string
  model: string
  tokens: number
}

// Tipos para scraping
export interface ScrapedContent {
  url: string
  title: string
  content: string
  excerpt: string
  author?: string
  publishedDate?: string
  image?: string
  images?: string[]
}

// Tipos para Twitter
export interface TwitterConfig {
  bearerToken: string
}

export interface TwitterPublishResult {
  success: boolean
  tweetIds?: string[]
  error?: string
}
