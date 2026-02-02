import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  createAnalyzer,
  createGitHubClient,
  createSupabaseClient,
  Commit,
} from '@git-contributions/core'

const run = async (): Promise<void> => {
  try {
    // Get inputs
    const supabaseUrl = core.getInput('supabase-url', { required: true })
    const supabaseKey = core.getInput('supabase-key', { required: true })
    const openaiApiKey = core.getInput('openai-api-key', { required: true })
    const githubToken = core.getInput('github-token', { required: true })
    const minLines = parseInt(core.getInput('min-lines') || '10', 10)

    // Get PR context
    const { context } = github
    const { payload } = context

    // Only run on merged PRs
    if (context.eventName !== 'pull_request') {
      core.info('Not a pull_request event, skipping')
      return
    }

    const pr = payload.pull_request
    if (!pr || !pr.merged) {
      core.info('PR not merged, skipping')
      return
    }

    const owner = context.repo.owner
    const repo = context.repo.repo
    const prNumber = pr.number
    const sha = pr.merge_commit_sha

    core.info(`Processing merged PR #${prNumber} (${sha})`)

    // Initialize clients
    const ghClient = createGitHubClient({ token: githubToken })
    const supabase = createSupabaseClient({ url: supabaseUrl, key: supabaseKey })
    const analyzer = createAnalyzer({ apiKey: openaiApiKey })

    // Fetch PR details and diff
    const prDetails = await ghClient.fetchPRDetails(owner, repo, prNumber)
    const diff = await ghClient.fetchCommitDiff(owner, repo, sha)

    // Check minimum lines
    if (diff.stats.additions < minLines) {
      core.info(`PR has ${diff.stats.additions} additions, below minimum of ${minLines}. Skipping analysis.`)
      return
    }

    core.info(`Analyzing ${diff.stats.additions} additions across ${diff.files.length} files`)

    // Fetch project context for better analysis
    const projectContext = await ghClient.fetchProjectContext(owner, repo, sha)

    // Analyze with AI
    core.info('Running AI analysis...')
    const analysis = await analyzer.analyze(diff, projectContext)

    core.info(`Quality score: ${analysis.score}/10`)
    core.info(`Summary: ${analysis.summary}`)

    // Build commit record
    const commit: Commit = {
      sha,
      repo: `${owner}/${repo}`,
      author: prDetails.author,
      date: new Date(pr.merged_at).toISOString().split('T')[0]!,
      commitDate: pr.merged_at,
      message: diff.message,
      additions: diff.stats.additions,
      prNumber,
      prTitle: prDetails.title,
      prUrl: prDetails.url,
      prDescription: prDetails.body ?? undefined,
      quality: analysis,
      analyzedAt: new Date().toISOString(),
    }

    // Save to Supabase
    core.info('Saving to database...')
    await supabase.saveCommit(commit)
    await supabase.updateDailySummary(
      commit.date,
      commit.author,
      commit.additions,
      analysis.score,
      prDetails.authorAvatarUrl
    )
    await supabase.updateContributor(
      commit.author,
      commit.additions,
      analysis.score,
      prDetails.authorAvatarUrl
    )

    // Set outputs
    core.setOutput('quality-score', analysis.score.toString())
    core.setOutput('quality-summary', analysis.summary)

    core.info('Done!')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('Unknown error occurred')
    }
  }
}

run()
