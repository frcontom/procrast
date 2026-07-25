import { Bar } from 'react-chartjs-2'

interface Props {
  sessions: any[]
}

export function FocusChart({ sessions }: Props) {
  const shortNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

  const dayData = shortNames.map((_, i) => {
    const day = (i + 1) % 7
    const filtered = sessions.filter((s: any) => new Date(s.started_at).getDay() === day && s.state === 'completed')
    const total = filtered.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0), 0)
    return Math.round(total / 60)
  })

  const today = new Date().getDay()
  const maxVal = Math.max(...dayData, 1)

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Últimos 7 días</h3>
      <div className="h-40">
        <Bar
          data={{
            labels: shortNames,
            datasets: [{
              data: dayData,
              backgroundColor: dayData.map((_, i) => ((i + 1) % 7) === today ? '#a66cff' : dayData[i] > 0 ? 'rgba(166,108,255,0.5)' : 'rgba(26,26,46,0.5)'),
              borderRadius: 4,
              borderSkipped: false,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#a0a0b0', font: { size: 10 } } },
              y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: Math.ceil(maxVal * 1.2), ticks: { color: '#a0a0b0', font: { size: 10 }, stepSize: Math.max(1, Math.ceil(maxVal / 4)) } },
            },
          }}
        />
      </div>
    </div>
  )
}
