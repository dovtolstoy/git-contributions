import { useState, useMemo } from 'react'
import { useContributions, Commit } from './hooks/useContributions'
import { TeamSummaryBar } from './components/TeamSummaryBar'
import { TotalLinesChart } from './components/TotalLinesChart'
import { DailyLinesChart } from './components/DailyLinesChart'
import { ChartFilters } from './components/ChartFilters'
import { CommitsList } from './components/CommitsList'
import { CommitDetailModal } from './components/CommitDetailModal'

const App = () => {
  const {
    commits,
    contributors,
    loading,
    error,
    filters,
    updateFilters,
    aggregatedByAuthor,
    aggregatedByDay,
    todayStats,
  } = useContributions({ days: 30, groupBy: 'day' })

  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null)

  const repos = useMemo(
    () => [...new Set(commits.map((c) => c.repo))],
    [commits]
  )

  const authors = useMemo(
    () => [...new Set(contributors.map((c) => c.login))],
    [contributors]
  )

  const handleAuthorClick = (author: string) => {
    updateFilters({ author })
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Git Contributions
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Productivity = Lines × Quality
                </p>
              </div>
            </div>
            <a
              href="https://github.com/your-org/git-contributions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="View on GitHub"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
          </div>
        ) : (
          <div className="space-y-6">
            <ChartFilters
              filters={filters}
              onFilterChange={updateFilters}
              repos={repos}
              authors={authors}
            />

            <TeamSummaryBar
              totalLines={todayStats.totalLines}
              totalCommits={todayStats.totalCommits}
              avgQuality={todayStats.avgQuality}
              contributors={todayStats.contributors}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TotalLinesChart
                data={aggregatedByAuthor}
                onAuthorClick={handleAuthorClick}
              />
              <DailyLinesChart data={aggregatedByDay} />
            </div>

            <CommitsList commits={commits} onCommitClick={setSelectedCommit} />
          </div>
        )}
      </main>

      <CommitDetailModal
        commit={selectedCommit}
        onClose={() => setSelectedCommit(null)}
      />
    </div>
  )
}

export default App
