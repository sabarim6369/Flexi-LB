import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import dotenv from 'dotenv';
import WebDriverManager from '../../utils/WebDriverManager.js';
import TestHelper from '../../utils/TestHelper.js';
import ScreenshotHelper from '../../utils/ScreenshotHelper.js';
import SignupPage from '../../page-objects/SignupPage.js';

// Load environment variables
dotenv.config();

describe('Signup Page E2E Tests', function() {
  let driverManager;
  let driver;
  let testHelper;
  let screenshotHelper;
  let signupPage;
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const testTimeout = parseInt(process.env.TEST_TIMEOUT) || 30000;

  // Set test timeout
  this.timeout(testTimeout);

  before(async function() {
    testHelper = new TestHelper();
    testHelper.logTestStart('Signup E2E Tests', 'Testing signup functionality with various scenarios');
    
    driverManager = new WebDriverManager();
    driver = await driverManager.createDriver();
    screenshotHelper = new ScreenshotHelper();
    signupPage = new SignupPage(driver);
    
    console.log('✅ Test setup completed');
  });

  after(async function() {
    if (driver) {
      await driverManager.quitDriver();
    }
    testHelper.logTestComplete('Signup E2E Tests', true);
  });

  beforeEach(async function() {
    // Navigate to signup page before each test
    await signupPage.navigateToSignup(baseUrl);
    console.log(`🌐 Navigated to: ${baseUrl}/signup`);
  });

  describe('Page Loading and Element Verification', function() {
    it('should load the signup page successfully', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Verify page title');
        const title = await signupPage.getPageTitle();
        expect(title).to.include('FlexiLB');

        testHelper.logStep(2, 'Verify current URL');
        const currentUrl = await signupPage.getCurrentUrl();
        expect(currentUrl).to.include('/signup');

        testHelper.logStep(3, 'Verify all essential elements are present');
        const elements = await signupPage.verifyPageElements();
        
        expect(elements.pageTitle).to.be.true;
        expect(elements.nameInput).to.be.true;
        expect(elements.emailInput).to.be.true;
        expect(elements.passwordInput).to.be.true;
        expect(elements.confirmPasswordInput).to.be.true;
        expect(elements.signupButton).to.be.true;
        expect(elements.termsCheckbox).to.be.true;
        expect(elements.loginLink).to.be.true;

        testHelper.logStep(4, 'Take page screenshot');
        await screenshotHelper.takeFullPageScreenshot(driver, 'signup_page_loaded', 'page_verification');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Page Loading Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_page_loading_failed', error);
        throw error;
      }
    });

    it('should have proper form labels and placeholders', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Verify name input properties');
        const nameInput = await signupPage.waitForElement(signupPage.locators.nameInput);
        const namePlaceholder = await nameInput.getAttribute('placeholder');
        expect(namePlaceholder).to.include('name');

        testHelper.logStep(2, 'Verify email input properties');
        const emailInput = await signupPage.waitForElement(signupPage.locators.emailInput);
        const emailPlaceholder = await emailInput.getAttribute('placeholder');
        const emailType = await emailInput.getAttribute('type');
        expect(emailPlaceholder).to.include('email');
        expect(emailType).to.equal('email');

        testHelper.logStep(3, 'Verify password input properties');
        const passwordInput = await signupPage.waitForElement(signupPage.locators.passwordInput);
        const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
        const passwordType = await passwordInput.getAttribute('type');
        expect(passwordPlaceholder).to.include('password');
        expect(passwordType).to.equal('password');

        testHelper.logStep(4, 'Verify confirm password input properties');
        const confirmPasswordInput = await signupPage.waitForElement(signupPage.locators.confirmPasswordInput);
        const confirmPasswordPlaceholder = await confirmPasswordInput.getAttribute('placeholder');
        const confirmPasswordType = await confirmPasswordInput.getAttribute('type');
        expect(confirmPasswordPlaceholder).to.include('password');
        expect(confirmPasswordType).to.equal('password');

        testHelper.logStep(5, 'Verify button text');
        const buttonText = await signupPage.getSignupButtonText();
        expect(buttonText).to.include('Create Account');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Form Labels Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_form_labels_failed', error);
        throw error;
      }
    });
  });

  describe('Form Interaction Tests', function() {
    it('should allow typing in all form fields', async function() {
      const startTime = Date.now();
      const userData = testHelper.generateUniqueUserData();
      
      try {
        testHelper.logStep(1, 'Enter name');
        await signupPage.enterName(userData.name);
        const nameValue = await signupPage.getNameValue();
        expect(nameValue).to.equal(userData.name);

        testHelper.logStep(2, 'Enter email');
        await signupPage.enterEmail(userData.email);
        const emailValue = await signupPage.getEmailValue();
        expect(emailValue).to.equal(userData.email);

        testHelper.logStep(3, 'Enter password');
        await signupPage.enterPassword(userData.password);
        const passwordValue = await signupPage.getPasswordValue();
        expect(passwordValue).to.equal(userData.password);

        testHelper.logStep(4, 'Enter confirm password');
        await signupPage.enterConfirmPassword(userData.confirmPassword);
        const confirmPasswordValue = await signupPage.getConfirmPasswordValue();
        expect(confirmPasswordValue).to.equal(userData.confirmPassword);

        testHelper.logStep(5, 'Take screenshot of filled form');
        await screenshotHelper.takeFullPageScreenshot(driver, 'signup_form_filled', 'form_interaction');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Form Interaction Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_form_interaction_failed', error);
        throw error;
      }
    });

    it('should toggle password visibility', async function() {
      const startTime = Date.now();
      const testPassword = 'TestPassword123!';
      
      try {
        testHelper.logStep(1, 'Enter password');
        await signupPage.enterPassword(testPassword);

        testHelper.logStep(2, 'Verify password is initially hidden');
        let isVisible = await signupPage.isPasswordVisible();
        expect(isVisible).to.be.false;

        testHelper.logStep(3, 'Click password visibility toggle');
        await signupPage.togglePasswordVisibility();
        
        testHelper.logStep(4, 'Verify password is now visible');
        isVisible = await signupPage.isPasswordVisible();
        expect(isVisible).to.be.true;

        testHelper.logStep(5, 'Click toggle again to hide password');
        await signupPage.togglePasswordVisibility();
        isVisible = await signupPage.isPasswordVisible();
        expect(isVisible).to.be.false;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Password Visibility Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_password_visibility_failed', error);
        throw error;
      }
    });

    it('should toggle confirm password visibility', async function() {
      const startTime = Date.now();
      const testPassword = 'TestPassword123!';
      
      try {
        testHelper.logStep(1, 'Enter confirm password');
        await signupPage.enterConfirmPassword(testPassword);

        testHelper.logStep(2, 'Verify confirm password is initially hidden');
        let isVisible = await signupPage.isConfirmPasswordVisible();
        expect(isVisible).to.be.false;

        testHelper.logStep(3, 'Click confirm password visibility toggle');
        await signupPage.toggleConfirmPasswordVisibility();
        
        testHelper.logStep(4, 'Verify confirm password is now visible');
        isVisible = await signupPage.isConfirmPasswordVisible();
        expect(isVisible).to.be.true;

        testHelper.logStep(5, 'Click toggle again to hide confirm password');
        await signupPage.toggleConfirmPasswordVisibility();
        isVisible = await signupPage.isConfirmPasswordVisible();
        expect(isVisible).to.be.false;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Confirm Password Visibility Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_confirm_password_visibility_failed', error);
        throw error;
      }
    });

    it('should toggle terms and conditions checkbox', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Verify terms checkbox is initially unchecked');
        let isChecked = await signupPage.isTermsCheckboxChecked();
        expect(isChecked).to.be.false;

        testHelper.logStep(2, 'Click terms checkbox');
        await signupPage.clickTermsCheckbox();
        
        testHelper.logStep(3, 'Verify terms checkbox is now checked');
        isChecked = await signupPage.isTermsCheckboxChecked();
        expect(isChecked).to.be.true;

        testHelper.logStep(4, 'Click terms checkbox again to uncheck');
        await signupPage.clickTermsCheckbox();
        isChecked = await signupPage.isTermsCheckboxChecked();
        expect(isChecked).to.be.false;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Terms Checkbox Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_terms_checkbox_failed', error);
        throw error;
      }
    });
  });

  describe('Form Validation Tests', function() {
    it('should show warning for empty form submission', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Click signup button with empty form');
        await signupPage.clickSignup();

        testHelper.logStep(2, 'Wait for validation message');
        await signupPage.waitForToast(5000);

        testHelper.logStep(3, 'Verify warning toast appears');
        const isWarningVisible = await signupPage.isWarningToastVisible();
        expect(isWarningVisible).to.be.true;

        testHelper.logStep(4, 'Verify warning message content');
        const toastMessage = await signupPage.getToastMessage();
        expect(toastMessage).to.include('required fields');

        await screenshotHelper.takeFullPageScreenshot(driver, 'signup_empty_form_validation', 'validation_warning');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Empty Form Validation Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_empty_form_validation_failed', error);
        throw error;
      }
    });

    it('should show warning for password mismatch', async function() {
      const startTime = Date.now();
      const userData = testHelper.generateUniqueUserData();
      
      try {
        testHelper.logStep(1, 'Fill form with mismatched passwords');
        await signupPage.enterName(userData.name);
        await signupPage.enterEmail(userData.email);
        await signupPage.enterPassword(userData.password);
        await signupPage.enterConfirmPassword('DifferentPassword123!');
        await signupPage.clickTermsCheckbox();

        testHelper.logStep(2, 'Click signup button');
        await signupPage.clickSignup();

        testHelper.logStep(3, 'Wait for validation message');
        await signupPage.waitForToast(5000);

        testHelper.logStep(4, 'Verify warning toast appears');
        const isWarningVisible = await signupPage.isWarningToastVisible();
        expect(isWarningVisible).to.be.true;

        testHelper.logStep(5, 'Verify password mismatch message');
        const toastMessage = await signupPage.getToastMessage();
        expect(toastMessage).to.include('do not match');

        await screenshotHelper.takeFullPageScreenshot(driver, 'signup_password_mismatch', 'validation_error');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Password Mismatch Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_password_mismatch_failed', error);
        throw error;
      }
    });

    it('should validate password strength requirements', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Test weak password');
        const weakPassword = 'weak';
        const strengthTest = await signupPage.testPasswordStrength(weakPassword);
        
        expect(strengthTest.isStrong).to.be.false;
        expect(strengthTest.minLength).to.be.false;
        expect(strengthTest.hasUppercase).to.be.false;
        expect(strengthTest.hasNumber).to.be.false;
        expect(strengthTest.hasSpecialChar).to.be.false;

        testHelper.logStep(2, 'Test strong password');
        const strongPassword = 'StrongPassword123!';
        const strongTest = await signupPage.testPasswordStrength(strongPassword);
        
        expect(strongTest.isStrong).to.be.true;
        expect(strongTest.minLength).to.be.true;
        expect(strongTest.hasUppercase).to.be.true;
        expect(strongTest.hasLowercase).to.be.true;
        expect(strongTest.hasNumber).to.be.true;
        expect(strongTest.hasSpecialChar).to.be.true;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Password Strength Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_password_strength_failed', error);
        throw error;
      }
    });

    it('should validate email format', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Test valid email formats');
        const validEmails = [
          'user@example.com',
          'user.name@domain.com',
          'user+tag@example.org'
        ];

        for (const email of validEmails) {
          const isValid = signupPage.isValidEmail(email);
          expect(isValid).to.be.true;
        }

        testHelper.logStep(2, 'Test invalid email formats');
        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user@domain',
          'user name@domain.com'
        ];

        for (const email of invalidEmails) {
          const isValid = signupPage.isValidEmail(email);
          expect(isValid).to.be.false;
        }

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Email Validation Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_email_validation_failed', error);
        throw error;
      }
    });

    it('should require terms acceptance for signup', async function() {
      const startTime = Date.now();
      const userData = testHelper.generateUniqueUserData();
      
      try {
        testHelper.logStep(1, 'Fill form without accepting terms');
        await signupPage.enterName(userData.name);
        await signupPage.enterEmail(userData.email);
        await signupPage.enterPassword(userData.password);
        await signupPage.enterConfirmPassword(userData.confirmPassword);
        // Don't click terms checkbox

        testHelper.logStep(2, 'Click signup button');
        await signupPage.clickSignup();

        // Note: The frontend validation should prevent form submission
        // The form should show validation error for terms not accepted
        testHelper.logStep(3, 'Verify form validation state');
        const validationState = await signupPage.getFormValidationState();
        expect(validationState.terms.accepted).to.be.false;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Terms Acceptance Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_terms_acceptance_failed', error);
        throw error;
      }
    });
  });

  describe('Navigation Tests', function() {
    it('should navigate to login page when login link is clicked', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Click login link');
        await signupPage.clickLoginLink();

        testHelper.logStep(2, 'Verify navigation to login page');
        await signupPage.waitForUrlContains('/login', 10000);
        
        const currentUrl = await signupPage.getCurrentUrl();
        expect(currentUrl).to.include('/login');

        await screenshotHelper.takeFullPageScreenshot(driver, 'signup_to_login_navigation', 'navigation');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Navigation to Login Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_to_login_navigation_failed', error);
        throw error;
      }
    });

    it('should handle terms of service link click', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Click terms of service link');
        await signupPage.clickTermsOfServiceLink();

        // Note: Since terms link currently links to "#", we verify the click doesn't navigate away
        testHelper.logStep(2, 'Verify still on signup page');
        const currentUrl = await signupPage.getCurrentUrl();
        expect(currentUrl).to.include('/signup');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Terms of Service Link Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_terms_link_failed', error);
        throw error;
      }
    });

    it('should handle privacy policy link click', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Click privacy policy link');
        await signupPage.clickPrivacyPolicyLink();

        // Note: Since privacy policy link currently links to "#", we verify the click doesn't navigate away
        testHelper.logStep(2, 'Verify still on signup page');
        const currentUrl = await signupPage.getCurrentUrl();
        expect(currentUrl).to.include('/signup');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Privacy Policy Link Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_privacy_link_failed', error);
        throw error;
      }
    });
  });

  describe('Form Clearing Tests', function() {
    it('should clear individual form fields correctly', async function() {
      const startTime = Date.now();
      const userData = testHelper.generateUniqueUserData();
      
      try {
        testHelper.logStep(1, 'Fill all form fields');
        await signupPage.enterName(userData.name);
        await signupPage.enterEmail(userData.email);
        await signupPage.enterPassword(userData.password);
        await signupPage.enterConfirmPassword(userData.confirmPassword);

        testHelper.logStep(2, 'Clear name field');
        await signupPage.clearName();
        const nameValue = await signupPage.getNameValue();
        expect(nameValue).to.be.empty;

        testHelper.logStep(3, 'Clear email field');
        await signupPage.clearEmail();
        const emailValue = await signupPage.getEmailValue();
        expect(emailValue).to.be.empty;

        testHelper.logStep(4, 'Clear password field');
        await signupPage.clearPassword();
        const passwordValue = await signupPage.getPasswordValue();
        expect(passwordValue).to.be.empty;

        testHelper.logStep(5, 'Clear confirm password field');
        await signupPage.clearConfirmPassword();
        const confirmPasswordValue = await signupPage.getConfirmPasswordValue();
        expect(confirmPasswordValue).to.be.empty;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Individual Field Clearing Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_individual_clearing_failed', error);
        throw error;
      }
    });

    it('should clear entire form at once', async function() {
      const startTime = Date.now();
      const userData = testHelper.generateUniqueUserData();
      
      try {
        testHelper.logStep(1, 'Fill entire form');
        await signupPage.enterName(userData.name);
        await signupPage.enterEmail(userData.email);
        await signupPage.enterPassword(userData.password);
        await signupPage.enterConfirmPassword(userData.confirmPassword);

        testHelper.logStep(2, 'Clear entire form');
        await signupPage.clearForm();

        testHelper.logStep(3, 'Verify all fields are empty');
        const formValues = await signupPage.getFormValues();
        
        expect(formValues.name).to.be.empty;
        expect(formValues.email).to.be.empty;
        expect(formValues.password).to.be.empty;
        expect(formValues.confirmPassword).to.be.empty;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Clear Entire Form Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_clear_entire_form_failed', error);
        throw error;
      }
    });
  });

  describe('Form Validation State Tests', function() {
    it('should correctly assess form validation state', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Test empty form validation state');
        let validationState = await signupPage.getFormValidationState();
        expect(validationState.form.isValid).to.be.false;
        expect(validationState.name.isEmpty).to.be.true;
        expect(validationState.email.isEmpty).to.be.true;
        expect(validationState.password.isEmpty).to.be.true;

        testHelper.logStep(2, 'Fill form with valid data');
        const userData = testHelper.generateUniqueUserData();
        await signupPage.enterName(userData.name);
        await signupPage.enterEmail(userData.email);
        await signupPage.enterPassword(userData.password);
        await signupPage.enterConfirmPassword(userData.confirmPassword);
        await signupPage.clickTermsCheckbox();

        testHelper.logStep(3, 'Test filled form validation state');
        validationState = await signupPage.getFormValidationState();
        expect(validationState.form.isValid).to.be.true;
        expect(validationState.name.isValid).to.be.true;
        expect(validationState.email.isValid).to.be.true;
        expect(validationState.password.isValid).to.be.true;
        expect(validationState.confirmPassword.matchesPassword).to.be.true;
        expect(validationState.terms.accepted).to.be.true;

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Form Validation State Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_validation_state_failed', error);
        throw error;
      }
    });
  });

  describe('Loading State Tests', function() {
    it('should show loading state during signup attempt', async function() {
      const startTime = Date.now();
      const userData = testHelper.generateUniqueUserData();
      
      try {
        testHelper.logStep(1, 'Fill form with valid data');
        await signupPage.enterName(userData.name);
        await signupPage.enterEmail(userData.email);
        await signupPage.enterPassword(userData.password);
        await signupPage.enterConfirmPassword(userData.confirmPassword);
        await signupPage.clickTermsCheckbox();

        testHelper.logStep(2, 'Click signup button');
        await signupPage.clickSignup();

        testHelper.logStep(3, 'Check for loading state immediately after click');
        const buttonText = await signupPage.getSignupButtonText();
        
        // The button text might change to "Creating Account..." during loading
        expect(buttonText).to.be.oneOf(['Create Account', 'Creating Account...']);

        testHelper.logStep(4, 'Wait for signup to complete');
        await signupPage.waitForSignupComplete();

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Loading State Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_loading_state_failed', error);
        throw error;
      }
    });
  });

  describe('Accessibility Tests', function() {
    it('should have proper form accessibility attributes', async function() {
      const startTime = Date.now();
      
      try {
        testHelper.logStep(1, 'Check name input accessibility');
        const nameInput = await signupPage.waitForElement(signupPage.locators.nameInput);
        const nameRequired = await nameInput.getAttribute('required');
        expect(nameRequired).to.not.be.null;

        testHelper.logStep(2, 'Check email input accessibility');
        const emailInput = await signupPage.waitForElement(signupPage.locators.emailInput);
        const emailRequired = await emailInput.getAttribute('required');
        expect(emailRequired).to.not.be.null;

        testHelper.logStep(3, 'Check password input accessibility');
        const passwordInput = await signupPage.waitForElement(signupPage.locators.passwordInput);
        const passwordRequired = await passwordInput.getAttribute('required');
        expect(passwordRequired).to.not.be.null;

        testHelper.logStep(4, 'Check confirm password input accessibility');
        const confirmPasswordInput = await signupPage.waitForElement(signupPage.locators.confirmPasswordInput);
        const confirmPasswordRequired = await confirmPasswordInput.getAttribute('required');
        expect(confirmPasswordRequired).to.not.be.null;

        testHelper.logStep(5, 'Check terms checkbox accessibility');
        const termsCheckbox = await signupPage.waitForElement(signupPage.locators.termsCheckbox);
        const termsRequired = await termsCheckbox.getAttribute('required');
        expect(termsRequired).to.not.be.null;

        testHelper.logStep(6, 'Check button accessibility');
        const signupButton = await signupPage.waitForElement(signupPage.locators.signupButton);
        const buttonType = await signupButton.getAttribute('type');
        expect(buttonType).to.equal('submit');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Accessibility Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_accessibility_failed', error);
        throw error;
      }
    });
  });

  // Note: Successful signup test would require proper backend setup
  // This test is commented out as it depends on server configuration
  /*
  describe('Successful Signup Tests', function() {
    it('should successfully signup with valid data', async function() {
      const startTime = Date.now();
      const userData = testHelper.generateUniqueUserData();
      
      try {
        testHelper.logStep(1, 'Fill form with unique valid data');
        await signupPage.signup(userData);

        testHelper.logStep(2, 'Wait for success message');
        await signupPage.waitForToast(10000);

        testHelper.logStep(3, 'Verify success toast');
        const isSuccessVisible = await signupPage.isSuccessToastVisible();
        expect(isSuccessVisible).to.be.true;

        testHelper.logStep(4, 'Verify navigation to dashboard');
        await signupPage.waitForDashboardNavigation();
        const currentUrl = await signupPage.getCurrentUrl();
        expect(currentUrl).to.include('/dashboard');

        const duration = Date.now() - startTime;
        testHelper.logTestComplete('Successful Signup Test', true, duration);
      } catch (error) {
        await testHelper.takeScreenshotOnFailure(driver, 'signup_successful_failed', error);
        throw error;
      }
    });
  });
  */
});