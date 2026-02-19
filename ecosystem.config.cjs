/**
 * PM2 Ecosystem Configuration
 *
 * Commands:
 *   pm2 start ecosystem.config.cjs       # Start all processes
 *   pm2 restart ecosystem.config.cjs     # Restart all processes
 *   pm2 stop ecosystem.config.cjs        # Stop all processes
 *   pm2 logs                             # View all logs
 *   pm2 logs bot                         # View bot logs only
 *   pm2 monit                            # Monitor processes
 */

module.exports = {
  apps: [
    {
      name: 'bot',
      script: 'dist/index.js',
      cwd: '/home/ec2-user/bot_man',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
      // Restart delays to prevent rapid restart loops
      exp_backoff_restart_delay: 1000,
      max_restarts: 10,
      restart_delay: 5000,
      // Logging
      error_file: '/home/ec2-user/logs/bot-error.log',
      out_file: '/home/ec2-user/logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'worker',
      script: 'dist/worker.js',
      cwd: '/home/ec2-user/bot_man',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '128M',
      env: {
        NODE_ENV: 'production',
      },
      exp_backoff_restart_delay: 1000,
      max_restarts: 10,
      restart_delay: 5000,
      error_file: '/home/ec2-user/logs/worker-error.log',
      out_file: '/home/ec2-user/logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
