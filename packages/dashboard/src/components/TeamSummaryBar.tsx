type Props = {
  totalLines: number
  totalCommits: number
  avgQuality: number | null
  contributors: number
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const getQualityLabel = (quality: number): string => {
  if (quality >= 7) return 'Excellent'
  if (quality >= 5) return 'Good'
  if (quality >= 3) return 'Fair'
  return 'Needs Work'
}

const getQualityColor = (quality: number): string => {
  if (quality >= 7) return 'text-green-600 bg-green-100'
  if (quality >= 5) return 'text-yellow-600 bg-yellow-100'
  if (quality >= 3) return 'text-orange-600 bg-orange-100'
  return 'text-red-600 bg-red-100'
}

export const TeamSummaryBar = ({
  totalLines,
  totalCommits,
  avgQuality,
  contributors,
}: Props) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Today's Summary
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {formatNumber(totalLines)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Lines Added
          </div>
        </div>

        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalCommits}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Commits
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
            {contributors}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Contributors
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {avgQuality !== null ? (
            <>
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                {avgQuality.toFixed(1)}
              </div>
              <div
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getQualityColor(avgQuality)}`}
              >
                {getQualityLabel(avgQuality)}
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-400">-</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Avg Quality
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
