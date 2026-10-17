const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const children = [];
let shuttingDown = false;

function start(label, args, cwd) {
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
  });

  children.push(child);
  child.on('error', (error) => {
    console.error(`[${label}] Could not start: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.log(`[${label}] stopped${signal ? ` (${signal})` : ''}`);
      stop(code ?? 1);
    }
  });
}

function stop(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
}

process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));

start('api', ['--use-system-ca', path.join(root, 'backend', 'server.js')], path.join(root, 'backend'));
start('web', [path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'), 'serve', '--port', '8100'], root);
