module.exports = {
  apps: [{
    name: "finance-api",
    script: "./src/server.js",
    watch: true,
    ignore_watch: [
      "node_modules", 
      "logs", 
      ".git", 
      "*.log"
    ],
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"
    },
    log_date_format: "YYYY-MM-DD HH:mm:SS Z",
    error_file: "./logs/pm2-error.log",
    out_file: "./logs/pm2-out.log"
  }]
};
