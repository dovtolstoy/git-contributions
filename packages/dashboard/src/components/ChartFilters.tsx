import type { Filters } from '../hooks/useContributions'

type Props = {
  filters: Filters
  onFilterChange: (filters: Partial<Filters>) => void
  repos?: string[]
  authors?: string[]
}

export const ChartFilters = ({ filters, onFilterChange, repos = [], authors = [] }: Props) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="days"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Time Range
          </label>
          <select
            id="days"
            value={filters.days}
            onChange={(e) => onFilterChange({ days: parseInt(e.target.value, 10) })}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {repos.length > 0 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="repo"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Repository
            </label>
            <select
              id="repo"
              value={filters.repo ?? ''}
              onChange={(e) =>
                onFilterChange({ repo: e.target.value || undefined })
              }
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Repos</option>
              {repos.map((repo) => (
                <option key={repo} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
          </div>
        )}

        {authors.length > 0 && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="author"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Author
            </label>
            <select
              id="author"
              value={filters.author ?? ''}
              onChange={(e) =>
                onFilterChange({ author: e.target.value || undefined })
              }
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Authors</option>
              {authors.map((author) => (
                <option key={author} value={author}>
                  @{author}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label
            htmlFor="groupBy"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Group By
          </label>
          <select
            id="groupBy"
            value={filters.groupBy}
            onChange={(e) =>
              onFilterChange({ groupBy: e.target.value as Filters['groupBy'] })
            }
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>
    </div>
  )
}
