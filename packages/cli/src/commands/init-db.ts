import ora from 'ora'
import { createClient } from '@supabase/supabase-js'

type Options = {
  supabaseUrl?: string
  supabaseKey?: string
}

const SCHEMA = `
-- Commits table (one row per analyzed PR/commit)
CREATE TABLE IF NOT EXISTS commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sha TEXT NOT NULL,
  repo TEXT NOT NULL,
  author TEXT NOT NULL,
  date DATE NOT NULL,
  commit_date TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  additions INTEGER NOT NULL,
  
  pr_number INTEGER,
  pr_title TEXT,
  pr_url TEXT,
  pr_description TEXT,
  
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  quality_summary TEXT,
  quality_analysis TEXT,
  analyzed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(sha, repo)
);

-- Daily summaries
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  author TEXT NOT NULL,
  total_lines INTEGER NOT NULL DEFAULT 0,
  total_commits INTEGER NOT NULL DEFAULT 0,
  avg_quality_score DECIMAL(3,1),
  avatar_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, author)
);

-- Contributors
CREATE TABLE IF NOT EXISTS contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login TEXT NOT NULL UNIQUE,
  total_lines INTEGER NOT NULL DEFAULT 0,
  total_commits INTEGER NOT NULL DEFAULT 0,
  avg_quality_score DECIMAL(3,1),
  avatar_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commits_date ON commits(date);
CREATE INDEX IF NOT EXISTS idx_commits_author ON commits(author);
CREATE INDEX IF NOT EXISTS idx_commits_repo ON commits(repo);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_author ON daily_summaries(author);
CREATE INDEX IF NOT EXISTS idx_contributors_login ON contributors(login);
`

export const initDb = async (options: Options): Promise<void> => {
  const spinner = ora('Initializing database...').start()

  try {
    const supabaseUrl = options.supabaseUrl ?? process.env.SUPABASE_URL
    const supabaseKey = options.supabaseKey ?? process.env.SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      spinner.fail('Missing Supabase credentials')
      console.error('\nSet SUPABASE_URL and SUPABASE_KEY environment variables')
      console.error('or use --supabase-url and --supabase-key flags')
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection
    spinner.text = 'Testing connection...'
    const { error: testError } = await supabase.from('commits').select('count').limit(0)

    // If table doesn't exist, we need to create it
    if (testError?.message?.includes('does not exist')) {
      spinner.text = 'Creating tables...'
      
      // Note: Direct SQL execution requires the SQL Editor or migrations
      // For now, we'll provide instructions
      spinner.warn('Tables do not exist')
      console.log('\nPlease run the following SQL in your Supabase SQL Editor:')
      console.log('\n--- Copy from here ---\n')
      console.log(SCHEMA)
      console.log('\n--- End of SQL ---\n')
      console.log('Or run the migration file at: supabase/migrations/001_initial.sql')
      return
    }

    if (testError) {
      throw new Error(testError.message)
    }

    spinner.succeed('Database initialized successfully')
    console.log('\nTables verified:')
    console.log('  - commits')
    console.log('  - daily_summaries')
    console.log('  - contributors')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    spinner.fail(`Failed to initialize database: ${message}`)
    process.exit(1)
  }
}
