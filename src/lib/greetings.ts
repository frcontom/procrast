const GREETINGS = [
  'Enfocado. Imparable.',
  'Un día a la vez.',
  'La consistencia vence al talento.',
  'Construye tu legado.',
  'El hábito es tu mayor aliado.',
  'Sin excusas. Solo resultados.',
  'Haz que cuente.',
  'Tú decides quién ser hoy.',
  'Pequeñas victorias. Gran impacto.',
  'El momento es ahora.',
]

export function getRandomGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
}

export function speakGreeting(text: string): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }
}
