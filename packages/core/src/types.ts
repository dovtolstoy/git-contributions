import { z } from 'zod'

// Base schemas for validation
export const QualitySchema = z.object({
  score: z.number().min(1).max(10),
  summary: z.string(),
  analysis: z.string(),
})

export const CommitSchema = z.object({
  sha: z.string(),
  repo: z.string(),
  author: z.string(),
  date: z.string(), // YYYY-MM-DD
  commitDate: z.string(), // ISO timestamp
  message: z.string(),
  additions: z.number(),
  prNumber: z.number().optional(),
  prTitle: z.string().optional(),
  prUrl: z.string().optional(),
  prDescription: z.string().optional(),
  quality: QualitySchema.optional(),
  analyzedAt: z.string().optional(),
})

export const DailySummarySchema = z.object({
  date: z.string(),
  author: z.string(),
  totalLines: z.number(),
  totalCommits: z.number(),
  avgQualityScore: z.number().optional(),
  avatarUrl: z.string().optional(),
})

export const ContributorSchema = z.object({
  login: z.string(),
  totalLines: z.number(),
  totalCommits: z.number(),
  avgQualityScore: z.number().optional(),
  avatarUrl: z.string().optional(),
})

export const AnalysisResultSchema = z.object({
  score: z.number().min(1).max(10),
  summary: z.string(),
  analysis: z.string(),
})

// Derived types from schemas
export type Quality = z.infer<typeof QualitySchema>
export type Commit = z.infer<typeof CommitSchema>
export type DailySummary = z.infer<typeof DailySummarySchema>
export type Contributor = z.infer<typeof ContributorSchema>
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>

// PR details from GitHub API
export type PRDetails = {
  number: number
  title: string
  url: string
  body: string | null
  author: string
  authorAvatarUrl: string
  additions: number
  deletions: number
  mergedAt: string | null
  sha: string
}

// Commit diff from GitHub API
export type CommitDiff = {
  sha: string
  message: string
  author: string
  date: string
  files: DiffFile[]
  stats: {
    additions: number
    deletions: number
    total: number
  }
}

export type DiffFile = {
  filename: string
  status: 'added' | 'removed' | 'modified' | 'renamed'
  additions: number
  deletions: number
  patch?: string
}

// Project context for AI analysis
export type ProjectContext = {
  agentsmd?: string
  rules?: string[]
  readme?: string
}

// Configuration
export type Config = {
  supabaseUrl: string
  supabaseKey: string
  openaiApiKey: string
  githubToken: string
  minLines?: number
}

// Database row types (snake_case from Supabase)
export type CommitRow = {
  id: string
  sha: string
  repo: string
  author: string
  date: string
  commit_date: string
  message: string
  additions: number
  pr_number: number | null
  pr_title: string | null
  pr_url: string | null
  pr_description: string | null
  quality_score: number | null
  quality_summary: string | null
  quality_analysis: string | null
  analyzed_at: string | null
  created_at: string
  updated_at: string
}

export type DailySummaryRow = {
  id: string
  date: string
  author: string
  total_lines: number
  total_commits: number
  avg_quality_score: number | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ContributorRow = {
  id: string
  login: string
  total_lines: number
  total_commits: number
  avg_quality_score: number | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// Utility type converters
export const toCommit = (row: CommitRow): Commit => ({
  sha: row.sha,
  repo: row.repo,
  author: row.author,
  date: row.date,
  commitDate: row.commit_date,
  message: row.message,
  additions: row.additions,
  prNumber: row.pr_number ?? undefined,
  prTitle: row.pr_title ?? undefined,
  prUrl: row.pr_url ?? undefined,
  prDescription: row.pr_description ?? undefined,
  quality: row.quality_score
    ? {
        score: row.quality_score,
        summary: row.quality_summary ?? '',
        analysis: row.quality_analysis ?? '',
      }
    : undefined,
  analyzedAt: row.analyzed_at ?? undefined,
})

export const toDailySummary = (row: DailySummaryRow): DailySummary => ({
  date: row.date,
  author: row.author,
  totalLines: row.total_lines,
  totalCommits: row.total_commits,
  avgQualityScore: row.avg_quality_score ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
})

export const toContributor = (row: ContributorRow): Contributor => ({
  login: row.login,
  totalLines: row.total_lines,
  totalCommits: row.total_commits,
  avgQualityScore: row.avg_quality_score ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
})
