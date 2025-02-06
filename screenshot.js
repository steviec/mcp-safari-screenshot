import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function waitForLoad(seconds = 3) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/*
  captureWindow:
  - Opens Safari to the specified URL.
  - If fullPage is true, uses JavaScript to get document.documentElement.scrollHeight,
    with a fallback if not available, and resizes the window accordingly.
  - Then, retrieves the Safari window's AXWindowID via System Events (with a retry loop).
  - Uses "screencapture -l <winID>" to capture that specific window.
*/
async function captureWindow(url, outputPath, options = {}) {
  const { 
    width = 1024, 
    height = 768,
    waitTime = 3,  // Default wait time in seconds
    zoomLevel = 1  // Default zoom level (1 = 100%)
  } = options;
  
  // First verify System Events permissions
  const permissionCheck = `
    tell application "System Events"
      set processList to name of every process
      return processList
    end tell
  `;
  
  try {
    await execAsync(`osascript -e '${permissionCheck}'`);
  } catch (error) {
    console.error('System Events permission error:', error.message);
    console.log('\nPlease ensure System Events has the required permissions:');
    console.log('1. Open System Preferences > Security & Privacy > Privacy > Accessibility');
    console.log('2. Add Terminal (or your IDE) to the list of allowed apps');
    throw new Error('Missing System Events permissions');
  }

  const script = `
    tell application "Safari"
      -- Close any existing windows and create a new one
      close every window
      make new document
      
      -- Load URL and set window size
      set URL of document 1 to "${url}"
      set bounds of window 1 to {100, 100, ${100 + width}, ${100 + height}}
      activate
      
      -- Wait initial page load
      delay ${waitTime}
      
      -- Set zoom level using JavaScript
      tell document 1
        do JavaScript "
          (function() {
            document.body.style.zoom = '${zoomLevel * 100}%';
            return document.body.style.zoom;
          })()
        "
      end tell
      
      -- Wait a bit for zoom to take effect
      delay 1
      
      -- Get window ID
      set win_id to id of window 1
      return win_id
    end tell
  `;
  
  try {
    // Write the script to a temporary file
    const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'temp.scpt');
    await fs.writeFile(scriptPath, script);
    
    // Execute the script
    const { stdout: winId, stderr } = await execAsync(`osascript ${scriptPath}`);
    if (stderr) console.log('AppleScript output:', stderr);
    
    // Clean up the script file
    await fs.unlink(scriptPath).catch(() => {});
    
    if (!winId.trim()) {
      throw new Error('Could not get Safari window ID');
    }
    
    // Wait a bit for the window to settle
    await waitForLoad(1);
    
    // Capture the specific Safari window using its ID
    const captureCmd = `screencapture -x -l ${winId.trim()} "${outputPath}"`;
    await execAsync(captureCmd);
    
    // Verify screenshot
    const stats = await fs.stat(outputPath);
    if (stats.size < 1000) {
      throw new Error('Screenshot appears to be empty or too small');
    }
    
  } catch (error) {
    throw new Error(`Failed to capture window: ${error.message}`);
  } finally {
    // Clean up
    await execAsync(`osascript -e 'tell application "Safari" to close every window'`).catch(() => {});
  }
}

/*
  captureElement:
  - Opens Safari to the specified URL with a fixed window size.
  - Uses JavaScript to compute the element's bounding rectangle.
  - Adds fixed offsets (assuming the window is positioned at 100,100 with an extra ~22px for the title bar)
    so that the coordinates become absolute.
  - Uses "screencapture -x -R <rect>" to capture that rectangular region.
*/
async function captureElement(url, selector, outputPath) {
  const script = `
    tell application "Safari"
      -- Close any existing windows
      close every window
      
      -- Create new window and load page
      make new document
      set URL of document 1 to "${url}"
      set bounds of window 1 to {100, 100, 1124, 868}
      delay 3
      
      -- First verify the element exists and is visible
      set elementCheck to do JavaScript "
        (function() {
          const el = document.querySelector('${selector}');
          if (!el) return 'Element not found';
          if (!el.offsetParent) return 'Element is not visible';
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return 'Element has no dimensions';
          return 'ok';
        })()
      "
      
      if elementCheck is not "ok" then
        error elementCheck
      end if
      
      -- Now get the element bounds
      set elementBoundsStr to do JavaScript "
        (function(){
          const el = document.querySelector('${selector}');
          const rect = el.getBoundingClientRect();
          
          // Calculate absolute coordinates
          const x = Math.round(rect.left) + 100;  // window offset
          const y = Math.round(rect.top) + 122;   // window + title bar offset
          const w = Math.round(rect.width);
          const h = Math.round(rect.height);
          
          console.log('Element coordinates:', {x, y, w, h}); // Debug info
          return x + ',' + y + ',' + w + ',' + h;
        })()
      "
      
      -- Log the coordinates for debugging
      log "Element bounds: " & elementBoundsStr
      
      -- Create and execute the capture command
      set captureCmd to "screencapture -x -R " & elementBoundsStr & " " & quoted form of "${outputPath}"
      log "Capture command: " & captureCmd
      do shell script captureCmd
      delay 1
    end tell
  `;
  
  const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'temp.scpt');
  await fs.writeFile(scriptPath, script);
  
  try {
    const { stdout, stderr } = await execAsync(`osascript ${scriptPath}`);
    if (stdout) console.log('Script output:', stdout);
    if (stderr) console.error('Script error:', stderr);
    
    // Verify the screenshot was created
    const stats = await fs.stat(outputPath);
    if (stats.size < 1000) {
      throw new Error('Screenshot appears to be empty or too small');
    }
    
  } finally {
    await fs.unlink(scriptPath).catch(() => {});
    await execAsync(`osascript -e 'tell application "Safari" to close every window'`).catch(() => {});
  }
}

export async function takeScreenshot({ url, outputPath, width, height, waitTime, zoomLevel }) {
  try {
    await captureWindow(url, outputPath, { width, height, waitTime, zoomLevel });
    return {
      success: true,
      path: outputPath
    };
  } catch (error) {
    throw new Error(`Screenshot failed: ${error.message}`);
  }
} 