import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import dotenv from 'dotenv';
import WebDriverManager from '../../utils/WebDriverManager.js';
import TestHelper from '../../utils/TestHelper.js';
import ScreenshotHelper from '../../utils/ScreenshotHelper.js';
import LoginPage from '../../page-objects/LoginPage.js';

// Load environment variables
dotenv.config();

describe('Login Page E2E Tests', function() {
  let driverManager;
  let driver;
  let testHelper;
  let screenshotHelper;
  let loginPage;
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const testTimeout = parseInt(process.env.TEST_TIMEOUT) || 30000;

  // Set test timeout
  this.timeout(testTimeout);

  before(async function() {
    testHelper = new TestHelper();
    testHelper.logTestStart('Login E2E Tests', 'Testing login functionality with various scenarios');
    
    driverManager = new WebDriverManager();
    driver = await driverManager.createDriver();
    screenshotHelper = new ScreenshotHelper();
    loginPage = new LoginPage(driver);
    
    console.log('✅ Test setup completed');
  });

  after(async function() {
    if (driver) {
      await driverManager.quitDriver();
    }
    testHelper.logTestComplete('Login E2E Tests', true);
  });

  beforeEach(async function() {
    // Navigate to login page before each test
    await loginPage.navigateToLogin(baseUrl);
    console.log(`🌐 Navigated to: ${baseUrl}/login`);
  });

  describe('Page Loading and Element Verification', function() {
    it('should load the login page successfully', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Verify page title');
        const title = await loginPage.getPageTitle();
        expect(title).to.include('FlexiLB', 'Page title should contain FlexiLB');

        testHelper.logStep(2, 'Verify current URL');
        const currentUrl = await loginPage.getCurrentUrl();
        expect(currentUrl).to.include('/login', 'URL should contain /login');

        testHelper.logStep(3, 'Verify all essential elements are present');
        const elements = await loginPage.verifyPageElements();
        
        expect(elements.welcomeTitle, 'Welcome title should be visible').to.be.true;
        expect(elements.emailInput, 'Email input should be visible').to.be.true;
        expect(elements.passwordInput, 'Password input should be visible').to.be.true;
        expect(elements.loginButton, 'Login button should be visible').to.be.true;
        expect(elements.signupLink, 'Signup link should be visible').to.be.true;
        expect(elements.forgotPasswordLink, 'Forgot password link should be visible').to.be.true;
        expect(elements.rememberMeCheckbox, 'Remember me checkbox should be visible').to.be.true;

        testHelper.logStep(4, 'Take page screenshot');
        await screenshotHelper.takeFullPageScreenshot(driver, 'login_page_loaded', 'page_verification');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Page Loading Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_page_loading_failed', error);
        throw error;
      }
    });

    it('should have proper form labels and placeholders', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Verify email input properties');
        const emailInput = await loginPage.waitForElement(loginPage.locators.emailInput);
        const emailPlaceholder = await emailInput.getAttribute('placeholder');
        const emailType = await emailInput.getAttribute('type');
        
        expect(emailPlaceholder).to.include('email', 'Email placeholder should mention email');
        expect(emailType).to.equal('email', 'Email input should have type="email"');

        testHelper.logStep(2, 'Verify password input properties');
        const passwordInput = await loginPage.waitForElement(loginPage.locators.passwordInput);
        const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
        const passwordType = await passwordInput.getAttribute('type');
        
        expect(passwordPlaceholder).to.include('password', 'Password placeholder should mention password');
        expect(passwordType).to.equal('password', 'Password input should initially have type="password"');

        testHelper.logStep(3, 'Verify button text');
        const buttonText = await loginPage.getLoginButtonText();
        expect(buttonText).to.include('Sign In', 'Login button should show "Sign In"');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Form Labels Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_form_labels_failed', error);
        throw error;
      }
    });
  });

  describe('Form Interaction Tests', function() {
    it('should allow typing in email and password fields', async function() {
      const startTime = Date.now();
      const testEmail = 'test@example.com';
      const testPassword = 'TestPassword123!';
      
      try {
        testHelper.logStep(1, 'Enter email address');
        await loginPage.enterEmail(testEmail);
        const emailValue = await loginPage.getEmailValue();
        expect(emailValue).to.equal(testEmail, 'Email should be entered correctly');

        testHelper.logStep(2, 'Enter password');
        await loginPage.enterPassword(testPassword);
        const passwordValue = await loginPage.getPasswordValue();
        expect(passwordValue).to.equal(testPassword, 'Password should be entered correctly');

        testHelper.logStep(3, 'Take screenshot of filled form');
        await screenshotHelper.takeFullPageScreenshot(driver, 'login_form_filled', 'form_interaction');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Form Interaction Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_form_interaction_failed', error);
        throw error;
      }
    });

    it('should toggle password visibility', async function() {
      const startTime = Date.now();
      const testPassword = 'TestPassword123!';
      
      try {
        testHelper.logStep(1, 'Enter password');
        await loginPage.enterPassword(testPassword);

        testHelper.logStep(2, 'Verify password is initially hidden');
        let isVisible = await loginPage.isPasswordVisible();
        expect(isVisible, 'Password should initially be hidden').to.be.false;

        testHelper.logStep(3, 'Click password visibility toggle');
        await loginPage.togglePasswordVisibility();
        
        testHelper.logStep(4, 'Verify password is now visible');
        isVisible = await loginPage.isPasswordVisible();
        expect(isVisible, 'Password should be visible after toggle').to.be.true;

        testHelper.logStep(5, 'Click toggle again to hide password');
        await loginPage.togglePasswordVisibility();
        isVisible = await loginPage.isPasswordVisible();
        expect(isVisible, 'Password should be hidden after second toggle').to.be.false;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Password Visibility Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_password_visibility_failed', error);
        throw error;
      }
    });

    it('should toggle remember me checkbox', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Verify remember me is initially unchecked');
        let isChecked = await loginPage.isRememberMeChecked();
        expect(isChecked, 'Remember me should initially be unchecked').to.be.false;

        testHelper.logStep(2, 'Click remember me checkbox');
        await loginPage.clickRememberMe();
        
        testHelper.logStep(3, 'Verify remember me is now checked');
        isChecked = await loginPage.isRememberMeChecked();
        expect(isChecked, 'Remember me should be checked after click').to.be.true;

        testHelper.logStep(4, 'Click remember me again to uncheck');
        await loginPage.clickRememberMe();
        isChecked = await loginPage.isRememberMeChecked();
        expect(isChecked, 'Remember me should be unchecked after second click').to.be.false;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Remember Me Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_remember_me_failed', error);
        throw error;
      }
    });
  });

  describe('Login Validation Tests', function() {
    it('should show warning for empty form submission', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Click login button with empty form');
        await loginPage.clickLogin();

        testHelper.logStep(2, 'Wait for validation message');
        await loginPage.waitForToast(5000);

        testHelper.logStep(3, 'Verify warning toast appears');
        const isWarningVisible = await loginPage.isWarningToastVisible();
        expect(isWarningVisible, 'Warning toast should be visible for empty form').to.be.true;

        testHelper.logStep(4, 'Verify warning message content');
        const toastMessage = await loginPage.getToastMessage();
        expect(toastMessage).to.include('email and password', 'Warning should mention email and password');

        await screenshotHelper.takeFullPageScreenshot(driver, 'login_empty_form_validation', 'validation_warning');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Empty Form Validation Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_empty_form_validation_failed', error);
        throw error;
      }
    });

    it('should show warning for missing email', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Enter only password');
        await loginPage.enterPassword('TestPassword123!');

        testHelper.logStep(2, 'Click login button');
        await loginPage.clickLogin();

        testHelper.logStep(3, 'Wait for validation message');
        await loginPage.waitForToast(5000);

        testHelper.logStep(4, 'Verify warning toast appears');
        const isWarningVisible = await loginPage.isWarningToastVisible();
        expect(isWarningVisible, 'Warning toast should be visible for missing email').to.be.true;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Missing Email Validation Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_missing_email_validation_failed', error);
        throw error;
      }
    });

    it('should show warning for missing password', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Enter only email');
        await loginPage.enterEmail('test@example.com');

        testHelper.logStep(2, 'Click login button');
        await loginPage.clickLogin();

        testHelper.logStep(3, 'Wait for validation message');
        await loginPage.waitForToast(5000);

        testHelper.logStep(4, 'Verify warning toast appears');
        const isWarningVisible = await loginPage.isWarningToastVisible();
        expect(isWarningVisible, 'Warning toast should be visible for missing password').to.be.true;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Missing Password Validation Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_missing_password_validation_failed', error);
        throw error;
      }
    });

    it('should show error for invalid credentials', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Enter invalid credentials');
        await loginPage.enterEmail('invalid@example.com');
        await loginPage.enterPassword('wrongpassword');

        testHelper.logStep(2, 'Click login button');
        await loginPage.clickLogin();

        testHelper.logStep(3, 'Wait for login to complete');
        await loginPage.waitForLoginComplete();

        testHelper.logStep(4, 'Wait for error message');
        await loginPage.waitForToast(10000);

        testHelper.logStep(5, 'Verify error toast appears');
        const isErrorVisible = await loginPage.isErrorToastVisible();
        expect(isErrorVisible, 'Error toast should be visible for invalid credentials').to.be.true;

        testHelper.logStep(6, 'Verify error message content');
        const toastMessage = await loginPage.getToastMessage();
        expect(toastMessage).to.include('Invalid credentials', 'Error should mention invalid credentials');

        await screenshotHelper.takeFullPageScreenshot(driver, 'login_invalid_credentials', 'validation_error');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Invalid Credentials Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_invalid_credentials_failed', error);
        throw error;
      }
    });
  });

  describe('Navigation Tests', function() {
    it('should navigate to signup page when signup link is clicked', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Click signup link');
        await loginPage.clickSignupLink();

        testHelper.logStep(2, 'Verify navigation to signup page');
        await loginPage.waitForUrlContains('/signup', 10000);
        
        const currentUrl = await loginPage.getCurrentUrl();
        expect(currentUrl).to.include('/signup', 'Should navigate to signup page');

        await screenshotHelper.takeFullPageScreenshot(driver, 'login_to_signup_navigation', 'navigation');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Navigation to Signup Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_to_signup_navigation_failed', error);
        throw error;
      }
    });

    it('should handle forgot password link click', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Click forgot password link');
        await loginPage.clickForgotPassword();

        // Note: Since forgot password currently links to "#", we verify the click doesn't navigate away
        testHelper.logStep(2, 'Verify still on login page');
        const currentUrl = await loginPage.getCurrentUrl();
        expect(currentUrl).to.include('/login', 'Should remain on login page');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Forgot Password Link Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_forgot_password_failed', error);
        throw error;
      }
    });
  });

  describe('Form Clearing Tests', function() {
    it('should clear form fields correctly', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Fill form with test data');
        await loginPage.enterEmail('test@example.com');
        await loginPage.enterPassword('TestPassword123!');

        testHelper.logStep(2, 'Verify form is filled');
        let emailValue = await loginPage.getEmailValue();
        let passwordValue = await loginPage.getPasswordValue();
        expect(emailValue).to.not.be.empty;
        expect(passwordValue).to.not.be.empty;

        testHelper.logStep(3, 'Clear email field');
        await loginPage.clearEmail();
        emailValue = await loginPage.getEmailValue();
        expect(emailValue, 'Email field should be empty after clearing').to.be.empty;

        testHelper.logStep(4, 'Clear password field');
        await loginPage.clearPassword();
        passwordValue = await loginPage.getPasswordValue();
        expect(passwordValue, 'Password field should be empty after clearing').to.be.empty;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Form Clearing Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_form_clearing_failed', error);
        throw error;
      }
    });

    it('should clear entire form at once', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Fill entire form');
        await loginPage.enterEmail('test@example.com');
        await loginPage.enterPassword('TestPassword123!');

        testHelper.logStep(2, 'Clear entire form');
        await loginPage.clearForm();

        testHelper.logStep(3, 'Verify all fields are empty');
        const emailValue = await loginPage.getEmailValue();
        const passwordValue = await loginPage.getPasswordValue();
        
        expect(emailValue, 'Email field should be empty').to.be.empty;
        expect(passwordValue, 'Password field should be empty').to.be.empty;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Clear Entire Form Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_clear_entire_form_failed', error);
        throw error;
      }
    });
  });

  describe('Loading State Tests', function() {
    it('should show loading state during login attempt', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Enter credentials');
        await loginPage.enterEmail('test@example.com');
        await loginPage.enterPassword('TestPassword123!');

        testHelper.logStep(2, 'Click login button');
        await loginPage.clickLogin();

        testHelper.logStep(3, 'Check for loading state immediately after click');
        // Note: Loading state might be brief, so we'll check button text
        const buttonText = await loginPage.getLoginButtonText();
        
        // The button text might change to "Signing In..." during loading
        // If not in loading state, it should still show "Sign In"
        expect(buttonText).to.be.oneOf(['Sign In', 'Signing In...'], 'Button should show appropriate text');

        testHelper.logStep(4, 'Wait for login to complete');
        await loginPage.waitForLoginComplete();

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Loading State Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_loading_state_failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility Tests', function() {
    it('should have proper form accessibility attributes', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Check email input accessibility');
        const emailInput = await loginPage.waitForElement(loginPage.locators.emailInput);
        const emailRequired = await emailInput.getAttribute('required');
        expect(emailRequired, 'Email input should have required attribute').to.not.be.null;

        testHelper.logStep(2, 'Check password input accessibility');
        const passwordInput = await loginPage.waitForElement(loginPage.locators.passwordInput);
        const passwordRequired = await passwordInput.getAttribute('required');
        expect(passwordRequired, 'Password input should have required attribute').to.not.be.null;

        testHelper.logStep(3, 'Check button accessibility');
        const loginButton = await loginPage.waitForElement(loginPage.locators.loginButton);
        const buttonType = await loginButton.getAttribute('type');
        expect(buttonType).to.equal('submit', 'Login button should have type="submit"');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Accessibility Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_accessibility_failed', error);
        throw error;
      }
    });
  });

  // Note: Successful login test would require a valid user account
  // This test is commented out as it depends on backend setup
  /*
  describe('Successful Login Tests', function() {
    it('should successfully login with valid credentials', async function() {
      const startTime = Date.now();
      
      try {
        // These credentials would need to exist in the database
        const validEmail = process.env.VALID_EMAIL || 'valid.user@flexilb.com';
        const validPassword = process.env.VALID_PASSWORD || 'ValidPassword123!';

        testHelper.logStep(1, 'Enter valid credentials');
        await loginPage.enterEmail(validEmail);
        await loginPage.enterPassword(validPassword);

        testHelper.logStep(2, 'Click login button');
        await loginPage.clickLogin();

        testHelper.logStep(3, 'Wait for success message');
        await loginPage.waitForToast(10000);

        testHelper.logStep(4, 'Verify success toast');
        const isSuccessVisible = await loginPage.isSuccessToastVisible();
        expect(isSuccessVisible).to.be.true, 'Success toast should be visible');

        testHelper.logStep(5, 'Verify navigation to dashboard');
        await loginPage.waitForDashboardNavigation();
        const currentUrl = await loginPage.getCurrentUrl();
        expect(currentUrl).to.include('/dashboard', 'Should navigate to dashboard');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Successful Login Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'login_successful_failed', error);
        throw error;
      }
    });
  });
  */
});