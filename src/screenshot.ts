import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

export interface ScreenshotOptions {
	url: string;
	outputPath?: string;
	width?: number;
	height?: number;
	waitTime?: number;
	zoomLevel?: number;
	returnFormat?: 'binary' | 'dataURI' | 'file';
}

export interface ScreenshotResult {
	success: boolean;
	path?: string;
	binaryData?: Buffer;
	dataURI?: string;
}

export async function takeScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
	const { url, outputPath, width = 1024, height = 768, waitTime = 3, zoomLevel = 1, returnFormat = 'file' } = options;

	try {
		// Create screenshots directory if it doesn't exist
		const dir = path.dirname(outputPath || './screenshots/temp.png');
		await fs.mkdir(dir, { recursive: true });

		// Open URL in Safari
		await execAsync(`open -a Safari "${url}"`);

		// Wait for page load
		await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));

		// Take screenshot using screencapture
		const command = [
			'screencapture',
			'-x', // Disable interactive mode
			width && height ? `-R 0,0,${width},${height}` : '', // Set window size
			outputPath || './screenshots/temp.png',
		]
			.filter(Boolean)
			.join(' ');

		await execAsync(command);

		// Verify screenshot was created
		const screenshotPath = outputPath || './screenshots/temp.png';
		const stats = await fs.stat(screenshotPath);
		if (stats.size < 1000) {
			throw new Error('Screenshot appears to be empty or too small');
		}

		if (returnFormat === 'binary') {
			const binaryData = await fs.readFile(screenshotPath);
			return {
				success: true,
				binaryData,
			};
		} else if (returnFormat === 'dataURI') {
			const binaryData = await fs.readFile(screenshotPath);
			const dataURI = `data:image/png;base64,${binaryData.toString('base64')}`;
			return {
				success: true,
				dataURI,
			};
		}

		return {
			success: true,
			path: screenshotPath,
		};
	} catch (error) {
		throw error instanceof Error ? error : new Error(String(error));
	} finally {
		// Clean up Safari windows
		await execAsync('osascript -e \'tell application "Safari" to close every window\'').catch(() => {});
	}
}
