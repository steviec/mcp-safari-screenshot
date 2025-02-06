#!/usr/bin/env node

import { takeScreenshot } from './screenshot.js';
import chalk from 'chalk';

// Common viewport sizes
const VIEWPORT_SIZES = {
    'desktop': { width: 1920, height: 1080 },
    'laptop': { width: 1366, height: 768 },
    'tablet-landscape': { width: 1024, height: 768 },
    'tablet-portrait': { width: 768, height: 1024 },
    'mobile-large': { width: 428, height: 926 },
    'mobile-medium': { width: 390, height: 844 },
    'mobile-small': { width: 375, height: 667 }
};

// Parse natural language input for device and settings
function parseInput(input) {
    const url = input.match(/https?:\/\/[^\s]+/)?.[0];
    if (!url) throw new Error('No URL found in input');

    const options = {
        url,
        outputPath: `./screenshots/${new URL(url).hostname}-${Date.now()}.png`,
        width: 1024,
        height: 768,
        waitTime: 3,
        zoomLevel: 1
    };

    // Check for device names
    Object.entries(VIEWPORT_SIZES).forEach(([device, size]) => {
        if (input.toLowerCase().includes(device)) {
            options.width = size.width;
            options.height = size.height;
        }
    });

    // Check for zoom level
    const zoomMatch = input.match(/(\d+)%\s*zoom/);
    if (zoomMatch) {
        options.zoomLevel = parseInt(zoomMatch[1]) / 100;
    }

    // Check for wait time
    const waitMatch = input.match(/wait\s*(\d+)\s*seconds?/);
    if (waitMatch) {
        options.waitTime = parseInt(waitMatch[1]);
    }

    return options;
}

// Handle input
async function handleInput(input) {
    try {
        const options = parseInput(input);
        console.log(chalk.blue('📸 Taking screenshot...'));
        console.log(chalk.gray(`URL: ${options.url}`));
        console.log(chalk.gray(`Size: ${options.width}×${options.height}`));
        console.log(chalk.gray(`Zoom: ${options.zoomLevel * 100}%`));
        
        const result = await takeScreenshot(options);
        console.log(chalk.green('✅ Screenshot saved to:', result.path));
        
        return result;
    } catch (error) {
        console.error(chalk.red('❌ Error:', error.message));
        throw error;
    }
}

// Read from stdin
process.stdin.setEncoding('utf8');
process.stdin.on('data', async (input) => {
    try {
        await handleInput(input.trim());
    } catch (error) {
        // Error already logged
    }
});

console.log(chalk.green('🚀 Safari Screenshot server ready'));
console.log(chalk.gray('Enter a command like: "Take a screenshot of https://example.com"')); 
