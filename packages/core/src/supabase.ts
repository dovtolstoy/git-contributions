import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  Commit,
  CommitRow,
  Contributor,
  ContributorRow,
  DailySummary,
  DailySummaryRow,
  toCommit,
  toContributor,
  toDailySummary,
} from './types.js'

export type SupabaseConfig = {
  url: string
  key: string
}

export const createSupabaseClient = (config: SupabaseConfig) => {
  const client: SupabaseClient = createClient(config.url, config.key)

  const saveCommit = async (commit: Commit): Promise<void> => {
    const row: Partial<CommitRow> = {
      sha: commit.sha,
      repo: commit.repo,
      author: commit.author,
      date: commit.date,
      commit_date: commit.commitDate,
      message: commit.message,
      additions: commit.additions,
      pr_number: commit.prNumber ?? null,
      pr_title: commit.prTitle ?? null,
      pr_url: commit.prUrl ?? null,
      pr_description: commit.prDescription ?? null,
      quality_score: commit.quality?.score ?? null,
      quality_summary: commit.quality?.summary ?? null,
      quality_analysis: commit.quality?.analysis ?? null,
      analyzed_at: commit.analyzedAt ?? null,
    }

    const { error } = await client
      .from('commits')
      .upsert(row, { onConflict: 'sha,repo' })

    if (error) {
      throw new Error(`Failed to save commit: ${error.message}`)
    }
  }

  const updateDailySummary = async (
    date: string,
    author: string,
    lines: number,
    qualityScore?: number,
    avatarUrl?: string
  ): Promise<void> => {
    // First, try to get existing summary
    const { data: existing } = await client
      .from('daily_summaries')
      .select('*')
      .eq('date', date)
      .eq('author', author)
      .single()

    if (existing) {
      // Update existing
      const newTotalLines = existing.total_lines + lines
      const newTotalCommits = existing.total_commits + 1

      // Calculate new average quality score
      let newAvgScore = existing.avg_quality_score
      if (qualityScore !== undefined) {
        if (existing.avg_quality_score) {
          // Weighted average
          newAvgScore =
            (existing.avg_quality_score * existing.total_commits + qualityScore) /
            newTotalCommits
        } else {
          newAvgScore = qualityScore
        }
      }

      const { error } = await client
        .from('daily_summaries')
        .update({
          total_lines: newTotalLines,
          total_commits: newTotalCommits,
          avg_quality_score: newAvgScore,
          avatar_url: avatarUrl ?? existing.avatar_url,
        })
        .eq('id', existing.id)

      if (error) {
        throw new Error(`Failed to update daily summary: ${error.message}`)
      }
    } else {
      // Insert new
      const { error } = await client.from('daily_summaries').insert({
        date,
        author,
        total_lines: lines,
        total_commits: 1,
        avg_quality_score: qualityScore ?? null,
        avatar_url: avatarUrl ?? null,
      })

      if (error) {
        throw new Error(`Failed to create daily summary: ${error.message}`)
      }
    }
  }

  const updateContributor = async (
    login: string,
    lines: number,
    qualityScore?: number,
    avatarUrl?: string
  ): Promise<void> => {
    // First, try to get existing contributor
    const { data: existing } = await client
      .from('contributors')
      .select('*')
      .eq('login', login)
      .single()

    if (existing) {
      // Update existing
      const newTotalLines = existing.total_lines + lines
      const newTotalCommits = existing.total_commits + 1

      // Calculate new average quality score
      let newAvgScore = existing.avg_quality_score
      if (qualityScore !== undefined) {
        if (existing.avg_quality_score) {
          newAvgScore =
            (existing.avg_quality_score * existing.total_commits + qualityScore) /
            newTotalCommits
        } else {
          newAvgScore = qualityScore
        }
      }

      const { error } = await client
        .from('contributors')
        .update({
          total_lines: newTotalLines,
          total_commits: newTotalCommits,
          avg_quality_score: newAvgScore,
          avatar_url: avatarUrl ?? existing.avatar_url,
        })
        .eq('id', existing.id)

      if (error) {
        throw new Error(`Failed to update contributor: ${error.message}`)
      }
    } else {
      // Insert new
      const { error } = await client.from('contributors').insert({
        login,
        total_lines: lines,
        total_commits: 1,
        avg_quality_score: qualityScore ?? null,
        avatar_url: avatarUrl ?? null,
      })

      if (error) {
        throw new Error(`Failed to create contributor: ${error.message}`)
      }
    }
  }

  const getCommits = async (
    days: number,
    repo?: string
  ): Promise<Commit[]> => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]

    let query = client
      .from('commits')
      .select('*')
      .gte('date', sinceStr)
      .order('date', { ascending: false })

    if (repo) {
      query = query.eq('repo', repo)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch commits: ${error.message}`)
    }

    return (data as CommitRow[]).map(toCommit)
  }

  const getDailySummaries = async (
    days: number
  ): Promise<DailySummary[]> => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]

    const { data, error } = await client
      .from('daily_summaries')
      .select('*')
      .gte('date', sinceStr)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch daily summaries: ${error.message}`)
    }

    return (data as DailySummaryRow[]).map(toDailySummary)
  }

  const getContributors = async (): Promise<Contributor[]> => {
    const { data, error } = await client
      .from('contributors')
      .select('*')
      .order('total_lines', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch contributors: ${error.message}`)
    }

    return (data as ContributorRow[]).map(toContributor)
  }

  const getTeamDigest = async (
    date: string
  ): Promise<{
    summaries: DailySummary[]
    topCommits: Commit[]
    totalLines: number
    totalCommits: number
    avgQuality: number | null
  }> => {
    // Get daily summaries for the date
    const { data: summaryData, error: summaryError } = await client
      .from('daily_summaries')
      .select('*')
      .eq('date', date)

    if (summaryError) {
      throw new Error(`Failed to fetch summaries: ${summaryError.message}`)
    }

    const summaries = (summaryData as DailySummaryRow[]).map(toDailySummary)

    // Get top commits for the date (highest quality scores)
    const { data: commitData, error: commitError } = await client
      .from('commits')
      .select('*')
      .eq('date', date)
      .not('quality_score', 'is', null)
      .order('quality_score', { ascending: false })
      .limit(5)

    if (commitError) {
      throw new Error(`Failed to fetch commits: ${commitError.message}`)
    }

    const topCommits = (commitData as CommitRow[]).map(toCommit)

    // Calculate totals
    const totalLines = summaries.reduce((sum, s) => sum + s.totalLines, 0)
    const totalCommits = summaries.reduce((sum, s) => sum + s.totalCommits, 0)

    const scoresWithValues = summaries
      .filter((s) => s.avgQualityScore !== undefined)
      .map((s) => s.avgQualityScore as number)

    const avgQuality =
      scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, s) => sum + s, 0) / scoresWithValues.length
        : null

    return {
      summaries,
      topCommits,
      totalLines,
      totalCommits,
      avgQuality,
    }
  }

  return {
    client,
    saveCommit,
    updateDailySummary,
    updateContributor,
    getCommits,
    getDailySummaries,
    getContributors,
    getTeamDigest,
  }
}

export type SupabaseClientWrapper = ReturnType<typeof createSupabaseClient>
