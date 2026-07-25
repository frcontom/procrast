import { Doughnut } from 'react-chartjs-2'

const ACTIVITY_COLORS: Record<string, string> = {
  focus: '#A66CFF',
  deep_work: '#FF6B6B',
  reading: '#4CAF50',
  coding: '#156390',
  writing: '#FF9800',
}

const ACTIVITY_LABELS: Record<string, string> = {
  focus: 'Focus',
  deep_work: 'Deep Work',
  reading: 'Lectura',
  coding: 'Código',
  writing: 'Escritura',
}

interface Props {
  sessions: any[]
}

export function ActivityBreakdown({ sessions }: Props) {
  const activityData: Record<string, number> = {}
  sessions.forEach((s: any) => {
    const type = s.activity_type || 'focus'
    activityData[type] = (activityData[type] || 0) + (s.elapsed_seconds || 0) / 60
  })

  const types = Object.keys(activityData)
  const data = types.map((t) => Math.round(activityData[t]))
  const colors = types.map((t) => ACTIVITY_COLORS[t] || '#A66CFF')
  const labels = types.map((t) => ACTIVITY_LABELS[t] || t)

  if (types.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <Doughnut
            data={{
              labels,
              datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
            }}
            options={{ cutout: '65%', plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="space-y-2">
          {types.map((t, i) => (
            <div key={t} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
              <span className="text-text-secondary">{labels[i]}</span>
              <span className="font-medium">{Math.round(data[i])}min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
