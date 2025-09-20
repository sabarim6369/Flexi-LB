import { By } from 'selenium-webdriver';
import BasePage from './BasePage.js';

class SignupPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Page locators based on the Signup.tsx component
    this.locators = {
      // Form elements
      nameInput: By.id('name'),
      emailInput: By.id('email'),
      passwordInput: By.id('password'),
      confirmPasswordInput: By.id('confirmPassword'),
      signupButton: By.css('button[type="submit"]'),
      termsCheckbox: By.id('terms'),
      
      // Toggle password visibility
      passwordToggleButton: By.css('input[id="password"] + button'),
      confirmPasswordToggleButton: By.css('input[id="confirmPassword"] + button'),
      eyeIcon: By.css('.lucide-eye'),
      eyeOffIcon: By.css('.lucide-eye-off'),
      
      // Links
      termsOfServiceLink: By.xpath('//a[contains(text(), "Terms of Service")]'),
      privacyPolicyLink: By.xpath('//a[contains(text(), "Privacy Policy")]'),
      loginLink: By.css('a[href="/login"]'),
      
      // Logo and branding
      logo: By.css('.lucide-activity'),
      brandText: By.xpath('//h1[text()="FlexiLB"]'),
      
      // Form validation and messages
      pageTitle: By.xpath('//h2[contains(text(), "Join FlexiLB")]'),
      formDescription: By.xpath('//p[contains(text(), "Create your account to get started")]'),
      
      // Loading state
      loadingSpinner: By.css('.animate-spin'),
      creatingAccountText: By.xpath('//div[contains(text(), "Creating Account...")]'),
      
      // Form container
      formCard: By.css('.bg-card\\/90'),
      
      // Icons
      userIcon: By.css('.lucide-user'),
      mailIcon: By.css('.lucide-mail'),
      lockIcon: By.css('.lucide-lock'),
      
      // Labels
      nameLabel: By.xpath('//label[@for="name"]'),
      emailLabel: By.xpath('//label[@for="email"]'),
      passwordLabel: By.xpath('//label[@for="password"]'),
      confirmPasswordLabel: By.xpath('//label[@for="confirmPassword"]'),
      
      // Terms and conditions section
      termsContainer: By.css('.text-sm.pt-2'),
      termsText: By.xpath('//span[contains(text(), "I agree to the")]'),
      
      // Error states (these might appear dynamically)
      nameError: By.css('[data-testid="name-error"]'),
      emailError: By.css('[data-testid="email-error"]'),
      passwordError: By.css('[data-testid="password-error"]'),
      confirmPasswordError: By.css('[data-testid="confirm-password-error"]'),
      generalError: By.css('[data-testid="general-error"]'),
      
      // Toast notifications (using sonner)
      toastContainer: By.css('[data-sonner-toaster]'),
      successToast: By.css('[data-sonner-toast][data-type="success"]'),
      errorToast: By.css('[data-sonner-toast][data-type="error"]'),
      warningToast: By.css('[data-sonner-toast][data-type="warning"]'),
      
      // Animation container
      lottieAnimation: By.css('.w-full.max-w-lg'),
      
      // Copyright text
      copyrightText: By.xpath('//p[contains(text(), "© 2025 FlexiLB. All rights reserved.")]'),
      
      // Header text
      joinNetworkTitle: By.xpath('//h2[contains(text(), "Join Our Network")]'),
      headerDescription: By.xpath('//p[contains(text(), "Create your account and experience next-generation load balancing technology")]')
    };
  }

  /**
   * Navigate to signup page
   */
  async navigateToSignup(baseUrl = 'http://localhost:5173') {
    const signupUrl = `${baseUrl}/signup`;
    await this.driver.get(signupUrl);
    await this.waitForPageLoad();
    await this.waitForSignupPageElements();
  }

  /**
   * Wait for signup page elements to be visible
   */
  async waitForSignupPageElements() {
    await this.waitForElement(this.locators.pageTitle);
    await this.waitForElement(this.locators.nameInput);
    await this.waitForElement(this.locators.emailInput);
    await this.waitForElement(this.locators.passwordInput);
    await this.waitForElement(this.locators.confirmPasswordInput);
    await this.waitForElement(this.locators.signupButton);
    await this.waitForElement(this.locators.termsCheckbox);
  }

  /**
   * Enter full name
   */
  async enterName(name) {
    await this.safeType(this.locators.nameInput, name);
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
   * Enter confirm password
   */
  async enterConfirmPassword(confirmPassword) {
    await this.safeType(this.locators.confirmPasswordInput, confirmPassword);
  }

  /**
   * Click signup button
   */
  async clickSignup() {
    await this.safeClick(this.locators.signupButton);
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility() {
    await this.safeClick(this.locators.passwordToggleButton);
  }

  /**
   * Toggle confirm password visibility
   */
  async toggleConfirmPasswordVisibility() {
    await this.safeClick(this.locators.confirmPasswordToggleButton);
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
   * Check if confirm password is visible
   */
  async isConfirmPasswordVisible() {
    const confirmPasswordInput = await this.waitForElement(this.locators.confirmPasswordInput);
    const inputType = await confirmPasswordInput.getAttribute('type');
    return inputType === 'text';
  }

  /**
   * Click terms and conditions checkbox
   */
  async clickTermsCheckbox() {
    await this.safeClick(this.locators.termsCheckbox);
  }

  /**
   * Check if terms checkbox is checked
   */
  async isTermsCheckboxChecked() {
    const checkbox = await this.waitForElement(this.locators.termsCheckbox);
    return await checkbox.isSelected();
  }

  /**
   * Click terms of service link
   */
  async clickTermsOfServiceLink() {
    await this.safeClick(this.locators.termsOfServiceLink);
  }

  /**
   * Click privacy policy link
   */
  async clickPrivacyPolicyLink() {
    await this.safeClick(this.locators.privacyPolicyLink);
  }

  /**
   * Click login link
   */
  async clickLoginLink() {
    await this.safeClick(this.locators.loginLink);
  }

  /**
   * Perform complete signup with all details
   */
  async signup(formData) {
    const { name, email, password, confirmPassword, acceptTerms = true } = formData;
    
    await this.enterName(name);
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.enterConfirmPassword(confirmPassword);
    
    if (acceptTerms) {
      await this.clickTermsCheckbox();
    }
    
    await this.clickSignup();
  }

  /**
   * Get form field values
   */
  async getFormValues() {
    return {
      name: await this.getAttribute(this.locators.nameInput, 'value'),
      email: await this.getAttribute(this.locators.emailInput, 'value'),
      password: await this.getAttribute(this.locators.passwordInput, 'value'),
      confirmPassword: await this.getAttribute(this.locators.confirmPasswordInput, 'value'),
      termsAccepted: await this.isTermsCheckboxChecked()
    };
  }

  /**
   * Get individual field values
   */
  async getNameValue() {
    return await this.getAttribute(this.locators.nameInput, 'value');
  }

  async getEmailValue() {
    return await this.getAttribute(this.locators.emailInput, 'value');
  }

  async getPasswordValue() {
    return await this.getAttribute(this.locators.passwordInput, 'value');
  }

  async getConfirmPasswordValue() {
    return await this.getAttribute(this.locators.confirmPasswordInput, 'value');
  }

  /**
   * Check if signup button is enabled
   */
  async isSignupButtonEnabled() {
    return await this.isElementEnabled(this.locators.signupButton);
  }

  /**
   * Check if signup is in progress (loading state)
   */
  async isSignupInProgress() {
    return await this.isElementVisible(this.locators.loadingSpinner);
  }

  /**
   * Wait for signup to complete
   */
  async waitForSignupComplete(timeout = 10000) {
    // Wait for loading spinner to disappear
    if (await this.isElementPresent(this.locators.loadingSpinner)) {
      await this.waitForElementToDisappear(this.locators.loadingSpinner, timeout);
    }
  }

  /**
   * Check toast visibility
   */
  async isSuccessToastVisible() {
    return await this.isElementVisible(this.locators.successToast);
  }

  async isErrorToastVisible() {
    return await this.isElementVisible(this.locators.errorToast);
  }

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
   * Clear form fields
   */
  async clearName() {
    const nameInput = await this.waitForElement(this.locators.nameInput);
    await nameInput.clear();
  }

  async clearEmail() {
    const emailInput = await this.waitForElement(this.locators.emailInput);
    await emailInput.clear();
  }

  async clearPassword() {
    const passwordInput = await this.waitForElement(this.locators.passwordInput);
    await passwordInput.clear();
  }

  async clearConfirmPassword() {
    const confirmPasswordInput = await this.waitForElement(this.locators.confirmPasswordInput);
    await confirmPasswordInput.clear();
  }

  async clearForm() {
    await this.clearName();
    await this.clearEmail();
    await this.clearPassword();
    await this.clearConfirmPassword();
  }

  /**
   * Get signup button text
   */
  async getSignupButtonText() {
    return await this.getText(this.locators.signupButton);
  }

  /**
   * Verify page elements are loaded correctly
   */
  async verifyPageElements() {
    const checks = {
      pageTitle: await this.isElementVisible(this.locators.pageTitle),
      nameInput: await this.isElementVisible(this.locators.nameInput),
      emailInput: await this.isElementVisible(this.locators.emailInput),
      passwordInput: await this.isElementVisible(this.locators.passwordInput),
      confirmPasswordInput: await this.isElementVisible(this.locators.confirmPasswordInput),
      signupButton: await this.isElementVisible(this.locators.signupButton),
      termsCheckbox: await this.isElementVisible(this.locators.termsCheckbox),
      loginLink: await this.isElementVisible(this.locators.loginLink),
      termsOfServiceLink: await this.isElementVisible(this.locators.termsOfServiceLink),
      privacyPolicyLink: await this.isElementVisible(this.locators.privacyPolicyLink)
    };

    return checks;
  }

  /**
   * Get form validation state
   */
  async getFormValidationState() {
    const formValues = await this.getFormValues();
    const { name, email, password, confirmPassword, termsAccepted } = formValues;
    
    const isEmailValid = this.isValidEmail(email);
    const isPasswordValid = this.isStrongPassword(password);
    const passwordsMatch = password === confirmPassword;
    const isFormValid = name.length > 0 && isEmailValid && isPasswordValid && passwordsMatch && termsAccepted;
    
    return {
      name: {
        value: name,
        isEmpty: name.length === 0,
        isValid: name.length > 0
      },
      email: {
        value: email,
        isEmpty: email.length === 0,
        isValid: isEmailValid
      },
      password: {
        value: password,
        isEmpty: password.length === 0,
        isValid: isPasswordValid
      },
      confirmPassword: {
        value: confirmPassword,
        isEmpty: confirmPassword.length === 0,
        matchesPassword: passwordsMatch
      },
      terms: {
        accepted: termsAccepted
      },
      form: {
        isValid: isFormValid,
        canSubmit: isFormValid && await this.isSignupButtonEnabled()
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
   * Validate password strength
   */
  isStrongPassword(password) {
    // At least 8 characters, contains uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Wait for navigation to dashboard after successful signup
   */
  async waitForDashboardNavigation(timeout = 15000) {
    await this.waitForUrlContains('/dashboard', timeout);
  }

  /**
   * Perform signup and wait for result
   */
  async signupAndWaitForResult(formData, expectedSuccess = true) {
    await this.signup(formData);
    
    if (expectedSuccess) {
      // Wait for success toast and navigation
      await this.waitForToast();
      await this.waitForDashboardNavigation();
      return { success: true, message: await this.getToastMessage() };
    } else {
      // Wait for error/warning toast
      await this.waitForToast();
      return { success: false, message: await this.getToastMessage() };
    }
  }

  /**
   * Check if we're on the signup page
   */
  async isOnSignupPage() {
    const currentUrl = await this.getCurrentUrl();
    return currentUrl.includes('/signup');
  }

  /**
   * Take screenshot of signup page
   */
  async takeSignupPageScreenshot() {
    return await this.driver.takeScreenshot();
  }

  /**
   * Highlight form elements for debugging
   */
  async highlightFormElements() {
    await this.highlightElement(this.locators.nameInput, 1000);
    await this.highlightElement(this.locators.emailInput, 1000);
    await this.highlightElement(this.locators.passwordInput, 1000);
    await this.highlightElement(this.locators.confirmPasswordInput, 1000);
    await this.highlightElement(this.locators.termsCheckbox, 1000);
    await this.highlightElement(this.locators.signupButton, 1000);
  }

  /**
   * Test password strength requirements
   */
  async testPasswordStrength(password) {
    const tests = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    };
    
    tests.isStrong = Object.values(tests).every(test => test === true);
    
    return tests;
  }

  /**
   * Fill form with different validation scenarios
   */
  async fillFormWithValidationScenario(scenario) {
    const scenarios = {
      valid: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        acceptTerms: true
      },
      emptyName: {
        name: '',
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        acceptTerms: true
      },
      invalidEmail: {
        name: 'Test User',
        email: 'invalid-email',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        acceptTerms: true
      },
      weakPassword: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        acceptTerms: true
      },
      passwordMismatch: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'DifferentPassword123!',
        acceptTerms: true
      },
      termsNotAccepted: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        acceptTerms: false
      }
    };

    const formData = scenarios[scenario];
    if (!formData) {
      throw new Error(`Unknown validation scenario: ${scenario}`);
    }

    await this.signup(formData);
    return formData;
  }
}

export default SignupPage;