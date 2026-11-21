// Run a Blender script headless: node scripts/blender.mjs <script.py> [-- args...]
// Blender path: $BLENDER, else the default Windows install. Exit code is Blender's (scripts exit 1 on any exception).
import { spawn } from 'node:child_process';

const [script, ...rest] = process.argv.slice(2);
if (!script) { console.error('usage: node scripts/blender.mjs <script.py> [-- args]'); process.exit(2); }
const args = rest[0] === '--' ? rest.slice(1) : rest;
const blender = process.env.BLENDER ?? 'C:\\Program Files\\Blender Foundation\\Blender 5.3\\blender.exe';

const child = spawn(blender, ['--background', '--factory-startup', '--python-exit-code', '1', '--python', script, '--', ...args], { stdio: 'inherit' });
child.on('error', (e) => { console.error(`could not start Blender at ${blender}: ${e.message}`); process.exit(2); });
child.on('exit', (code) => process.exit(code ?? 1));
