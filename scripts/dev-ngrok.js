#!/usr/bin/env node

/**
 * Script to start Next.js dev server with ngrok and open browser
 *
 * Usage: pnpm dev:ngrok
 */

const { execFile, spawn } = require('child_process');
const http = require('http');
const { promisify } = require('util');
const {
  getDevServerCommand,
  openBrowser,
  validateNgrokPublicUrl,
} = require('./dev-ngrok-utils');
const execFileAsync = promisify(execFile);

const PORT = 3500;
const NGROK_API_URL = 'http://127.0.0.1:4040/api/tunnels';

// Check if ngrok is installed
async function checkNgrokInstalled() {
  try {
    await execFileAsync('ngrok', ['version'], {
      shell: false,
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

// Wait for server to be ready
function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkServer = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          resolve();
        } else {
          if (Date.now() - startTime > timeout) {
            reject(new Error('Server timeout'));
          } else {
            setTimeout(checkServer, 500);
          }
        }
      }).on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('Server timeout'));
        } else {
          setTimeout(checkServer, 500);
        }
      });
    };
    checkServer();
  });
}

// Get ngrok URL from ngrok API
function getNgrokUrl(retries = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryGetUrl = () => {
      attempts++;
      http.get(NGROK_API_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const tunnel = json.tunnels?.find(t => t.proto === 'https');
            if (tunnel) {
              resolve(validateNgrokPublicUrl(tunnel.public_url));
            } else if (attempts < retries) {
              setTimeout(tryGetUrl, 1000);
            } else {
              reject(new Error('Could not find HTTPS tunnel'));
            }
          } catch (error) {
            if (attempts < retries) {
              setTimeout(tryGetUrl, 1000);
            } else {
              reject(error);
            }
          }
        });
      }).on('error', (error) => {
        if (attempts < retries) {
          setTimeout(tryGetUrl, 1000);
        } else {
          reject(error);
        }
      });
    };
    tryGetUrl();
  });
}

function startDevServer({
  spawnImpl = spawn,
  platform = process.platform,
  nodePath = process.execPath,
  packageManagerScript = process.env.npm_execpath,
  commandInterpreter = process.env.ComSpec,
  cwd = __dirname + '/..',
} = {}) {
  const devServerCommand = getDevServerCommand(platform, {
    nodePath,
    packageManagerScript,
    commandInterpreter,
  });

  return spawnImpl(devServerCommand.command, devServerCommand.args, {
    stdio: 'inherit',
    shell: false,
    cwd,
  });
}

function startNgrok({ spawnImpl = spawn, port = PORT } = {}) {
  return spawnImpl('ngrok', ['http', port.toString()], {
    stdio: 'pipe',
    shell: false,
  });
}

async function main() {
  console.log('🚀 Starting Next.js dev server...');

  // Start Next.js dev server
  const nextProcess = startDevServer();

  // Wait for server to be ready
  try {
    console.log(`⏳ Waiting for server to start on port ${PORT}...`);
    await waitForServer(`http://localhost:${PORT}`);
    console.log('✅ Server is ready!');
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    nextProcess.kill();
    process.exit(1);
  }

  // Check if ngrok is installed
  const ngrokInstalled = await checkNgrokInstalled();
  if (!ngrokInstalled) {
    console.log('\n⚠️  ngrok is not installed. Please install it:');
    console.log('   brew install ngrok/ngrok/ngrok  (macOS)');
    console.log('   or download from https://ngrok.com/download\n');
    console.log(`📝 Server running at http://localhost:${PORT}`);
    console.log('   Start ngrok manually: ngrok http 3500');
    return;
  }

  // Start ngrok
  console.log('\n🔗 Starting ngrok tunnel...');
  const ngrokProcess = startNgrok();

  // Capture ngrok output for debugging
  ngrokProcess.stdout.on('data', (data) => {
    const output = data.toString();
    // ngrok prints connection info to stderr, but we'll get URL from API
  });

  ngrokProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('started tunnel') || output.includes('Session Status')) {
      // ngrok is starting up
    }
  });

  // Wait a bit for ngrok to start, then get URL
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const ngrokUrl = await getNgrokUrl();
    console.log(`\n✅ ngrok tunnel active!`);
    console.log(`🌐 Public URL: ${ngrokUrl}`);
    console.log(`📝 Local URL: http://localhost:${PORT}`);

    // Open browser
    openBrowser(ngrokUrl);

    console.log('\n💡 Press Ctrl+C to stop both servers\n');
  } catch (error) {
    console.error('❌ Failed to get ngrok URL:', error.message);
    console.log(`📝 Server running at http://localhost:${PORT}`);
    console.log('   Check ngrok status at http://127.0.0.1:4040');
  }

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    nextProcess.kill();
    ngrokProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    nextProcess.kill();
    ngrokProcess.kill();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = {
  checkNgrokInstalled,
  getNgrokUrl,
  main,
  startDevServer,
  startNgrok,
  waitForServer,
};
