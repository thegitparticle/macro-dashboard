import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const distDir = join(root, 'dist')

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}

mkdirSync(distDir, { recursive: true })
cpSync(join(root, 'index.html'), join(distDir, 'index.html'))
cpSync(join(root, 'app'), join(distDir, 'app'), { recursive: true })

console.log('Built dist/ with static assets (index.html + app/)')
