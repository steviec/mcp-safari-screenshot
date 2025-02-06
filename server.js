#!/usr/bin/env node

import { takeScreenshot } from './screenshot.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import net from 'net';

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
    version: '1.0.0',
    tools: [
        {
            name: 'screenshot',
            description: 'Take a screenshot of a webpage',
            execute: async (input) => {
                try {
                    const options = parseInput(input);
                    console.log(chalk.blue('📸 Taking screenshot...'));
                    console.log(chalk.gray(`URL: ${options.url}`));
                    console.log(chalk.gray(`Size: ${options.width}×${options.height}`));
                    console.log(chalk.gray(`Zoom: ${options.zoomLevel * 100}%`));
                    
                    const result = await takeScreenshot(options);
                    console.log(chalk.green('✅ Screenshot saved to:', result.path));
                    
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
        }
    ]
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

// Create TCP server for MCP
const tcpServer = net.createServer((socket) => {
    socket.on('data', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'discover') {
                // Respond with server capabilities
                socket.write(JSON.stringify({
                    type: 'capabilities',
                    server: server.name,
                    version: server.version,
                    description: server.description,
                    tools: server.tools.map(tool => ({
                        name: tool.name,
                        description: tool.description
                    }))
                }));
            } else if (message.type === 'execute') {
                // Execute tool and return result
                const tool = server.tools.find(t => t.name === message.tool);
                if (!tool) {
                    throw new Error(`Tool ${message.tool} not found`);
                }
                
                const result = await tool.execute(message.input);
                socket.write(JSON.stringify({
                    type: 'result',
                    requestId: message.requestId,
                    success: true,
                    result
                }));
            }
        } catch (error) {
            socket.write(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });
});

// Start server or CLI based on how we're run
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    if (process.argv.includes('--server')) {
        // Start MCP server mode
        const port = process.env.PORT || 3000;
        tcpServer.listen(port, () => {
            console.log(chalk.green(`🚀 Safari Screenshot MCP server running on port ${port}`));
        });
    } else {
        // Start CLI mode
        console.log(chalk.green('🚀 Safari Screenshot CLI ready'));
        console.log(chalk.gray('Enter a command like: "Take a screenshot of https://example.com"'));

        process.stdin.setEncoding('utf8');
        process.stdin.on('data', async (input) => {
            try {
                await server.tools[0].execute(input.trim());
            } catch (error) {
                // Error already logged
            }
        });
    }
}

export default server; 
