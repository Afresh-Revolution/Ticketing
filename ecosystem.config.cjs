module.exports = {
  apps: [{
    name: 'wav',
    script: './server/index.mjs',
    node_args: '--env-file-if-exists=.env',
    env: { NODE_ENV: 'production', PORT: '5107' },
  }],
};
