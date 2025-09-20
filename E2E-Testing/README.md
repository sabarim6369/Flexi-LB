# E2E Testing

This directory contains end-to-end tests for the FlexiLB application using Selenium WebDriver.

## Structure

```
E2E-Testing/
├── package.json              # Dependencies and scripts
├── .env                       # Environment configuration
├── README.md                  # This file
├── tests/                     # Test files
│   ├── auth/                  # Authentication tests
│   │   ├── login.test.js      # Login functionality tests
│   │   └── signup.test.js     # Signup functionality tests
│   └── dashboard/             # Dashboard tests (future)
├── page-objects/              # Page Object Model files
│   ├── LoginPage.js           # Login page object
│   ├── SignupPage.js          # Signup page object
│   └── BasePage.js            # Base page object
├── utils/                     # Utility files
│   ├── WebDriverManager.js    # WebDriver setup and management
│   ├── TestHelper.js          # Common test utilities
│   ├── ScreenshotHelper.js    # Screenshot utilities
│   └── install-drivers.js     # Driver installation script
├── test-data/                 # Test data files
│   ├── users.json             # User test data
│   └── validationMessages.json # Expected validation messages
└── reports/                   # Test reports and screenshots
```

## Prerequisites

1. **Node.js**: Version 16 or higher
2. **Browser Drivers**: Chrome, Firefox, or Safari drivers
3. **Running Application**: 
   - Frontend: Running on http://localhost:5173
   - Backend: Running on http://localhost:3003

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install browser drivers:
   ```bash
   npm run install-drivers
   ```

3. Configure environment variables in `.env` file

## Running Tests

### All Tests
```bash
npm test
```

### Authentication Tests Only
```bash
npm run test:auth
```

### Login Tests Only
```bash
npm run test:login
```

### Signup Tests Only
```bash
npm run test:signup
```

### Headless Mode
```bash
npm run test:headless
```

### Different Browsers
```bash
npm run test:chrome
npm run test:firefox
npm run test:safari
```

### Generate HTML Report
```bash
npm run test:report
```

## Test Coverage

### Login Tests
- ✅ Valid login with correct credentials
- ✅ Invalid login with wrong email
- ✅ Invalid login with wrong password
- ✅ Login with empty fields
- ✅ Login form validation
- ✅ Remember me functionality
- ✅ Forgot password link
- ✅ Navigation to signup page

### Signup Tests
- ✅ Valid signup with all required fields
- ✅ Signup with existing email
- ✅ Password confirmation mismatch
- ✅ Form validation for required fields
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Terms and conditions acceptance
- ✅ Navigation to login page

## Configuration

### Environment Variables
- `BASE_URL`: Frontend application URL
- `API_BASE_URL`: Backend API URL
- `BROWSER`: Browser to use (chrome, firefox, safari)
- `HEADLESS`: Run in headless mode (true/false)
- `TEST_TIMEOUT`: Test timeout in milliseconds
- `TAKE_SCREENSHOTS`: Take screenshots on test completion

### Browser Support
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari (macOS only)
- ✅ Edge

## Best Practices

1. **Page Object Model**: All page interactions are encapsulated in page objects
2. **Wait Strategies**: Proper explicit waits for element interactions
3. **Error Handling**: Comprehensive error handling and reporting
4. **Screenshots**: Automatic screenshots on test failures
5. **Data Driven**: External test data for maintainability
6. **Cross-browser**: Support for multiple browsers

## Troubleshooting

### Common Issues

1. **WebDriver not found**: Run `npm run install-drivers`
2. **Application not running**: Ensure frontend and backend are running
3. **Port conflicts**: Check if ports 5173 and 3003 are available
4. **Browser not launching**: Check browser installation and permissions

### Debug Mode
Set `DEBUG=true` in `.env` for verbose logging.

## Future Enhancements

- [ ] Dashboard functionality tests
- [ ] Load balancer management tests
- [ ] Alert system tests
- [ ] User profile tests
- [ ] Performance testing integration
- [ ] CI/CD pipeline integration
- [ ] Cross-platform testing