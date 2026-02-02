import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['./dist/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: './dist/index.js',
  allowOverwrite: true,
  external: [],
  minify: false,
  sourcemap: false,
})

console.log('Action bundled successfully!')
