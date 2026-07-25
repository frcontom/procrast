import { useEffect, useState } from 'react'
import { getRandomGreeting, speakGreeting } from '../../lib/greetings'
import { useSettingsStore } from '../../store/useSettingsStore'

export function Greeting() {
  const [greeting, setGreeting] = useState('')
  const name = useSettingsStore((s) => s.name)

  useEffect(() => {
    const g = getRandomGreeting()
    setGreeting(g)
    speakGreeting(g)
  }, [])

  if (!greeting) return null

  return (
    <div className="text-center py-6">
      <h1 className="text-2xl font-light mb-1">
        Hola, <span className="text-accent font-medium">{name}</span>
      </h1>
      <p className="text-text-secondary text-sm italic">"{greeting}"</p>
    </div>
  )
}
