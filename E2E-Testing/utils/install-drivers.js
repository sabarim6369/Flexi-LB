import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DriverInstaller {
  constructor() {
    this.drivers = {
      chrome: {
        name: 'ChromeDriver',
        package: 'chromedriver',
        command: 'chromedriver --version'
      },
      firefox: {
        name: 'GeckoDriver',
        package: 'geckodriver',
        command: 'geckodriver --version'
      }
    };
  }

  async installAllDrivers() {
    console.log('🚀 Starting WebDriver installation...\n');
    
    const results = {
      success: [],
      failed: [],
      alreadyInstalled: []
    };

    for (const [browser, config] of Object.entries(this.drivers)) {
      try {
        console.log(`📦 Installing ${config.name}...`);
        
        // Check if driver is already installed
        if (await this.isDriverInstalled(config.command)) {
          console.log(`✅ ${config.name} is already installed`);
          results.alreadyInstalled.push(browser);
          continue;
        }

        // Install the driver
        await this.installDriver(config.package);
        
        // Verify installation
        if (await this.isDriverInstalled(config.command)) {
          console.log(`✅ ${config.name} installed successfully`);
          results.success.push(browser);
        } else {
          console.log(`❌ ${config.name} installation verification failed`);
          results.failed.push(browser);
        }
      } catch (error) {
        console.error(`❌ Failed to install ${config.name}:`, error.message);
        results.failed.push(browser);
      }
      
      console.log(''); // Empty line for readability
    }

    this.printInstallationSummary(results);
    return results;
  }

  async isDriverInstalled(command) {
    try {
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  async installDriver(packageName) {
    try {
      console.log(`   Installing ${packageName}...`);
      execSync(`npm install ${packageName}`, { 
        stdio: 'pipe',
        cwd: path.dirname(__dirname)
      });
    } catch (error) {
      throw new Error(`Failed to install ${packageName}: ${error.message}`);
    }
  }

  printInstallationSummary(results) {
    console.log('='.repeat(60));
    console.log('📊 INSTALLATION SUMMARY');
    console.log('='.repeat(60));
    
    if (results.success.length > 0) {
      console.log(`✅ Successfully installed: ${results.success.join(', ')}`);
    }
    
    if (results.alreadyInstalled.length > 0) {
      console.log(`ℹ️  Already installed: ${results.alreadyInstalled.join(', ')}`);
    }
    
    if (results.failed.length > 0) {
      console.log(`❌ Failed to install: ${results.failed.join(', ')}`);
      console.log('\n⚠️  Please install failed drivers manually:');
      results.failed.forEach(browser => {
        const config = this.drivers[browser];
        console.log(`   npm install ${config.package}`);
      });
    }
    
    console.log('\n🎉 Driver installation process completed!');
    
    if (results.failed.length === 0) {
      console.log('✅ All drivers are ready for testing!');
    }
    
    console.log('='.repeat(60));
  }

  async checkSystemRequirements() {
    console.log('🔍 Checking system requirements...\n');
    
    const requirements = {
      node: { command: 'node --version', min: '16.0.0' },
      npm: { command: 'npm --version', min: '8.0.0' },
      chrome: { command: 'google-chrome --version || chrome --version', optional: true },
      firefox: { command: 'firefox --version', optional: true }
    };

    const results = {};

    for (const [name, config] of Object.entries(requirements)) {
      try {
        const output = execSync(config.command, { encoding: 'utf8', stdio: 'pipe' });
        const version = this.extractVersion(output);
        
        results[name] = {
          installed: true,
          version: version,
          meets_requirements: config.min ? this.compareVersions(version, config.min) >= 0 : true
        };
        
        const status = results[name].meets_requirements ? '✅' : '⚠️';
        console.log(`${status} ${name}: ${version} ${config.min ? `(min: ${config.min})` : ''}`);
      } catch (error) {
        results[name] = {
          installed: false,
          version: null,
          meets_requirements: false
        };
        
        const status = config.optional ? '⚠️' : '❌';
        console.log(`${status} ${name}: Not installed ${config.optional ? '(optional)' : '(required)'}`);
      }
    }

    console.log(''); // Empty line for readability
    return results;
  }

  extractVersion(output) {
    const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : 'Unknown';
  }

  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  async createInstallationGuide() {
    const guidePath = path.join(path.dirname(__dirname), 'DRIVER_INSTALLATION_GUIDE.md');
    
    const guide = `# WebDriver Installation Guide

## Automatic Installation

Run the following command to install all required drivers:

\`\`\`bash
npm run install-drivers
\`\`\`

## Manual Installation

If automatic installation fails, you can install drivers manually:

### Chrome Driver
\`\`\`bash
npm install chromedriver
\`\`\`

### Firefox Driver (GeckoDriver)
\`\`\`bash
npm install geckodriver
\`\`\`

## System Requirements

### Required
- Node.js >= 16.0.0
- npm >= 8.0.0

### Browsers (at least one required)
- Google Chrome (latest version recommended)
- Mozilla Firefox (latest version recommended)
- Safari (macOS only)

## Verification

After installation, verify drivers are working:

### Chrome
\`\`\`bash
npx chromedriver --version
\`\`\`

### Firefox
\`\`\`bash
npx geckodriver --version
\`\`\`

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Run terminal as administrator (Windows)
   - Use \`sudo\` prefix (macOS/Linux)

2. **Path Issues**
   - Ensure drivers are in system PATH
   - Restart terminal after installation

3. **Version Conflicts**
   - Update browser to latest version
   - Reinstall corresponding driver

4. **Network Issues**
   - Check internet connection
   - Try again or use VPN if blocked

### Getting Help

If you encounter issues:
1. Check the error messages carefully
2. Ensure your browser is updated
3. Try reinstalling the specific driver
4. Check project documentation

## Platform-Specific Notes

### Windows
- May require Visual Studio Build Tools
- Ensure Windows Defender doesn't block downloads

### macOS
- May require Xcode Command Line Tools
- Allow driver execution in Security & Privacy settings

### Linux
- Install browser packages from official repositories
- Ensure X11 forwarding for GUI tests

## Environment Setup

Create a \`.env\` file with appropriate settings:

\`\`\`env
BROWSER=chrome
HEADLESS=false
WINDOW_WIDTH=1920
WINDOW_HEIGHT=1080
\`\`\`

## Next Steps

After successful installation:
1. Run system requirements check
2. Execute a sample test
3. Configure your testing environment
4. Start writing your test cases

Happy testing! 🚀
`;

    await fs.writeFile(guidePath, guide);
    console.log(`📖 Installation guide created: ${path.basename(guidePath)}`);
    
    return guidePath;
  }
}

// Main execution
async function main() {
  const installer = new DriverInstaller();
  
  try {
    // Check system requirements first
    const requirements = await installer.checkSystemRequirements();
    
    // Check if basic requirements are met
    const hasNode = requirements.node?.meets_requirements;
    const hasNpm = requirements.npm?.meets_requirements;
    
    if (!hasNode || !hasNpm) {
      console.error('❌ System requirements not met. Please install/update Node.js and npm.');
      process.exit(1);
    }
    
    // Install drivers
    const results = await installer.installAllDrivers();
    
    // Create installation guide
    await installer.createInstallationGuide();
    
    // Exit with appropriate code
    const hasFailures = results.failed.length > 0;
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DriverInstaller;