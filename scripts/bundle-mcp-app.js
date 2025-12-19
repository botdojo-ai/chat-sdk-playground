/**
 * Bundle an MCP App React component into a single HTML file.
 * 
 * Usage:
 *   node scripts/bundle-mcp-app.js <input-file> [output-file]
 *   node scripts/bundle-mcp-app.js --watch <input-file> [output-file]
 * 
 * Example:
 *   node scripts/bundle-mcp-app.js pages/examples/chat-sdk/mcp-app-example/canvas/remote-url-app.tsx
 *   node scripts/bundle-mcp-app.js --watch pages/examples/chat-sdk/mcp-app-example/canvas/remote-url-app.tsx
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Parse arguments
const rawArgs = process.argv.slice(2);
const watchMode = rawArgs.includes('--watch') || rawArgs.includes('-w');
const args = rawArgs.filter(arg => arg !== '--watch' && arg !== '-w');

if (args.length === 0) {
  console.log(`
Usage: node scripts/bundle-mcp-app.js [--watch] <input-file> [output-file]

Options:
  --watch, -w    Watch for changes and rebuild automatically

Example:
  node scripts/bundle-mcp-app.js pages/examples/chat-sdk/mcp-app-example/canvas/remote-url-app.tsx
  node scripts/bundle-mcp-app.js --watch pages/examples/chat-sdk/mcp-app-example/canvas/remote-url-app.tsx
`);
  process.exit(1);
}

const inputFile = args[0];
const inputBasename = path.basename(inputFile, path.extname(inputFile));
const outputFile = args[1] || `dist/${inputBasename}.html`;
const inputDir = path.dirname(inputFile);

// Ensure input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  process.exit(1);
}

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Find @botdojo/chat-sdk package location (handles pnpm, npm, yarn)
// Prefer workspace version (monorepo) over node_modules to get latest bundled version
function findChatSdk() {
  const possiblePaths = [
    // Workspace package (monorepo) - CHECK FIRST to get bundled version
    path.resolve(__dirname, '../../../packages-opensource/sdk-chat'),
    // Standalone repo (npm/yarn)
    path.resolve(__dirname, '../node_modules/@botdojo/chat-sdk'),
    // Monorepo root
    path.resolve(__dirname, '../../../node_modules/@botdojo/chat-sdk'),
    // pnpm store (monorepo)
    path.resolve(__dirname, '../../../node_modules/.pnpm'),
  ];
  
  for (const basePath of possiblePaths) {
    // Check direct location
    if (fs.existsSync(basePath) && fs.existsSync(path.join(basePath, 'package.json'))) {
      return basePath;
    }
    
    // Check pnpm store structure
    if (basePath.includes('.pnpm')) {
      const pnpmDirs = fs.existsSync(basePath) ? fs.readdirSync(basePath).filter(d => d.includes('@botdojo+chat-sdk@')) : [];
      if (pnpmDirs.length > 0) {
        const pnpmPath = path.join(basePath, pnpmDirs[0], 'node_modules/@botdojo/chat-sdk');
        if (fs.existsSync(pnpmPath)) {
          return pnpmPath;
        }
      }
    }
  }
  
  return null;
}

async function bundle() {
  const startTime = Date.now();
  
  // Find @botdojo/chat-sdk location
  const chatSdkPath = findChatSdk();
  if (!chatSdkPath) {
    console.error('Error: Could not find @botdojo/chat-sdk package');
    console.error('  Make sure @botdojo/chat-sdk is installed: npm install @botdojo/chat-sdk');
    process.exit(1);
  }
  
  // Create a wrapper that exports React and ReactDOM along with the component
  const wrapperCode = `
import React from 'react';
import ReactDOM from 'react-dom/client';
export { React, ReactDOM };
export { default } from '${path.resolve(inputFile).replace(/\\/g, '/')}';
`;

  // Use unique wrapper file name to avoid race conditions when running concurrently
  const wrapperFile = path.join(outputDir, `_bundle-wrapper-${inputBasename}.tsx`);
  fs.writeFileSync(wrapperFile, wrapperCode);

  try {
    // Build nodePaths array
    const nodePaths = [
      path.resolve(__dirname, '../node_modules'),
      path.resolve(__dirname, '../../node_modules'),
      path.resolve(__dirname, '../../../node_modules'),
      path.resolve(__dirname, '../../../../node_modules')
    ];
    
    // Add @botdojo/chat-sdk's node_modules if it exists
    const chatSdkNodeModules = path.join(chatSdkPath, 'node_modules');
    if (fs.existsSync(chatSdkNodeModules)) {
      nodePaths.push(chatSdkNodeModules);
    }
    
    // Bundle the wrapper which includes React, ReactDOM, and the component
    const result = await esbuild.build({
      entryPoints: [wrapperFile],
      bundle: true,
      minify: true,
      format: 'iife',
      globalName: 'McpAppBundle',
      write: false,
      jsx: 'automatic',
      loader: { 
        '.tsx': 'tsx', 
        '.ts': 'ts',
        '.js': 'js',
        '.jsx': 'jsx',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      // Bundle everything including React, ReactDOM and @botdojo/chat-sdk
      external: [],
      // Resolve from node_modules (ensure @botdojo/chat-sdk can be found)
      nodePaths: nodePaths,
      // Add resolve plugin to handle @botdojo/chat-sdk/mcp-app-view/react export
      // and resolve internal mcp-app-view imports
      plugins: [{
        name: 'resolve-chat-sdk-mcp-app-view',
        setup(build) {
          // Resolve @botdojo/chat-sdk/mcp-app-view/react to the bundled version
          build.onResolve({ filter: /^@botdojo\/chat-sdk\/mcp-app-view\/react$/ }, (args) => {
            // Prefer lib (built) version, fall back to source in monorepo
            const resolvedPath = path.join(chatSdkPath, 'lib/mcp-app-view/react.js');
            if (fs.existsSync(resolvedPath)) {
              return { path: resolvedPath };
            }
            // Try source location (monorepo dev)
            const srcPath = path.join(chatSdkPath, 'src/mcp-app-view/react.ts');
            if (fs.existsSync(srcPath)) {
              return { path: srcPath };
            }
            return null;
          });
          
          // Resolve @botdojo/chat-sdk/mcp-app-view base
          build.onResolve({ filter: /^@botdojo\/chat-sdk\/mcp-app-view$/ }, (args) => {
            const resolvedPath = path.join(chatSdkPath, 'lib/mcp-app-view/index.js');
            if (fs.existsSync(resolvedPath)) {
              return { path: resolvedPath };
            }
            const srcPath = path.join(chatSdkPath, 'src/mcp-app-view/index.ts');
            if (fs.existsSync(srcPath)) {
              return { path: srcPath };
            }
            return null;
          });
          
          // If the bundled version still has re-exports (old npm version), resolve mcp-app-view
          build.onResolve({ filter: /^mcp-app-view\/react$/ }, (args) => {
            // Try to resolve from chat-sdk's node_modules or workspace
            const mcpAppViewPaths = [
              path.join(chatSdkPath, 'node_modules/mcp-app-view'),
              path.resolve(__dirname, '../node_modules/mcp-app-view'),
              path.resolve(__dirname, '../../../node_modules/.pnpm'),
            ];
            
            for (const basePath of mcpAppViewPaths) {
              if (basePath.includes('.pnpm')) {
                if (fs.existsSync(basePath)) {
                  const pnpmDirs = fs.readdirSync(basePath).filter(d => d.startsWith('mcp-app-view@'));
                  if (pnpmDirs.length > 0) {
                    const pnpmPath = path.join(basePath, pnpmDirs[0], 'node_modules/mcp-app-view/dist/react/index.mjs');
                    if (fs.existsSync(pnpmPath)) return { path: pnpmPath };
                    const jsPath = path.join(basePath, pnpmDirs[0], 'node_modules/mcp-app-view/dist/react/index.js');
                    if (fs.existsSync(jsPath)) return { path: jsPath };
                  }
                }
              } else if (fs.existsSync(basePath)) {
                const distPath = path.join(basePath, 'dist/react/index.mjs');
                if (fs.existsSync(distPath)) return { path: distPath };
                const jsPath = path.join(basePath, 'dist/react/index.js');
                if (fs.existsSync(jsPath)) return { path: jsPath };
              }
            }
            
            return null;
          });
          
        }
      }],
      // Platform for browser bundling
      platform: 'browser',
      // Target modern browsers
      target: ['es2020'],
      // Ensure proper module resolution
      mainFields: ['browser', 'module', 'main'],
    });

    // Clean up wrapper file
    fs.unlinkSync(wrapperFile);

    const bundledJs = result.outputFiles[0].text;

    // Create a self-contained HTML file
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MCP App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; }
    body { 
      font-family: Inter, system-ui, -apple-system, sans-serif;
      /* Default dark background for MCP apps - can be overridden by component */
      background-color: #1e293b;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
