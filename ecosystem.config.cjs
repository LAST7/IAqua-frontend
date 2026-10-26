module.exports = {
    apps: [
        {
            name: "iaqua-frontend",
            script: "build/index.js",
            interpreter: "node",
            env: {
                NODE_ENV: "production",
                HOST: "127.0.0.1",
                PORT: "3010"
            }
        }
    ]
};
