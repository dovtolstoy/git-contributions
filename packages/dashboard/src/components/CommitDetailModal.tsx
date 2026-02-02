import { useEffect } from 'react'
import type { Commit } from '../hooks/useContributions'

type Props = {
  commit: Commit | null
  onClose: () => void
}

const getQualityColor = (score: number): string => {
  if (score >= 7) return 'bg-green-500'
  if (score >= 5) return 'bg-yellow-500'
  if (score >= 3) return 'bg-orange-500'
  return 'bg-red-500'
}

export const CommitDetailModal = ({ commit, onClose }: Props) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!commit) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2
                id="modal-title"
                className="text-xl font-semibold text-gray-900 dark:text-white truncate"
              >
                {commit.prTitle ?? commit.message}
              </h2>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span>@{commit.author}</span>
                <span>{commit.date}</span>
                <span>+{commit.additions} lines</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {commit.qualityScore !== undefined && (
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${getQualityColor(commit.qualityScore)}`}
                  >
                    {commit.qualityScore}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quality Score
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      out of 10
                    </div>
                  </div>
                </div>
              </div>

              {commit.qualitySummary && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Summary
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {commit.qualitySummary}
                  </p>
                </div>
              )}

              {commit.qualityAnalysis && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Detailed Analysis
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                      {commit.qualityAnalysis}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {commit.prUrl && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <a
                href={commit.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
