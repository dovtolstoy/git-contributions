import type { Commit } from '../hooks/useContributions'

type Props = {
  commits: Commit[]
  onCommitClick: (commit: Commit) => void
}

const getQualityBadge = (score: number): { bg: string; text: string } => {
  if (score >= 7) return { bg: 'bg-green-100 text-green-700', text: 'Excellent' }
  if (score >= 5) return { bg: 'bg-yellow-100 text-yellow-700', text: 'Good' }
  if (score >= 3) return { bg: 'bg-orange-100 text-orange-700', text: 'Fair' }
  return { bg: 'bg-red-100 text-red-700', text: 'Needs Work' }
}

export const CommitsList = ({ commits, onCommitClick }: Props) => {
  const topCommits = commits
    .filter((c) => c.qualityScore !== undefined)
    .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
    .slice(0, 10)

  if (topCommits.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Analyzed Commits
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No analyzed commits yet. Merge a PR to see quality scores.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Quality Commits
      </h2>
      <div className="space-y-3">
        {topCommits.map((commit) => {
          const badge = commit.qualityScore
            ? getQualityBadge(commit.qualityScore)
            : null
          return (
            <button
              key={commit.id}
              onClick={() => onCommitClick(commit)}
              className="w-full text-left p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {commit.prTitle ?? commit.message}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>@{commit.author}</span>
                    <span>•</span>
                    <span>{commit.date}</span>
                    <span>•</span>
                    <span>+{commit.additions}</span>
                  </div>
                  {commit.qualitySummary && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {commit.qualitySummary}
                    </div>
                  )}
                </div>
                {badge && commit.qualityScore && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {commit.qualityScore}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg}`}
                    >
                      {badge.text}
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
