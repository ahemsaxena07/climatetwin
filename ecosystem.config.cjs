module.exports = {
  apps: [
    {
      name: 'climatetwin-api',
      script: 'api/server.mjs',
      cwd: __dirname,
      node_args: '--env-file-if-exists=.env',
      env: {
        API_PORT: '3000',
        NODE_ENV: 'production',
      },
    },
    {
      name: 'climatetwin-frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --host 0.0.0.0 --port 80 --strictPort',
      cwd: __dirname,
      env: {
        API_PORT: '3000',
        NODE_ENV: 'production',
      },
    },
  ],
}
