export interface ScreenshotOptions {
	url: string;
	outputPath: string;
	width?: number;
	height?: number;
	waitTime?: number; // Wait time in seconds
}

export interface ScreenshotResult {
	success: boolean;
	path: string;
}

export function takeScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult>;
