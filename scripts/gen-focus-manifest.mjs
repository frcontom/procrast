// Genera src/assets/focus/manifest.json con el nombre de cada imagen de fondo.
// Uso: npm run focus:manifest
import { readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'focus')
const files = readdirSync(dir).filter((f) => /\.png$/i.test(f)).sort()
writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ images: files }, null, 2) + '\n')
console.log(`manifest.json: ${files.length} imagenes`)