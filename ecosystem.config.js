module.exports = {
  apps: [
    {
      name: "fixity-backend",
      script: "./dist/server.js",
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
