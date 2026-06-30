module.exports = {
    apps: [
        {
            name: "fixity-backend",
            script: "./dist/src/server.js",
            env_production: {
                NODE_ENV: "production",
            },
        },
    ],
};

