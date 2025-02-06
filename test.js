import { takeScreenshot } from './screenshot.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// Define common device sizes
const VIEWPORT_SIZES = [
    {
        name: 'desktop',
        width: 1920,
        height: 1080,
        description: 'Full HD Desktop'
    },
    {
        name: 'laptop',
        width: 1366,
        height: 768,
        description: 'Common Laptop'
    },
    {
        name: 'tablet-landscape',
        width: 1024,
        height: 768,
        description: 'iPad Landscape'
    },
    {
        name: 'tablet-portrait',
        width: 768,
        height: 1024,
        description: 'iPad Portrait'
    },
    {
        name: 'mobile-large',
        width: 428,
        height: 926,
        description: 'iPhone 12 Pro Max'
    },
    {
        name: 'mobile-medium',
        width: 390,
        height: 844,
        description: 'iPhone 12 Pro'
    },
    {
        name: 'mobile-small',
        width: 375,
        height: 667,
        description: 'iPhone SE'
    }
];

// Define zoom levels to test
const ZOOM_LEVELS = [
    {
        name: 'normal',
        zoom: 1,
        description: '100% zoom'
    },
    {
        name: 'zoomed-out',
        zoom: 0.5,
        description: '50% zoom'
    },
    {
        name: 'zoomed-in',
        zoom: 1.5,
        description: '150% zoom'
    }
];

// Test URLs
const TEST_URLS = [
    {
        name: 'apple',
        url: 'https://www.apple.com',
        waitTime: 5
    },
    {
        name: 'github',
        url: 'https://github.com',
        waitTime: 3
    }
];

// Create test configurations with zoom levels
const TEST_CONFIGS = TEST_URLS.flatMap(site => 
    VIEWPORT_SIZES.flatMap(viewport =>
        ZOOM_LEVELS.map(zoom => ({
            name: `${site.name}-${viewport.name}-${zoom.name}`,
            url: site.url,
            options: {
                outputPath: `./test-screenshots/${site.name}-${viewport.name}-${zoom.name}.png`,
                width: viewport.width,
                height: viewport.height,
                waitTime: site.waitTime,
                zoomLevel: zoom.zoom
            },
            description: `${site.name} - ${viewport.description} - ${zoom.description}`
        }))
    )
);

// Ensure test directory exists
async function setupTestDirectory() {
    const dir = './test-screenshots';
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir);
    }
}

// Clean up old screenshots
async function cleanupTestDirectory() {
    const dir = './test-screenshots';
    try {
        const files = await fs.readdir(dir);
        await Promise.all(
            files.map(file => fs.unlink(path.join(dir, file)))
        );
    } catch (error) {
        console.log('No cleanup needed');
    }
}

// Verify screenshot was created
async function verifyScreenshot(path, testName) {
    try {
        const stats = await fs.stat(path);
        if (stats.size < 1000) {
            throw new Error('Screenshot file too small');
        }
    } catch (error) {
        throw new Error(`Screenshot verification failed for ${testName}: ${error.message}`);
    }
}

// Run all tests
async function runTests() {
    console.log(chalk.blue('\n📸 Starting screenshot tests...\n'));
    await setupTestDirectory();
    await cleanupTestDirectory();

    let passed = 0;
    let failed = 0;
    const results = [];

    for (const test of TEST_CONFIGS) {
        try {
            console.log(chalk.yellow(`Testing ${test.description}...`));
            const startTime = Date.now();
            
            await takeScreenshot({
                url: test.url,
                ...test.options
            });

            await verifyScreenshot(test.options.outputPath, test.name);
            
            const duration = Date.now() - startTime;
            console.log(chalk.green(`✅ ${test.description} passed (${duration}ms)`));
            console.log(chalk.gray(`   Screenshot saved to: ${test.options.outputPath}`));
            passed++;
            results.push({ name: test.name, status: 'passed', duration });
        } catch (error) {
            console.log(chalk.red(`❌ ${test.description} failed: ${error.message}`));
            failed++;
            results.push({ name: test.name, status: 'failed', error: error.message });
        }
    }

    // Print summary
    console.log(chalk.blue('\n📊 Test Summary:'));
    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.blue(`📸 Total: ${passed + failed}`));

    if (failed > 0) {
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error(chalk.red('\n💥 Test execution failed:', error));
    process.exit(1);
}); 