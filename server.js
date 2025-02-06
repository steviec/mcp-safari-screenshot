#!/usr/bin/env node

import { takeScreenshot } from './screenshot.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

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

// MCP Server definition
const server = {
    name: 'safari-screenshot',
    description: 'Take screenshots using Safari on macOS',
    version: '1.0.2',
    capabilities: {
        tools: [
            {
                name: 'take_screenshot',
                description: 'Take a screenshot of a webpage',
                parameters: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'URL to capture'
                        },
                        device: {
                            type: 'string',
                            description: 'Device preset (desktop, laptop, mobile, etc)',
                            optional: true
                        },
                        zoom: {
                            type: 'number',
                            description: 'Zoom level (1 = 100%)',
                            optional: true
                        },
                        wait: {
                            type: 'number',
                            description: 'Seconds to wait for page load',
                            optional: true
                        }
                    },
                    required: ['url']
                }
            }
        ]
    }
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

// Handle tool execution
async function executeCommand(command) {
    try {
        const options = parseInput(command);
        console.error(chalk.blue('📸 Taking screenshot...'));
        console.error(chalk.gray(`URL: ${options.url}`));
        console.error(chalk.gray(`Size: ${options.width}×${options.height}`));
        console.error(chalk.gray(`Zoom: ${options.zoomLevel * 100}%`));
        
        const result = await takeScreenshot(options);
        console.error(chalk.green('✅ Screenshot saved to:', result.path));
        
        return {
            success: true,
            path: result.path,
            message: `Screenshot saved to ${result.path}`
        };
    } catch (error) {
        console.error(chalk.red('❌ Error:', error.message));
        throw error;
    }
}

// Handle MCP messages via stdin/stdout
async function handleMCPMessage(message) {
    try {
        if (message.type === 'discover') {
            // Respond with capabilities
            console.log(JSON.stringify({
                type: 'capabilities',
                ...server
            }));
        } else if (message.type === 'execute') {
            if (message.tool === 'take_screenshot') {
                const result = await executeCommand(message.input);
                console.log(JSON.stringify({
                    type: 'result',
                    requestId: message.requestId,
                    success: true,
                    result
                }));
            } else {
                throw new Error(`Unknown tool: ${message.tool}`);
            }
        }
    } catch (error) {
        console.log(JSON.stringify({
            type: 'error',
            requestId: message?.requestId,
            message: error.message
        }));
    }
}

// Read from stdin
process.stdin.setEncoding('utf8');
let inputBuffer = '';

process.stdin.on('data', (chunk) => {
    inputBuffer += chunk;
    
    // Process complete JSON messages
    const messages = inputBuffer.split('\n');
    inputBuffer = messages.pop(); // Keep the last incomplete chunk
    
    for (const message of messages) {
        if (message.trim()) {
            try {
                const parsed = JSON.parse(message);
                handleMCPMessage(parsed);
            } catch (error) {
                console.error(chalk.red('Failed to parse message:', error.message));
            }
        }
    }
});

// Log startup to stderr (not stdout, which is for MCP messages)
console.error(chalk.green('🚀 Safari Screenshot MCP ready'));

export default server; 
