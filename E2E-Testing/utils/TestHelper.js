import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

class TestHelper {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3003';
    this.screenshotDir = process.env.SCREENSHOT_DIR || './screenshots';
    this.reportDir = process.env.REPORT_DIR || './reports';
    this.takeScreenshots = process.env.TAKE_SCREENSHOTS === 'true';
    this.screenshotOnFailure = process.env.SCREENSHOT_ON_FAILURE === 'true';
  }

  /**
   * Generate a unique test identifier
   */
  generateTestId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 9);
    return `test_${timestamp}_${random}`;
  }

  /**
   * Generate unique user data for testing
   */
  generateUniqueUserData() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    
    return {
      name: `Test User ${timestamp}`,
      email: `test.user.${timestamp}.${random}@flexilb.com`,
      username: `testuser${timestamp}${random}`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };
  }

  /**
   * Get URL for different pages
   */
  getPageUrl(pageName) {
    const urls = {
      home: `${this.baseUrl}/`,
      login: `${this.baseUrl}/login`,
      signup: `${this.baseUrl}/signup`,
      dashboard: `${this.baseUrl}/dashboard`,
      loadBalancers: `${this.baseUrl}/load-balancers`,
      metrics: `${this.baseUrl}/metrics`,
      alerts: `${this.baseUrl}/alerts`,
      settings: `${this.baseUrl}/settings`
    };

    return urls[pageName] || `${this.baseUrl}/${pageName}`;
  }

  /**
   * Wait for a specific amount of time
   */
  async wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Retry a function with exponential backoff
   */
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, i);
        console.log(`❌ Attempt ${i + 1} failed, retrying in ${delay}ms...`);
        await this.wait(delay);
      }
    }
  }

  /**
   * Take a screenshot and save it to the screenshots directory
   */
  async takeScreenshot(driver, testName, stepName = '') {
    if (!this.takeScreenshots) return null;

    try {
      await fs.ensureDir(this.screenshotDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${testName}${stepName ? `_${stepName}` : ''}_${timestamp}.png`;
      const filePath = path.join(this.screenshotDir, fileName);
      
      const screenshot = await driver.takeScreenshot();
      await fs.writeFile(filePath, screenshot, 'base64');
      
      console.log(`📸 Screenshot saved: ${fileName}`);
      return filePath;
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error.message);
      return null;
    }
  }

  /**
   * Take a screenshot on test failure
   */
  async takeScreenshotOnFailure(driver, testName, error) {
    if (!this.screenshotOnFailure) return null;

    try {
      const filePath = await this.takeScreenshot(driver, testName, 'FAILURE');
      if (filePath) {
        console.log(`📸 Failure screenshot saved for test: ${testName}`);
        // Attach screenshot path to error for reporting
        error.screenshotPath = filePath;
      }
      return filePath;
    } catch (screenshotError) {
      console.error('❌ Failed to take failure screenshot:', screenshotError.message);
      return null;
    }
  }

  /**
   * Load test data from JSON file
   */
  async loadTestData(fileName) {
    try {
      const filePath = path.join(__dirname, '..', 'test-data', fileName);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Failed to load test data from ${fileName}:`, error.message);
      throw error;
    }
  }

  /**
   * Save test results to file
   */
  async saveTestResults(testName, results) {
    try {
      await fs.ensureDir(this.reportDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${testName}_results_${timestamp}.json`;
      const filePath = path.join(this.reportDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      console.log(`📊 Test results saved: ${fileName}`);
      
      return filePath;
    } catch (error) {
      console.error('❌ Failed to save test results:', error.message);
      throw error;
    }
  }

  /**
   * Clean up old test artifacts
   */
  async cleanupOldArtifacts(daysOld = 7) {
    try {
      const directories = [this.screenshotDir, this.reportDir];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      for (const dir of directories) {
        if (await fs.pathExists(dir)) {
          const files = await fs.readdir(dir);
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffDate) {
              await fs.remove(filePath);
              console.log(`🗑️ Cleaned up old file: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old artifacts:', error.message);
    }
  }

  /**
   * Log test step with formatting
   */
  logStep(stepNumber, description, status = 'INFO') {
    const icons = {
      'INFO': 'ℹ️',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'DEBUG': '🐛'
    };
    
    const icon = icons[status] || icons['INFO'];
    console.log(`${icon} Step ${stepNumber}: ${description}`);
  }

  /**
   * Log test start
   */
  logTestStart(testName, description = '') {
    console.log('\n' + '='.repeat(80));
    console.log(`🚀 Starting Test: ${testName}`);
    if (description) {
      console.log(`📝 Description: ${description}`);
    }
    console.log('='.repeat(80));
  }

  /**
   * Log test completion
   */
  logTestComplete(testName, success = true, duration = null) {
    const status = success ? '✅ PASSED' : '❌ FAILED';
    const durationText = duration ? ` (${duration}ms)` : '';
    
    console.log('-'.repeat(80));
    console.log(`${status} Test: ${testName}${durationText}`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  isStrongPassword(password) {
    // At least 8 characters, contains uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Generate random string
   */
  generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Format test duration
   */
  formatDuration(startTime, endTime = null) {
    const end = endTime || Date.now();
    const duration = end - startTime;
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = ((duration % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Create test summary
   */
  createTestSummary(testResults) {
    const summary = {
      totalTests: testResults.length,
      passed: testResults.filter(r => r.status === 'passed').length,
      failed: testResults.filter(r => r.status === 'failed').length,
      skipped: testResults.filter(r => r.status === 'skipped').length,
      totalDuration: testResults.reduce((sum, r) => sum + (r.duration || 0), 0)
    };

    summary.passRate = ((summary.passed / summary.totalTests) * 100).toFixed(2);
    
    return summary;
  }
}

export default TestHelper;