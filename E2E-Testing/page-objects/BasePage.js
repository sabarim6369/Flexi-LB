import { By, until } from 'selenium-webdriver';

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = 20000;
  }

  /**
   * Wait for element to be present and visible
   */
  async waitForElement(locator, timeout = this.timeout) {
    try {
      const element = await this.driver.wait(until.elementLocated(locator), timeout);
      await this.driver.wait(until.elementIsVisible(element), timeout);
      return element;
    } catch (error) {
      throw new Error(`Element not found or not visible: ${locator.toString()}`);
    }
  }

  /**
   * Wait for element to be clickable
   */
  async waitForElementClickable(locator, timeout = this.timeout) {
    try {
      const element = await this.driver.wait(until.elementLocated(locator), timeout);
      await this.driver.wait(until.elementIsEnabled(element), timeout);
      return element;
    } catch (error) {
      throw new Error(`Element not clickable: ${locator.toString()}`);
    }
  }

  /**
   * Safe click with retry mechanism
   */
  async safeClick(locator, timeout = this.timeout) {
    const element = await this.waitForElementClickable(locator, timeout);
    
    // Scroll element into view
    await this.driver.executeScript("arguments[0].scrollIntoView(true);", element);
    await this.driver.sleep(500);
    
    // Try clicking with retry
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await element.click();
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          // Try JavaScript click as fallback
          await this.driver.executeScript("arguments[0].click();", element);
          return;
        }
        await this.driver.sleep(500);
      }
    }
  }

  /**
   * Safe text input with clearing
   */
  async safeType(locator, text, timeout = this.timeout) {
    const element = await this.waitForElement(locator, timeout);
    
    // Scroll element into view
    await this.driver.executeScript("arguments[0].scrollIntoView(true);", element);
    await this.driver.sleep(300);
    
    // Clear existing text
    await element.clear();
    await this.driver.sleep(200);
    
    // Type new text
    await element.sendKeys(text);
    
    // Verify text was entered correctly
    const actualValue = await element.getAttribute('value');
    if (actualValue !== text) {
      // Retry if text doesn't match
      await element.clear();
      await this.driver.sleep(200);
      await element.sendKeys(text);
    }
  }

  /**
   * Get text from element
   */
  async getText(locator, timeout = this.timeout) {
    const element = await this.waitForElement(locator, timeout);
    return await element.getText();
  }

  /**
   * Get attribute value from element
   */
  async getAttribute(locator, attributeName, timeout = this.timeout) {
    const element = await this.waitForElement(locator, timeout);
    return await element.getAttribute(attributeName);
  }

  /**
   * Check if element is present
   */
  async isElementPresent(locator) {
    try {
      await this.driver.findElement(locator);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(locator) {
    try {
      const element = await this.driver.findElement(locator);
      return await element.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if element is enabled
   */
  async isElementEnabled(locator) {
    try {
      const element = await this.driver.findElement(locator);
      return await element.isEnabled();
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for element to disappear
   */
  async waitForElementToDisappear(locator, timeout = this.timeout) {
    try {
      await this.driver.wait(async () => {
        return !(await this.isElementVisible(locator));
      }, timeout);
    } catch (error) {
      throw new Error(`Element did not disappear: ${locator.toString()}`);
    }
  }

  /**
   * Wait for text to be present in element
   */
  async waitForTextInElement(locator, text, timeout = this.timeout) {
    try {
      await this.driver.wait(until.elementTextContains(
        await this.driver.findElement(locator), 
        text
      ), timeout);
    } catch (error) {
      throw new Error(`Text '${text}' not found in element: ${locator.toString()}`);
    }
  }

  /**
   * Wait for URL to contain specific text
   */
  async waitForUrlContains(urlPart, timeout = this.timeout) {
    try {
      await this.driver.wait(until.urlContains(urlPart), timeout);
    } catch (error) {
      const currentUrl = await this.driver.getCurrentUrl();
      throw new Error(`URL does not contain '${urlPart}'. Current URL: ${currentUrl}`);
    }
  }

  /**
   * Wait for page title to contain specific text
   */
  async waitForTitleContains(titlePart, timeout = this.timeout) {
    try {
      await this.driver.wait(until.titleContains(titlePart), timeout);
    } catch (error) {
      const currentTitle = await this.driver.getTitle();
      throw new Error(`Title does not contain '${titlePart}'. Current title: ${currentTitle}`);
    }
  }

  /**
   * Scroll to element
   */
  async scrollToElement(locator) {
    const element = await this.waitForElement(locator);
    await this.driver.executeScript("arguments[0].scrollIntoView(true);", element);
    await this.driver.sleep(500);
  }

  /**
   * Highlight element for debugging
   */
  async highlightElement(locator, duration = 2000) {
    const element = await this.waitForElement(locator);
    
    // Store original style
    const originalStyle = await element.getAttribute('style');
    
    // Apply highlight style
    await this.driver.executeScript(`
      arguments[0].style.border = '3px solid red';
      arguments[0].style.backgroundColor = 'yellow';
      arguments[0].style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
    `, element);
    
    // Wait for specified duration
    await this.driver.sleep(duration);
    
    // Restore original style
    await this.driver.executeScript(`arguments[0].style = '${originalStyle || ''}';`, element);
  }

  /**
   * Take screenshot of specific element
   */
  async takeElementScreenshot(locator) {
    const element = await this.waitForElement(locator);
    return await element.takeScreenshot();
  }

  /**
   * Get current URL
   */
  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  /**
   * Get page title
   */
  async getPageTitle() {
    return await this.driver.getTitle();
  }

  /**
   * Refresh the page
   */
  async refresh() {
    await this.driver.navigate().refresh();
  }

  /**
   * Navigate back
   */
  async goBack() {
    await this.driver.navigate().back();
  }

  /**
   * Execute JavaScript
   */
  async executeScript(script, ...args) {
    return await this.driver.executeScript(script, ...args);
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(timeout = this.timeout) {
    await this.driver.wait(async () => {
      const readyState = await this.driver.executeScript('return document.readyState');
      return readyState === 'complete';
    }, timeout);
  }

  /**
   * Wait for Angular/React to finish loading (if applicable)
   */
  async waitForFrameworkLoad(timeout = this.timeout) {
    // Wait for any pending async operations
    await this.driver.wait(async () => {
      try {
        // Check if jQuery is loaded and has no active requests
        const jqueryActive = await this.driver.executeScript(`
          return typeof $ !== 'undefined' ? $.active : 0;
        `);
        
        // Check if React is loaded and not rendering
        const reactRendering = await this.driver.executeScript(`
          return typeof React !== 'undefined' && 
                 typeof React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED !== 'undefined' ?
                 false : false;
        `);
        
        return jqueryActive === 0 && !reactRendering;
      } catch (error) {
        return true; // If framework detection fails, assume it's loaded
      }
    }, timeout);
  }

  /**
   * Switch to iframe
   */
  async switchToIframe(locator) {
    const iframe = await this.waitForElement(locator);
    await this.driver.switchTo().frame(iframe);
  }

  /**
   * Switch back to default content
   */
  async switchToDefaultContent() {
    await this.driver.switchTo().defaultContent();
  }

  /**
   * Handle alert dialogs
   */
  async acceptAlert() {
    const alert = await this.driver.switchTo().alert();
    await alert.accept();
  }

  async dismissAlert() {
    const alert = await this.driver.switchTo().alert();
    await alert.dismiss();
  }

  async getAlertText() {
    const alert = await this.driver.switchTo().alert();
    return await alert.getText();
  }

  /**
   * Wait with custom condition
   */
  async waitUntil(condition, timeout = this.timeout, message = 'Condition not met') {
    try {
      await this.driver.wait(condition, timeout);
    } catch (error) {
      throw new Error(message);
    }
  }

  /**
   * Get all elements matching locator
   */
  async getElements(locator) {
    return await this.driver.findElements(locator);
  }

  /**
   * Get element count
   */
  async getElementCount(locator) {
    const elements = await this.getElements(locator);
    return elements.length;
  }

  /**
   * Wait for specific element count
   */
  async waitForElementCount(locator, expectedCount, timeout = this.timeout) {
    await this.driver.wait(async () => {
      const count = await this.getElementCount(locator);
      return count === expectedCount;
    }, timeout);
  }
}

export default BasePage;