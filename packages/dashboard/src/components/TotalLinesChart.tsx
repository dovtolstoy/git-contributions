import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type Props = {
  data: Array<{
    name: string
    lines: number
    commits: number
    quality: number
    avatarUrl?: string
  }>
  onAuthorClick?: (author: string) => void
}

const getQualityColor = (quality: number): string => {
  if (quality >= 7) return '#22c55e' // green
  if (quality >= 5) return '#eab308' // yellow
  if (quality >= 3) return '#f97316' // orange
  return '#ef4444' // red
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export const TotalLinesChart = ({ data, onAuthorClick }: Props) => {
  const sortedData = [...data].sort((a, b) => b.lines - a.lines).slice(0, 10)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Contributors by Lines
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={formatNumber} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={75}
            />
            <Tooltip
              formatter={(value: number) => [formatNumber(value), 'Lines']}
              labelFormatter={(label: string) => `@${label}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar
              dataKey="lines"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(data) => onAuthorClick?.(data.name)}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getQualityColor(entry.quality)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Quality 7+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Quality 5-6</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>Quality 3-4</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Quality 1-2</span>
        </div>
      </div>
    </div>
  )
}
