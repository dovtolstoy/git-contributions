import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Using demo mode.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

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
}

export type DailySummaryRow = {
  id: string
  date: string
  author: string
  total_lines: number
  total_commits: number
  avg_quality_score: number | null
  avatar_url: string | null
}

export type ContributorRow = {
  id: string
  login: string
  total_lines: number
  total_commits: number
  avg_quality_score: number | null
  avatar_url: string | null
}
