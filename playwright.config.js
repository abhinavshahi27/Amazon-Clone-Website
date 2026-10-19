const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: 'tests',
    timeout: 30_000,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'list' : 'list',
    use: {
        baseURL: 'http://127.0.0.1:8123',
        browserName: 'chromium'
    },
    webServer: {
        command: 'python3 -m http.server 8123 --bind 127.0.0.1',
        port: 8123,
        reuseExistingServer: !process.env.CI,
        timeout: 15_000
    }
});
