import { spawn } from 'node:child_process'

const processes = [
  spawn(process.execPath, ['--env-file-if-exists=.env', 'api/server.mjs'], { stdio: 'inherit', env: process.env }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit', env: process.env }),
]

let shuttingDown = false
function stop(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of processes) {
    if (child.exitCode === null) child.kill()
  }
  process.exitCode = exitCode
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error('Could not start the development server:', error)
    stop(1)
  })
  child.on('exit', (code) => {
    if (!shuttingDown) stop(code ?? 1)
  })
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
