import { CommitDiff, DiffFile, PRDetails, ProjectContext } from './types.js'

export type GitHubConfig = {
  token: string
}

type GitHubApiResponse<T> = T

const fetchGitHub = async <T>(
  endpoint: string,
  token: string
): Promise<GitHubApiResponse<T>> => {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${response.status} - ${error}`)
  }

  return response.json() as Promise<T>
}

type GitHubPR = {
  number: number
  title: string
  html_url: string
  body: string | null
  user: { login: string; avatar_url: string }
  additions: number
  deletions: number
  merged_at: string | null
  merge_commit_sha: string | null
}

type GitHubCommit = {
  sha: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
  author: { login: string; avatar_url: string } | null
  stats: { additions: number; deletions: number; total: number }
  files: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    patch?: string
  }>
}

type GitHubContent = {
  content: string
  encoding: string
}

export const createGitHubClient = (config: GitHubConfig) => {
  const { token } = config

  const fetchPRDetails = async (
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<PRDetails> => {
    const pr = await fetchGitHub<GitHubPR>(
      `/repos/${owner}/${repo}/pulls/${prNumber}`,
      token
    )

    return {
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      body: pr.body,
      author: pr.user.login,
      authorAvatarUrl: pr.user.avatar_url,
      additions: pr.additions,
      deletions: pr.deletions,
      mergedAt: pr.merged_at,
      sha: pr.merge_commit_sha ?? '',
    }
  }

  const fetchCommitDiff = async (
    owner: string,
    repo: string,
    sha: string
  ): Promise<CommitDiff> => {
    const commit = await fetchGitHub<GitHubCommit>(
      `/repos/${owner}/${repo}/commits/${sha}`,
      token
    )

    const files: DiffFile[] = commit.files.map((f) => ({
      filename: f.filename,
      status: f.status as DiffFile['status'],
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    }))

    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.author?.login ?? commit.commit.author.name,
      date: commit.commit.author.date,
      files,
      stats: commit.stats,
    }
  }

  const fetchFileContent = async (
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string | null> => {
    try {
      const endpoint = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`
      const content = await fetchGitHub<GitHubContent>(endpoint, token)

      if (content.encoding === 'base64') {
        return Buffer.from(content.content, 'base64').toString('utf-8')
      }
      return content.content
    } catch {
      return null
    }
  }

  const fetchProjectContext = async (
    owner: string,
    repo: string,
    sha?: string
  ): Promise<ProjectContext> => {
    const context: ProjectContext = {}

    // Fetch AGENTS.md
    const agentsmd = await fetchFileContent(owner, repo, 'AGENTS.md', sha)
    if (agentsmd) {
      context.agentsmd = agentsmd
    }

    // Fetch .cursor/rules files
    try {
      const rulesDir = await fetchGitHub<Array<{ name: string; path: string }>>(
        `/repos/${owner}/${repo}/contents/.cursor/rules${sha ? `?ref=${sha}` : ''}`,
        token
      )

      const rules: string[] = []
      for (const file of rulesDir) {
        if (file.name.endsWith('.mdc') || file.name.endsWith('.md')) {
          const content = await fetchFileContent(owner, repo, file.path, sha)
          if (content) {
            rules.push(`## ${file.name}\n${content}`)
          }
        }
      }

      if (rules.length > 0) {
        context.rules = rules
      }
    } catch {
      // No rules directory
    }

    return context
  }

  const fetchMergedPRs = async (
    owner: string,
    repo: string,
    days: number
  ): Promise<PRDetails[]> => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString()

    // Search for merged PRs
    const searchQuery = `repo:${owner}/${repo} is:pr is:merged merged:>=${sinceStr.split('T')[0]}`
    const searchResult = await fetchGitHub<{
      items: Array<{ number: number }>
    }>(`/search/issues?q=${encodeURIComponent(searchQuery)}&per_page=100`, token)

    const prs: PRDetails[] = []
    for (const item of searchResult.items) {
      const pr = await fetchPRDetails(owner, repo, item.number)
      prs.push(pr)
    }

    return prs
  }

  return {
    fetchPRDetails,
    fetchCommitDiff,
    fetchProjectContext,
    fetchMergedPRs,
    fetchFileContent,
  }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>
