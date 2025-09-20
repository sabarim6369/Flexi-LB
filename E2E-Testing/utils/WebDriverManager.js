import { Builder, Browser, until, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import firefox from 'selenium-webdriver/firefox.js';
import safari from 'selenium-webdriver/safari.js';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

class WebDriverManager {
  constructor() {
    this.driver = null;
    this.browser = process.env.BROWSER || 'chrome';
    this.headless = process.env.HEADLESS === 'true';
    this.windowWidth = parseInt(process.env.WINDOW_WIDTH) || 1920;
    this.windowHeight = parseInt(process.env.WINDOW_HEIGHT) || 1080;
    this.implicitWait = parseInt(process.env.IMPLICIT_WAIT) || 10000;
    this.explicitWait = parseInt(process.env.EXPLICIT_WAIT) || 20000;
  }

  async createDriver() {
    let builder = new Builder();

    switch (this.browser.toLowerCase()) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        if (this.headless) {
          chromeOptions.addArguments('--headless');
        }
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments('--window-size=' + this.windowWidth + ',' + this.windowHeight);
        chromeOptions.addArguments('--disable-web-security');
        chromeOptions.addArguments('--allow-running-insecure-content');
        builder = builder.forBrowser(Browser.CHROME).setChromeOptions(chromeOptions);
        break;

      case 'firefox':
        const firefoxOptions = new firefox.Options();
        if (this.headless) {
          firefoxOptions.addArguments('--headless');
        }
        firefoxOptions.setPreference('dom.webnotifications.enabled', false);
        firefoxOptions.setPreference('media.navigator.permission.disabled', true);
        builder = builder.forBrowser(Browser.FIREFOX).setFirefoxOptions(firefoxOptions);
        break;

      case 'safari':
        const safariOptions = new safari.Options();
        builder = builder.forBrowser(Browser.SAFARI).setSafariOptions(safariOptions);
        break;

      default:
        throw new Error(`Unsupported browser: ${this.browser}`);
    }

    this.driver = await builder.build();
    
    // Set implicit wait
    await this.driver.manage().setTimeouts({ implicit: this.implicitWait });
    
    // Set window size for non-headless mode
    if (!this.headless && this.browser !== 'safari') {
      await this.driver.manage().window().setRect({
        width: this.windowWidth,
        height: this.windowHeight
      });
    }

    console.log(`✅ WebDriver created successfully: ${this.browser.toUpperCase()}${this.headless ? ' (Headless)' : ''}`);
    return this.driver;
  }

  async getDriver() {
    if (!this.driver) {
      await this.createDriver();
    }
    return this.driver;
  }

  async quitDriver() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
      console.log('✅ WebDriver closed successfully');
    }
  }

  async navigateTo(url) {
    const driver = await this.getDriver();
    console.log(`🌐 Navigating to: ${url}`);
    await driver.get(url);
    
    // Wait for page to load
    await driver.wait(until.elementLocated(By.tagName('body')), this.explicitWait);
  }

  async waitForElement(locator, timeout = null) {
    const driver = await this.getDriver();
    const waitTime = timeout || this.explicitWait;
    
    try {
      const element = await driver.wait(until.elementLocated(locator), waitTime);
      await driver.wait(until.elementIsVisible(element), waitTime);
      return element;
    } catch (error) {
      throw new Error(`Element not found or not visible: ${locator.toString()}`);
    }
  }

  async waitForElementClickable(locator, timeout = null) {
    const driver = await this.getDriver();
    const waitTime = timeout || this.explicitWait;
    
    try {
      const element = await driver.wait(until.elementLocated(locator), waitTime);
      await driver.wait(until.elementIsEnabled(element), waitTime);
      return element;
    } catch (error) {
      throw new Error(`Element not clickable: ${locator.toString()}`);
    }
  }

  async waitForElementToDisappear(locator, timeout = null) {
    const driver = await this.getDriver();
    const waitTime = timeout || this.explicitWait;
    
    try {
      await driver.wait(until.stalenessOf(await driver.findElement(locator)), waitTime);
    } catch (error) {
      // Element might not be present at all, which is fine
    }
  }

  async isElementPresent(locator) {
    const driver = await this.getDriver();
    try {
      await driver.findElement(locator);
      return true;
    } catch (error) {
      return false;
    }
  }

  async isElementVisible(locator) {
    const driver = await this.getDriver();
    try {
      const element = await driver.findElement(locator);
      return await element.isDisplayed();
    } catch (error) {
      return false;
    }
  }

  async scrollToElement(element) {
    const driver = await this.getDriver();
    await driver.executeScript("arguments[0].scrollIntoView(true);", element);
    // Small delay to ensure scroll is complete
    await driver.sleep(500);
  }

  async highlightElement(element, duration = 2000) {
    if (this.headless) return; // Skip highlighting in headless mode
    
    const driver = await this.getDriver();
    
    // Store original style
    const originalStyle = await element.getAttribute('style');
    
    // Apply highlight style
    await driver.executeScript(
      "arguments[0].style.border = '3px solid red'; arguments[0].style.backgroundColor = 'yellow';",
      element
    );
    
    // Wait for specified duration
    await driver.sleep(duration);
    
    // Restore original style
    await driver.executeScript(
      `arguments[0].style = '${originalStyle || ''}';`,
      element
    );
  }

  async getCurrentUrl() {
    const driver = await this.getDriver();
    return await driver.getCurrentUrl();
  }

  async getPageTitle() {
    const driver = await this.getDriver();
    return await driver.getTitle();
  }

  async refresh() {
    const driver = await this.getDriver();
    await driver.navigate().refresh();
  }

  async goBack() {
    const driver = await this.getDriver();
    await driver.navigate().back();
  }

  async goForward() {
    const driver = await this.getDriver();
    await driver.navigate().forward();
  }

  async executeScript(script, ...args) {
    const driver = await this.getDriver();
    return await driver.executeScript(script, ...args);
  }

  async sleep(milliseconds) {
    const driver = await this.getDriver();
    await driver.sleep(milliseconds);
  }

  async switchToWindow(windowHandle) {
    const driver = await this.getDriver();
    await driver.switchTo().window(windowHandle);
  }

  async getWindowHandles() {
    const driver = await this.getDriver();
    return await driver.getAllWindowHandles();
  }

  async closeCurrentWindow() {
    const driver = await this.getDriver();
    await driver.close();
  }

  async acceptAlert() {
    const driver = await this.getDriver();
    const alert = await driver.switchTo().alert();
    await alert.accept();
  }

  async dismissAlert() {
    const driver = await this.getDriver();
    const alert = await driver.switchTo().alert();
    await alert.dismiss();
  }

  async getAlertText() {
    const driver = await this.getDriver();
    const alert = await driver.switchTo().alert();
    return await alert.getText();
  }
}

export default WebDriverManager;