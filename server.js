import { createServer } from '@mcp/protocol';
import { takeScreenshot } from './screenshot.js';
import chalk from 'chalk';

const server = createServer({
  name: 'safari-screenshot',
  version: '1.0.0',
  description: 'MCP server for taking screenshots using Safari via Puppeteer',
  
  // Define the capabilities of this server
  capabilities: {
    tools: [{
      name: 'take_screenshot',
      description: 'Take a screenshot of a webpage using Safari',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to take screenshot of'
          },
          outputPath: {
            type: 'string',
            description: 'Path to save the screenshot',
            default: './screenshot.png'
          },
          fullPage: {
            type: 'boolean',
            description: 'Whether to take a full page screenshot',
            default: false
          },
          selector: {
            type: 'string',
            description: 'CSS selector for specific element screenshot',
            optional: true
          }
        },
        required: ['url']
      }
    }]
  }
});

// Register the screenshot tool
server.registerTool('take_screenshot', async (params, context) => {
  try {
    console.log(chalk.blue('📸 Taking screenshot...'));
    const result = await takeScreenshot({
      url: params.url,
      outputPath: params.outputPath || './screenshot.png',
      fullPage: params.fullPage || false,
      selector: params.selector
    });
    
    console.log(chalk.green('✅ Screenshot saved to: ' + params.outputPath));
    
    return {
      success: true,
      outputPath: params.outputPath,
      message: `Screenshot saved to ${params.outputPath}`
    };
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    throw error;
  }
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(chalk.green(`🚀 MCP Safari Screenshot server running on port ${port}`));
}); 