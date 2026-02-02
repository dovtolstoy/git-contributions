import * as esbuild from 'esbuild'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../..')

await esbuild.build({
  entryPoints: ['./dist/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: path.join(rootDir, 'dist/index.js'),
  allowOverwrite: true,
  external: [],
  minify: false,
  sourcemap: false,
})

console.log('Action bundled successfully!')
