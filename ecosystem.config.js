module.exports = {
  apps: [
    {
      name: "schedowl-app",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 10000,
      exp_backoff_restart_delay: 100,
    },
    {
      name: "schedowl-worker",
      script: "pnpm",
      args: "worker",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 10000,
      exp_backoff_restart_delay: 100,
    },
  ],
  deploy: {
    production: {
      user: "node",
      host: "localhost",
      ref: "origin/main",
      repo: "https://github.com/adarsh-mamgain/schedowl",
      path: "/var/www/production",
      "post-deploy":
        "pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env production && pm2 save",
    },
  },
};
