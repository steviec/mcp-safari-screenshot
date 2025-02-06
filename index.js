import puppeteer from 'puppeteer';

export async function takeScreenshot({ url, outputPath, fullPage = false, selector = null }) {
  let browser;
  try {
    // Launch browser with Safari user agent
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set Safari user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15');

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Take screenshot based on options
    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element with selector "${selector}" not found`);
      }
      await element.screenshot({
        path: outputPath,
      });
    } else {
      await page.screenshot({
        path: outputPath,
        fullPage: fullPage,
      });
    }
  } catch (error) {
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} 