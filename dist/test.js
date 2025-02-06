import { takeScreenshot } from './screenshot.js';
import chalk from 'chalk';
import fs from 'fs/promises';
const TEST_CASES = [
    {
        name: 'desktop',
        description: 'Desktop viewport (1920×1080)',
        url: 'https://example.com',
        options: {
            width: 1920,
            height: 1080,
            outputPath: './test-screenshots/desktop.png',
        },
    },
    // ... add more test cases
];
async function runTests() {
    console.log(chalk.blue('🧪 Starting screenshot tests...\n'));
    try {
        await fs.mkdir('./test-screenshots', { recursive: true });
    }
    catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
    let passed = 0;
    let failed = 0;
    for (const test of TEST_CASES) {
        try {
            console.log(chalk.yellow(`Testing ${test.description}...`));
            await takeScreenshot({
                url: test.url,
                ...test.options,
            });
            console.log(chalk.green(`✅ ${test.name} passed`));
            passed++;
        }
        catch (error) {
            console.log(chalk.red(`❌ ${test.name} failed: ${error instanceof Error ? error.message : String(error)}`));
            failed++;
        }
    }
    console.log(chalk.blue('\n📊 Test Summary:'));
    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    if (failed > 0) {
        process.exit(1);
    }
}
runTests().catch((error) => {
    console.error(chalk.red('\n💥 Test execution failed:', error));
    process.exit(1);
});
