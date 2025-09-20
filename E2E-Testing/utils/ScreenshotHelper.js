import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ScreenshotHelper {
  constructor(screenshotDir = './screenshots') {
    this.screenshotDir = screenshotDir;
    this.ensureScreenshotDir();
  }

  async ensureScreenshotDir() {
    await fs.ensureDir(this.screenshotDir);
  }

  /**
   * Take a full page screenshot
   */
  async takeFullPageScreenshot(driver, testName, stepName = '') {
    try {
      const timestamp = this.getTimestamp();
      const fileName = this.generateFileName(testName, stepName, timestamp, 'full');
      const filePath = path.join(this.screenshotDir, fileName);

      // Get the full page height
      const bodyHeight = await driver.executeScript('return document.body.scrollHeight');
      const windowHeight = await driver.executeScript('return window.innerHeight');

      if (bodyHeight > windowHeight) {
        // Set window size to capture full page
        await driver.manage().window().setRect({
          width: 1920,
          height: bodyHeight
        });
      }

      const screenshot = await driver.takeScreenshot();
      await fs.writeFile(filePath, screenshot, 'base64');

      console.log(`📸 Full page screenshot saved: ${fileName}`);
      return { filePath, fileName };
    } catch (error) {
      console.error('❌ Failed to take full page screenshot:', error.message);
      throw error;
    }
  }

  /**
   * Take a screenshot of a specific element
   */
  async takeElementScreenshot(driver, element, testName, elementName = '') {
    try {
      const timestamp = this.getTimestamp();
      const fileName = this.generateFileName(testName, elementName, timestamp, 'element');
      const filePath = path.join(this.screenshotDir, fileName);

      // Scroll element into view
      await driver.executeScript("arguments[0].scrollIntoView(true);", element);
      await driver.sleep(500); // Wait for scroll to complete

      // Take screenshot of the element
      const screenshot = await element.takeScreenshot();
      await fs.writeFile(filePath, screenshot, 'base64');

      console.log(`📸 Element screenshot saved: ${fileName}`);
      return { filePath, fileName };
    } catch (error) {
      console.error('❌ Failed to take element screenshot:', error.message);
      throw error;
    }
  }

  /**
   * Take a screenshot with highlighting
   */
  async takeHighlightedScreenshot(driver, element, testName, highlightName = '') {
    try {
      // Store original style
      const originalStyle = await element.getAttribute('style');
      
      // Apply highlight style
      await driver.executeScript(`
        arguments[0].style.border = '3px solid #ff0000';
        arguments[0].style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
        arguments[0].style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
      `, element);

      // Scroll element into view
      await driver.executeScript("arguments[0].scrollIntoView(true);", element);
      await driver.sleep(500);

      // Take screenshot
      const timestamp = this.getTimestamp();
      const fileName = this.generateFileName(testName, highlightName, timestamp, 'highlighted');
      const filePath = path.join(this.screenshotDir, fileName);

      const screenshot = await driver.takeScreenshot();
      await fs.writeFile(filePath, screenshot, 'base64');

      // Restore original style
      await driver.executeScript(`arguments[0].style = '${originalStyle || ''}';`, element);

      console.log(`📸 Highlighted screenshot saved: ${fileName}`);
      return { filePath, fileName };
    } catch (error) {
      console.error('❌ Failed to take highlighted screenshot:', error.message);
      throw error;
    }
  }

  /**
   * Take a comparison screenshot (before/after)
   */
  async takeComparisonScreenshot(driver, testName, stage = 'before') {
    try {
      const timestamp = this.getTimestamp();
      const fileName = this.generateFileName(testName, stage, timestamp, 'comparison');
      const filePath = path.join(this.screenshotDir, fileName);

      const screenshot = await driver.takeScreenshot();
      await fs.writeFile(filePath, screenshot, 'base64');

      console.log(`📸 ${stage} comparison screenshot saved: ${fileName}`);
      return { filePath, fileName };
    } catch (error) {
      console.error(`❌ Failed to take ${stage} comparison screenshot:`, error.message);
      throw error;
    }
  }

  /**
   * Take a screenshot on test failure with error details
   */
  async takeFailureScreenshot(driver, testName, error, additionalInfo = {}) {
    try {
      const timestamp = this.getTimestamp();
      const fileName = this.generateFileName(testName, 'FAILURE', timestamp, 'error');
      const filePath = path.join(this.screenshotDir, fileName);

      // Take screenshot
      const screenshot = await driver.takeScreenshot();
      await fs.writeFile(filePath, screenshot, 'base64');

      // Create error info file
      const errorInfoPath = filePath.replace('.png', '_error-info.json');
      const errorInfo = {
        testName,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        currentUrl: await driver.getCurrentUrl(),
        pageTitle: await driver.getTitle(),
        windowSize: await this.getWindowSize(driver),
        userAgent: await this.getUserAgent(driver),
        additionalInfo
      };

      await fs.writeFile(errorInfoPath, JSON.stringify(errorInfo, null, 2));

      console.log(`📸 Failure screenshot and error info saved: ${fileName}`);
      return { 
        screenshotPath: filePath, 
        errorInfoPath, 
        fileName,
        errorInfo 
      };
    } catch (screenshotError) {
      console.error('❌ Failed to take failure screenshot:', screenshotError.message);
      throw screenshotError;
    }
  }

  /**
   * Take a screenshot with custom overlay text
   */
  async takeScreenshotWithOverlay(driver, testName, overlayText, stepName = '') {
    try {
      // Inject overlay CSS and HTML
      await driver.executeScript(`
        // Remove existing overlay
        const existingOverlay = document.getElementById('test-overlay');
        if (existingOverlay) {
          existingOverlay.remove();
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'test-overlay';
        overlay.style.cssText = \`
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px 15px;
          border-radius: 5px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: bold;
          z-index: 10000;
          border: 2px solid #4CAF50;
        \`;
        overlay.textContent = arguments[0];
        document.body.appendChild(overlay);
      `, overlayText);

      // Take screenshot
      const timestamp = this.getTimestamp();
      const fileName = this.generateFileName(testName, stepName, timestamp, 'overlay');
      const filePath = path.join(this.screenshotDir, fileName);

      const screenshot = await driver.takeScreenshot();
      await fs.writeFile(filePath, screenshot, 'base64');

      // Remove overlay
      await driver.executeScript(`
        const overlay = document.getElementById('test-overlay');
        if (overlay) {
          overlay.remove();
        }
      `);

      console.log(`📸 Overlay screenshot saved: ${fileName}`);
      return { filePath, fileName };
    } catch (error) {
      console.error('❌ Failed to take overlay screenshot:', error.message);
      throw error;
    }
  }

  /**
   * Take a series of screenshots during a test sequence
   */
  async takeSequenceScreenshots(driver, testName, steps) {
    const screenshots = [];
    
    for (let i = 0; i < steps.length; i++) {
      try {
        const step = steps[i];
        const stepNumber = (i + 1).toString().padStart(2, '0');
        const stepName = `step${stepNumber}_${step.name}`;
        
        // Execute step action if provided
        if (step.action && typeof step.action === 'function') {
          await step.action();
        }

        // Take screenshot
        const result = await this.takeScreenshotWithOverlay(
          driver, 
          testName, 
          `Step ${i + 1}: ${step.description || step.name}`,
          stepName
        );
        
        screenshots.push({
          step: i + 1,
          name: step.name,
          description: step.description,
          ...result
        });

        // Optional delay between steps
        if (step.delay) {
          await driver.sleep(step.delay);
        }
      } catch (error) {
        console.error(`❌ Failed to take screenshot for step ${i + 1}:`, error.message);
      }
    }
    
    return screenshots;
  }

  /**
   * Generate a standardized filename
   */
  generateFileName(testName, stepName, timestamp, type = 'screenshot') {
    const sanitizedTestName = testName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedStepName = stepName ? stepName.replace(/[^a-zA-Z0-9]/g, '_') : '';
    
    let fileName = `${sanitizedTestName}`;
    if (sanitizedStepName) {
      fileName += `_${sanitizedStepName}`;
    }
    fileName += `_${timestamp}_${type}.png`;
    
    return fileName;
  }

  /**
   * Get formatted timestamp
   */
  getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
  }

  /**
   * Get window size information
   */
  async getWindowSize(driver) {
    try {
      const size = await driver.manage().window().getRect();
      return {
        width: size.width,
        height: size.height,
        x: size.x,
        y: size.y
      };
    } catch (error) {
      return { error: 'Could not get window size' };
    }
  }

  /**
   * Get user agent information
   */
  async getUserAgent(driver) {
    try {
      return await driver.executeScript('return navigator.userAgent;');
    } catch (error) {
      return 'Unknown user agent';
    }
  }

  /**
   * Clean up screenshots older than specified days
   */
  async cleanupOldScreenshots(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const files = await fs.readdir(this.screenshotDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.screenshotDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.remove(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`🗑️ Cleaned up ${deletedCount} old screenshot(s)`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old screenshots:', error.message);
      return 0;
    }
  }

  /**
   * Create a screenshot gallery HTML file
   */
  async createScreenshotGallery(testName, screenshots) {
    try {
      const galleryHtml = this.generateGalleryHtml(testName, screenshots);
      const galleryPath = path.join(this.screenshotDir, `${testName}_gallery.html`);
      
      await fs.writeFile(galleryPath, galleryHtml);
      console.log(`📊 Screenshot gallery created: ${testName}_gallery.html`);
      
      return galleryPath;
    } catch (error) {
      console.error('❌ Failed to create screenshot gallery:', error.message);
      throw error;
    }
  }

  /**
   * Generate HTML for screenshot gallery
   */
  generateGalleryHtml(testName, screenshots) {
    const screenshotItems = screenshots.map(screenshot => `
      <div class="screenshot-item">
        <h3>${screenshot.name || 'Screenshot'}</h3>
        <p>${screenshot.description || ''}</p>
        <img src="${path.basename(screenshot.filePath)}" alt="${screenshot.name}" />
        <p class="timestamp">${new Date(screenshot.timestamp || Date.now()).toLocaleString()}</p>
      </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Screenshots - ${testName}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .gallery {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 20px;
            }
            .screenshot-item {
                background: white;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .screenshot-item h3 {
                margin-top: 0;
                color: #333;
            }
            .screenshot-item img {
                width: 100%;
                height: auto;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .screenshot-item img:hover {
                transform: scale(1.02);
            }
            .timestamp {
                font-size: 12px;
                color: #666;
                margin-top: 10px;
            }
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.9);
            }
            .modal-content {
                margin: auto;
                display: block;
                width: 80%;
                max-width: 1200px;
                margin-top: 50px;
            }
            .close {
                position: absolute;
                top: 15px;
                right: 35px;
                color: #f1f1f1;
                font-size: 40px;
                font-weight: bold;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Test Screenshots: ${testName}</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Total Screenshots: ${screenshots.length}</p>
        </div>
        
        <div class="gallery">
            ${screenshotItems}
        </div>

        <div id="imageModal" class="modal">
            <span class="close">&times;</span>
            <img class="modal-content" id="modalImage">
        </div>

        <script>
            // Add click handlers for image modal
            document.querySelectorAll('.screenshot-item img').forEach(img => {
                img.addEventListener('click', function() {
                    const modal = document.getElementById('imageModal');
                    const modalImg = document.getElementById('modalImage');
                    modal.style.display = 'block';
                    modalImg.src = this.src;
                });
            });

            // Close modal
            document.querySelector('.close').addEventListener('click', function() {
                document.getElementById('imageModal').style.display = 'none';
            });

            // Close modal on outside click
            window.addEventListener('click', function(event) {
                const modal = document.getElementById('imageModal');
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        </script>
    </body>
    </html>
    `;
  }
}

export default ScreenshotHelper;