${bundledJs}

// Mount the app
(function() {
  var React = McpAppBundle.React;
  var ReactDOM = McpAppBundle.ReactDOM;
  var App = McpAppBundle.default;
  
  if (!App) {
    console.error('MCP App: No default export found');
    return;
  }
  
  if (!ReactDOM || !ReactDOM.createRoot) {
    console.error('MCP App: ReactDOM.createRoot not found');
    return;
  }
  
  var root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
})();
  </script>
</body>
</html>`;

    fs.writeFileSync(outputFile, html);
    
    // Also generate a TypeScript file that exports the HTML as a string
    const tsOutputFile = outputFile.replace(/\.html$/, '.ts');
    const escapedHtml = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const tsContent = `// Auto-generated by bundle-mcp-app.js - DO NOT EDIT
// Source: ${inputFile}

export const BUNDLED_MCP_APP_HTML = \`${escapedHtml}\`;

export default BUNDLED_MCP_APP_HTML;
`;
    fs.writeFileSync(tsOutputFile, tsContent);
    
    const stats = fs.statSync(outputFile);
    const sizeKb = (stats.size / 1024).toFixed(1);
    const elapsed = Date.now() - startTime;
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ✓ Built ${sizeKb} KB in ${elapsed}ms → ${outputFile}`);
    
    return true;
  } catch (err) {
    // Clean up wrapper file on error
    if (fs.existsSync(wrapperFile)) {
      fs.unlinkSync(wrapperFile);
    }
    console.error('Build failed:', err.message || err);
    return false;
  }
}

async function main() {
  console.log(`Bundling: ${inputFile}`);
  console.log(`Output:   ${outputFile}`);
  
  // Initial build
  const success = await bundle();
  
  if (!watchMode) {
    if (!success) process.exit(1);
    return;
  }
  
  // Watch mode
  console.log(`\n👀 Watching for changes in ${inputDir}...`);
  console.log('   Press Ctrl+C to stop\n');
  
  let debounceTimer = null;
  let isBuilding = false;
  
  const rebuild = () => {
    if (isBuilding) return;
    isBuilding = true;
    bundle().finally(() => {
      isBuilding = false;
    });
  };
  
  // Watch the input file and its directory for changes
  const watchPaths = [inputFile];
  
  // Also watch @botdojo/chat-sdk if it's installed locally (for development)
  // Check both monorepo location and node_modules
  const monorepoChatSdkPath = path.resolve(__dirname, '../../..', 'packages-opensource/sdk-chat/src');
  const nodeModulesChatSdkPath = path.resolve(__dirname, '../node_modules/@botdojo/chat-sdk/lib');
  
  if (fs.existsSync(monorepoChatSdkPath)) {
    watchPaths.push(monorepoChatSdkPath);
  } else if (fs.existsSync(nodeModulesChatSdkPath)) {
    // In standalone repo, watch node_modules (less useful but helps with rebuilds)
    watchPaths.push(nodeModulesChatSdkPath);
  }
  
  for (const watchPath of watchPaths) {
    try {
      fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        
        // Only watch .ts, .tsx, .js, .jsx files
        const ext = path.extname(filename);
        if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;
        
        // Debounce rebuilds
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`\n📝 Change detected: ${filename}`);
          rebuild();
        }, 100);
      });
      console.log(`   Watching: ${watchPath}`);
    } catch (err) {
      console.warn(`   Warning: Could not watch ${watchPath}: ${err.message}`);
    }
  }
}

main();
