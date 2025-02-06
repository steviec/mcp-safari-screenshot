#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { takeScreenshot } from './index.js';
import chalk from 'chalk';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <url> [options]')
  .command('* <url>', 'Take a screenshot of the specified URL', (yargs) => {
    return yargs.positional('url', {
      describe: 'URL to screenshot',
      type: 'string'
    });
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output path for the screenshot',
    default: './screenshot.png'
  })
  .option('fullPage', {
    alias: 'f',
    type: 'boolean',
    description: 'Capture full page screenshot',
    default: false
  })
  .option('selector', {
    alias: 's',
    type: 'string',
    description: 'CSS selector for specific element screenshot'
  })
  .help()
  .argv;

async function run() {
  try {
    console.log(chalk.blue('📸 Taking screenshot...'));
    await takeScreenshot({
      url: argv.url,
      outputPath: argv.output,
      fullPage: argv.fullPage,
      selector: argv.selector
    });
    console.log(chalk.green('✅ Screenshot saved to: ' + argv.output));
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

run(); 