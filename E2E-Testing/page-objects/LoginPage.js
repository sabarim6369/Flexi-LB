import { By } from 'selenium-webdriver';
import BasePage from './BasePage.js';

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Page locators based on the Login.tsx component
    this.locators = {
      // Form elements
      emailInput: By.id('email'),
      passwordInput: By.id('password'),
      loginButton: By.css('button[type="submit"]'),
      rememberMeCheckbox: By.id('remember'),
      
      // Toggle password visibility
      passwordToggleButton: By.css('button[type="button"]'),
      eyeIcon: By.css('.lucide-eye'),
      eyeOffIcon: By.css('.lucide-eye-off'),
      
      // Links
      forgotPasswordLink: By.css('a[href="#"]'),
      signupLink: By.css('a[href="/signup"]'),
      
      // Logo and branding
      logo: By.css('.lucide-activity'),
      brandText: By.xpath('//h1[text()="FlexiLB"]'),
      
      // Form validation and messages
      welcomeTitle: By.xpath('//h2[contains(text(), "Welcome Back")]'),
      formDescription: By.xpath('//p[contains(text(), "Sign in to your FlexiLB dashboard")]'),
      
      // Loading state
      loadingSpinner: By.css('.animate-spin'),
      signingInText: By.xpath('//div[contains(text(), "Signing In...")]'),
      
      // Form container
      formCard: By.css('.bg-card\\/90'),
      
      // Icons
      mailIcon: By.css('.lucide-mail'),
      lockIcon: By.css('.lucide-lock'),
      
      // Labels
      emailLabel: By.xpath('//label[@for="email"]'),
      passwordLabel: By.xpath('//label[@for="password"]'),
      
      // Remember me section
      rememberMeLabel: By.xpath('//span[text()="Remember me"]'),
      
      // Error states (these might appear dynamically)
      emailError: By.css('[data-testid="email-error"]'),
      passwordError: By.css('[data-testid="password-error"]'),
      generalError: By.css('[data-testid="general-error"]'),
      
      // Toast notifications (using sonner)
      toastContainer: By.css('[data-sonner-toaster]'),
      successToast: By.css('[data-sonner-toast][data-type="success"]'),
      errorToast: By.css('[data-sonner-toast][data-type="error"]'),
      warningToast: By.css('[data-sonner-toast][data-type="warning"]'),
      
      // Animation container
      lottieAnimation: By.css('.w-full.max-w-lg'),
      
      // Copyright text
      copyrightText: By.xpath('//p[contains(text(), "© 2025 FlexiLB. All rights reserved.")]')
    };
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(baseUrl = 'http://localhost:5173') {
    const loginUrl = `${baseUrl}/login`;
    await this.driver.get(loginUrl);
    await this.waitForPageLoad();
    await this.waitForLoginPageElements();
  }

  /**
   * Wait for login page elements to be visible
   */
  async waitForLoginPageElements() {
    await this.waitForElement(this.locators.welcomeTitle);
    await this.waitForElement(this.locators.emailInput);
    await this.waitForElement(this.locators.passwordInput);
    await this.waitForElement(this.locators.loginButton);
  }

  /**
   * Enter email address
   */
  async enterEmail(email) {
    await this.safeType(this.locators.emailInput, email);
  }

  /**
   * Enter password
   */
  async enterPassword(password) {
    await this.safeType(this.locators.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLogin() {
    await this.safeClick(this.locators.loginButton);
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility() {
    await this.safeClick(this.locators.passwordToggleButton);
  }

  /**
   * Check if password is visible
   */
  async isPasswordVisible() {
    const passwordInput = await this.waitForElement(this.locators.passwordInput);
    const inputType = await passwordInput.getAttribute('type');
    return inputType === 'text';
  }

  /**
   * Click remember me checkbox
   */
  async clickRememberMe() {
    await this.safeClick(this.locators.rememberMeCheckbox);
  }

  /**
   * Check if remember me is checked
   */
  async isRememberMeChecked() {
    const checkbox = await this.waitForElement(this.locators.rememberMeCheckbox);
    return await checkbox.isSelected();
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.safeClick(this.locators.forgotPasswordLink);
  }

  /**
   * Click signup link
   */
  async clickSignupLink() {
    await this.safeClick(this.locators.signupLink);
  }

  /**
   * Perform complete login with credentials
   */
  async login(email, password, rememberMe = false) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    
    if (rememberMe) {
      await this.clickRememberMe();
    }
    
    await this.clickLogin();
  }

  /**
   * Get email input value
   */
  async getEmailValue() {
    return await this.getAttribute(this.locators.emailInput, 'value');
  }

  /**
   * Get password input value
   */
  async getPasswordValue() {
    return await this.getAttribute(this.locators.passwordInput, 'value');
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled() {
    return await this.isElementEnabled(this.locators.loginButton);
  }

  /**
   * Check if login is in progress (loading state)
   */
  async isLoginInProgress() {
    return await this.isElementVisible(this.locators.loadingSpinner);
  }

  /**
   * Wait for login to complete
   */
  async waitForLoginComplete(timeout = 10000) {
    // Wait for loading spinner to disappear
    if (await this.isElementPresent(this.locators.loadingSpinner)) {
      await this.waitForElementToDisappear(this.locators.loadingSpinner, timeout);
    }
  }

  /**
   * Check if success toast is visible
   */
  async isSuccessToastVisible() {
    return await this.isElementVisible(this.locators.successToast);
  }

  /**
   * Check if error toast is visible
   */
  async isErrorToastVisible() {
    return await this.isElementVisible(this.locators.errorToast);
  }

  /**
   * Check if warning toast is visible
   */
  async isWarningToastVisible() {
    return await this.isElementVisible(this.locators.warningToast);
  }

  /**
   * Get toast message text
   */
  async getToastMessage() {
    try {
      if (await this.isSuccessToastVisible()) {
        return await this.getText(this.locators.successToast);
      } else if (await this.isErrorToastVisible()) {
        return await this.getText(this.locators.errorToast);
      } else if (await this.isWarningToastVisible()) {
        return await this.getText(this.locators.warningToast);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(timeout = 5000) {
    await this.driver.wait(async () => {
      return await this.isSuccessToastVisible() || 
             await this.isErrorToastVisible() || 
             await this.isWarningToastVisible();
    }, timeout);
  }

  /**
   * Clear email field
   */
  async clearEmail() {
    const emailInput = await this.waitForElement(this.locators.emailInput);
    await emailInput.clear();
  }

  /**
   * Clear password field
   */
  async clearPassword() {
    const passwordInput = await this.waitForElement(this.locators.passwordInput);
    await passwordInput.clear();
  }

  /**
   * Clear all form fields
   */
  async clearForm() {
    await this.clearEmail();
    await this.clearPassword();
  }

  /**
   * Get login button text
   */
  async getLoginButtonText() {
    return await this.getText(this.locators.loginButton);
  }

  /**
   * Check if page elements are loaded correctly
   */
  async verifyPageElements() {
    const checks = {
      welcomeTitle: await this.isElementVisible(this.locators.welcomeTitle),
      emailInput: await this.isElementVisible(this.locators.emailInput),
      passwordInput: await this.isElementVisible(this.locators.passwordInput),
      loginButton: await this.isElementVisible(this.locators.loginButton),
      signupLink: await this.isElementVisible(this.locators.signupLink),
      forgotPasswordLink: await this.isElementVisible(this.locators.forgotPasswordLink),
      rememberMeCheckbox: await this.isElementVisible(this.locators.rememberMeCheckbox)
    };

    return checks;
  }

  /**
   * Get all form validation states
   */
  async getFormValidationState() {
    const emailValue = await this.getEmailValue();
    const passwordValue = await this.getPasswordValue();
    const isEmailValid = this.isValidEmail(emailValue);
    const isFormValid = emailValue.length > 0 && passwordValue.length > 0 && isEmailValid;
    
    return {
      email: {
        value: emailValue,
        isValid: isEmailValid,
        isEmpty: emailValue.length === 0
      },
      password: {
        value: passwordValue,
        isEmpty: passwordValue.length === 0
      },
      form: {
        isValid: isFormValid,
        canSubmit: isFormValid && await this.isLoginButtonEnabled()
      }
    };
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Wait for navigation to dashboard after successful login
   */
  async waitForDashboardNavigation(timeout = 15000) {
    await this.waitForUrlContains('/dashboard', timeout);
  }

  /**
   * Perform login and wait for result
   */
  async loginAndWaitForResult(email, password, expectedSuccess = true) {
    await this.login(email, password);
    
    if (expectedSuccess) {
      // Wait for success toast and navigation
      await this.waitForToast();
      await this.waitForDashboardNavigation();
      return { success: true, message: await this.getToastMessage() };
    } else {
      // Wait for error toast
      await this.waitForToast();
      return { success: false, message: await this.getToastMessage() };
    }
  }

  /**
   * Get page title
   */
  async getPageTitle() {
    return await this.driver.getTitle();
  }

  /**
   * Check if we're on the login page
   */
  async isOnLoginPage() {
    const currentUrl = await this.getCurrentUrl();
    return currentUrl.includes('/login');
  }

  /**
   * Get current URL
   */
  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  /**
   * Take screenshot of login page
   */
  async takeLoginPageScreenshot() {
    return await this.driver.takeScreenshot();
  }

  /**
   * Highlight form elements for debugging
   */
  async highlightFormElements() {
    await this.highlightElement(this.locators.emailInput, 1000);
    await this.highlightElement(this.locators.passwordInput, 1000);
    await this.highlightElement(this.locators.loginButton, 1000);
  }
}

export default LoginPage;