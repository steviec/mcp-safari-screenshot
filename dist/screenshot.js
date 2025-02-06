import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
const execAsync = promisify(exec);
export async function takeScreenshot(options) {
    const { url, outputPath, width = 1024, height = 768, waitTime = 3, zoomLevel = 1 } = options;
    try {
        // Create screenshots directory if it doesn't exist
        const dir = path.dirname(outputPath);
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
            outputPath,
        ]
            .filter(Boolean)
            .join(' ');
        await execAsync(command);
        // Verify screenshot was created
        const stats = await fs.stat(outputPath);
        if (stats.size < 1000) {
            throw new Error('Screenshot appears to be empty or too small');
        }
        return {
            success: true,
            path: outputPath,
        };
    }
    catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
    }
    finally {
        // Clean up Safari windows
        await execAsync('osascript -e \'tell application "Safari" to close every window\'').catch(() => { });
    }
}
