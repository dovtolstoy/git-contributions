#!/usr/bin/env node

import { Command } from 'commander'
import { config } from 'dotenv'
import { initDb } from './commands/init-db.js'
import { sync } from './commands/sync.js'
import { analyze } from './commands/analyze.js'

// Load environment variables
config()

const program = new Command()

program
  .name('git-contributions')
  .description('Track developer productivity with AI-powered quality scoring')
  .version('1.0.0')

program
  .command('init-db')
  .description('Initialize Supabase database schema')
  .option('--supabase-url <url>', 'Supabase project URL')
  .option('--supabase-key <key>', 'Supabase service role key')
  .action(initDb)

program
  .command('sync <repo>')
  .description('Backfill historical PRs from a repository')
  .option('--days <number>', 'Number of days to sync', '30')
  .option('--supabase-url <url>', 'Supabase project URL')
  .option('--supabase-key <key>', 'Supabase service role key')
  .option('--github-token <token>', 'GitHub personal access token')
  .option('--openai-api-key <key>', 'OpenAI API key')
  .action(sync)

program
  .command('analyze <pr>')
  .description('Analyze a specific PR (format: owner/repo#number)')
  .option('--supabase-url <url>', 'Supabase project URL')
  .option('--supabase-key <key>', 'Supabase service role key')
  .option('--github-token <token>', 'GitHub personal access token')
  .option('--openai-api-key <key>', 'OpenAI API key')
  .action(analyze)

program.parse()
