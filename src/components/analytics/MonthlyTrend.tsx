import { Line } from 'react-chartjs-2'

interface Props {
  sessions: any[]
}

export function MonthlyTrend({ sessions }: Props) {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const months: Record<string, number> = {}

  sessions.forEach((s: any) => {
    const m = new Date(s.started_at).toISOString().slice(0, 7)
    months[m] = (months[m] || 0) + (s.elapsed_seconds || 0) / 60
  })

  const labels = Object.keys(months).sort()
  const data = labels.map((m) => Math.round(months[m]))

  return (
    <div>
      <Line
        data={{
          labels: labels.map((m) => {
            const [y, mo] = m.split('-')
            return `${monthNames[parseInt(mo) - 1]} ${y.slice(2)}`
          }),
          datasets: [{
            label: 'Minutos',
            data,
            borderColor: '#a66cff',
            backgroundColor: 'rgba(166, 108, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#a66cff',
            pointRadius: 3,
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
