import ora from 'ora'
import {
  createGitHubClient,
  createSupabaseClient,
  createAnalyzer,
  Commit,
} from '@git-contributions/core'

type Options = {
  supabaseUrl?: string
  supabaseKey?: string
  githubToken?: string
  openaiApiKey?: string
}

const parsePR = (
  pr: string
): { owner: string; repo: string; number: number } => {
  // Format: owner/repo#123
  const match = pr.match(/^([^/]+)\/([^#]+)#(\d+)$/)
  if (!match) {
    throw new Error('Invalid PR format. Use owner/repo#number')
  }
  return {
    owner: match[1]!,
    repo: match[2]!,
    number: parseInt(match[3]!, 10),
  }
}

export const analyze = async (pr: string, options: Options): Promise<void> => {
  const spinner = ora('Starting analysis...').start()

  try {
    // Get credentials
    const supabaseUrl = options.supabaseUrl ?? process.env.SUPABASE_URL
    const supabaseKey = options.supabaseKey ?? process.env.SUPABASE_KEY
    const githubToken = options.githubToken ?? process.env.GITHUB_TOKEN
    const openaiApiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY

    if (!supabaseUrl || !supabaseKey) {
      spinner.fail('Missing Supabase credentials')
      process.exit(1)
    }

    if (!githubToken) {
      spinner.fail('Missing GitHub token')
      process.exit(1)
    }

    if (!openaiApiKey) {
      spinner.fail('Missing OpenAI API key')
      process.exit(1)
    }

    const { owner, repo, number: prNumber } = parsePR(pr)
    const repoFullName = `${owner}/${repo}`

    // Initialize clients
    const github = createGitHubClient({ token: githubToken })
    const supabase = createSupabaseClient({ url: supabaseUrl, key: supabaseKey })
    const analyzer = createAnalyzer({ apiKey: openaiApiKey })

    // Fetch PR details
    spinner.text = 'Fetching PR details...'
    const prDetails = await github.fetchPRDetails(owner, repo, prNumber)

    if (!prDetails.mergedAt) {
      spinner.warn('PR is not merged yet')
      return
    }

    // Fetch diff
    spinner.text = 'Fetching commit diff...'
    const diff = await github.fetchCommitDiff(owner, repo, prDetails.sha)

    console.log('\n--- PR Details ---')
    console.log(`Title: ${prDetails.title}`)
    console.log(`Author: @${prDetails.author}`)
    console.log(`Merged: ${prDetails.mergedAt}`)
    console.log(`Additions: +${diff.stats.additions}`)
    console.log(`Deletions: -${diff.stats.deletions}`)
    console.log(`Files: ${diff.files.length}`)
    console.log('')

    // Fetch project context
    spinner.text = 'Fetching project context...'
    const context = await github.fetchProjectContext(owner, repo, prDetails.sha)

    // Analyze
    spinner.text = 'Analyzing with AI...'
    const analysis = await analyzer.analyze(diff, context)

    spinner.succeed('Analysis complete')

    console.log('\n--- Quality Analysis ---')
    console.log(`Score: ${analysis.score}/10`)
    console.log(`Summary: ${analysis.summary}`)
    console.log('\nDetailed Analysis:')
    console.log(analysis.analysis)

    // Save to database
    spinner.start('Saving to database...')

    const commit: Commit = {
      sha: prDetails.sha,
      repo: repoFullName,
      author: prDetails.author,
      date: prDetails.mergedAt.split('T')[0]!,
      commitDate: prDetails.mergedAt,
      message: diff.message,
      additions: diff.stats.additions,
      prNumber,
      prTitle: prDetails.title,
      prUrl: prDetails.url,
      prDescription: prDetails.body ?? undefined,
      quality: analysis,
      analyzedAt: new Date().toISOString(),
    }

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

    spinner.succeed('Saved to database')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    spinner.fail(`Analysis failed: ${message}`)
    process.exit(1)
  }
}
