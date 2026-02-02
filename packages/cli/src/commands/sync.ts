import ora from 'ora'
import {
  createGitHubClient,
  createSupabaseClient,
  createAnalyzer,
  Commit,
} from '@git-contributions/core'

type Options = {
  days?: string
  supabaseUrl?: string
  supabaseKey?: string
  githubToken?: string
  openaiApiKey?: string
}

const parseRepo = (repo: string): { owner: string; name: string } => {
  const parts = repo.split('/')
  if (parts.length !== 2) {
    throw new Error('Invalid repo format. Use owner/repo')
  }
  return { owner: parts[0]!, name: parts[1]! }
}

export const sync = async (repo: string, options: Options): Promise<void> => {
  const spinner = ora('Starting sync...').start()

  try {
    // Get credentials
    const supabaseUrl = options.supabaseUrl ?? process.env.SUPABASE_URL
    const supabaseKey = options.supabaseKey ?? process.env.SUPABASE_KEY
    const githubToken = options.githubToken ?? process.env.GITHUB_TOKEN
    const openaiApiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY
    const days = parseInt(options.days ?? '30', 10)

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

    const { owner, name } = parseRepo(repo)
    const repoFullName = `${owner}/${name}`

    // Initialize clients
    const github = createGitHubClient({ token: githubToken })
    const supabase = createSupabaseClient({ url: supabaseUrl, key: supabaseKey })
    const analyzer = createAnalyzer({ apiKey: openaiApiKey })

    // Fetch merged PRs
    spinner.text = `Fetching merged PRs from last ${days} days...`
    const prs = await github.fetchMergedPRs(owner, name, days)

    if (prs.length === 0) {
      spinner.warn('No merged PRs found')
      return
    }

    spinner.succeed(`Found ${prs.length} merged PRs`)

    // Process each PR
    let processed = 0
    let skipped = 0

    for (const pr of prs) {
      const prSpinner = ora(`Processing PR #${pr.number}...`).start()

      try {
        // Skip if already analyzed
        const { data: existing } = await supabase.client
          .from('commits')
          .select('id')
          .eq('sha', pr.sha)
          .eq('repo', repoFullName)
          .single()

        if (existing) {
          prSpinner.info(`PR #${pr.number} already analyzed, skipping`)
          skipped++
          continue
        }

        // Fetch diff
        const diff = await github.fetchCommitDiff(owner, name, pr.sha)

        // Skip small changes
        if (diff.stats.additions < 10) {
          prSpinner.info(`PR #${pr.number} too small (${diff.stats.additions} additions), skipping`)
          skipped++
          continue
        }

        // Fetch project context
        const context = await github.fetchProjectContext(owner, name, pr.sha)

        // Analyze
        prSpinner.text = `Analyzing PR #${pr.number}...`
        const analysis = await analyzer.analyze(diff, context)

        // Build commit record
        const commit: Commit = {
          sha: pr.sha,
          repo: repoFullName,
          author: pr.author,
          date: pr.mergedAt?.split('T')[0] ?? new Date().toISOString().split('T')[0]!,
          commitDate: pr.mergedAt ?? new Date().toISOString(),
          message: diff.message,
          additions: diff.stats.additions,
          prNumber: pr.number,
          prTitle: pr.title,
          prUrl: pr.url,
          prDescription: pr.body ?? undefined,
          quality: analysis,
          analyzedAt: new Date().toISOString(),
        }

        // Save
        await supabase.saveCommit(commit)
        await supabase.updateDailySummary(
          commit.date,
          commit.author,
          commit.additions,
          analysis.score,
          pr.authorAvatarUrl
        )
        await supabase.updateContributor(
          commit.author,
          commit.additions,
          analysis.score,
          pr.authorAvatarUrl
        )

        prSpinner.succeed(
          `PR #${pr.number}: Score ${analysis.score}/10 (${diff.stats.additions} lines)`
        )
        processed++
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        prSpinner.fail(`PR #${pr.number} failed: ${message}`)
      }
    }

    console.log('\n--- Sync Complete ---')
    console.log(`Processed: ${processed}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Total: ${prs.length}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    spinner.fail(`Sync failed: ${message}`)
    process.exit(1)
  }
}
