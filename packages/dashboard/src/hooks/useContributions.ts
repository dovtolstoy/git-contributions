import { useState, useEffect, useCallback } from 'react'
import { supabase, CommitRow, DailySummaryRow, ContributorRow } from '../lib/supabase'

export type Commit = {
  id: string
  sha: string
  repo: string
  author: string
  date: string
  commitDate: string
  message: string
  additions: number
  prNumber?: number
  prTitle?: string
  prUrl?: string
  prDescription?: string
  qualityScore?: number
  qualitySummary?: string
  qualityAnalysis?: string
}

export type DailySummary = {
  date: string
  author: string
  totalLines: number
  totalCommits: number
  avgQualityScore?: number
  avatarUrl?: string
}

export type Contributor = {
  login: string
  totalLines: number
  totalCommits: number
  avgQualityScore?: number
  avatarUrl?: string
}

export type Filters = {
  days: number
  repo?: string
  author?: string
  groupBy: 'day' | 'week' | 'month'
}

const toCommit = (row: CommitRow): Commit => ({
  id: row.id,
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
  qualityScore: row.quality_score ?? undefined,
  qualitySummary: row.quality_summary ?? undefined,
  qualityAnalysis: row.quality_analysis ?? undefined,
})

const toDailySummary = (row: DailySummaryRow): DailySummary => ({
  date: row.date,
  author: row.author,
  totalLines: row.total_lines,
  totalCommits: row.total_commits,
  avgQualityScore: row.avg_quality_score ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
})

const toContributor = (row: ContributorRow): Contributor => ({
  login: row.login,
  totalLines: row.total_lines,
  totalCommits: row.total_commits,
  avgQualityScore: row.avg_quality_score ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
})

export const useContributions = (initialFilters: Filters) => {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [commits, setCommits] = useState<Commit[]>([])
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([])
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const since = new Date()
      since.setDate(since.getDate() - filters.days)
      const sinceStr = since.toISOString().split('T')[0]

      // Fetch commits
      let commitsQuery = supabase
        .from('commits')
        .select('*')
        .gte('date', sinceStr)
        .order('date', { ascending: false })

      if (filters.repo) {
        commitsQuery = commitsQuery.eq('repo', filters.repo)
      }
      if (filters.author) {
        commitsQuery = commitsQuery.eq('author', filters.author)
      }

      const { data: commitsData, error: commitsError } = await commitsQuery

      if (commitsError) throw commitsError
      setCommits((commitsData as CommitRow[]).map(toCommit))

      // Fetch daily summaries
      let summariesQuery = supabase
        .from('daily_summaries')
        .select('*')
        .gte('date', sinceStr)
        .order('date', { ascending: false })

      if (filters.author) {
        summariesQuery = summariesQuery.eq('author', filters.author)
      }

      const { data: summariesData, error: summariesError } = await summariesQuery

      if (summariesError) throw summariesError
      setDailySummaries((summariesData as DailySummaryRow[]).map(toDailySummary))

      // Fetch contributors
      const { data: contributorsData, error: contributorsError } = await supabase
        .from('contributors')
        .select('*')
        .order('total_lines', { ascending: false })

      if (contributorsError) throw contributorsError
      setContributors((contributorsData as ContributorRow[]).map(toContributor))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  // Aggregate data for charts
  const aggregatedByAuthor = contributors.map((c) => ({
    name: c.login,
    lines: c.totalLines,
    commits: c.totalCommits,
    quality: c.avgQualityScore ?? 0,
    avatarUrl: c.avatarUrl,
  }))

  const aggregatedByDay = Object.values(
    dailySummaries.reduce(
      (acc, s) => {
        if (!acc[s.date]) {
          acc[s.date] = { date: s.date, lines: 0, commits: 0 }
        }
        acc[s.date]!.lines += s.totalLines
        acc[s.date]!.commits += s.totalCommits
        return acc
      },
      {} as Record<string, { date: string; lines: number; commits: number }>
    )
  ).sort((a, b) => a.date.localeCompare(b.date))

  const todayStats = (() => {
    const today = new Date().toISOString().split('T')[0]!
    const todaySummaries = dailySummaries.filter((s) => s.date === today)
    const totalLines = todaySummaries.reduce((sum, s) => sum + s.totalLines, 0)
    const totalCommits = todaySummaries.reduce((sum, s) => sum + s.totalCommits, 0)
    const scores = todaySummaries
      .filter((s) => s.avgQualityScore !== undefined)
      .map((s) => s.avgQualityScore!)
    const avgQuality = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null

    return { totalLines, totalCommits, avgQuality, contributors: todaySummaries.length }
  })()

  return {
    commits,
    dailySummaries,
    contributors,
    loading,
    error,
    filters,
    updateFilters,
    refresh: fetchData,
    aggregatedByAuthor,
    aggregatedByDay,
    todayStats,
  }
}
