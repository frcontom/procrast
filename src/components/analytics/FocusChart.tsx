import { Bar } from 'react-chartjs-2'

interface Props {
  sessions: any[]
}

export function FocusChart({ sessions }: Props) {
  const shortNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

  const dayData = shortNames.map((_, i) => {
    const day = (i + 1) % 7
    const daySessions = sessions.filter((s: any) => new Date(s.started_at).getDay() === day)
    return Math.round(daySessions.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0) / 60, 0))
  })

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Minutos por día</h3>
      <Bar key="focus-chart"
        data={{
          labels: shortNames,
          datasets: [{
            label: 'Minutos',
            data: dayData,
            backgroundColor: dayData.map((v) => v > 0 ? '#a66cff' : '#1a1a2e'),
            borderRadius: 4,
            borderSkipped: false,
          }],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#a0a0b0', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0b0', font: { size: 10 } } },
          },
        }}
      />
    </div>
  )
}
