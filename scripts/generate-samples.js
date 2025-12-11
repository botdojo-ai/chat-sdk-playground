#!/usr/bin/env node
/**
 * Generates TypeScript files with raw sample code content.
 * This allows us to render a component AND display its source code.
 * 
 * Usage:
 *   node scripts/generate-samples.js        # Run once
 *   node scripts/generate-samples.js --watch # Watch for changes
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const SAMPLES_DIR = path.join(__dirname, '../samples');
const OUTPUT_DIR = path.join(__dirname, '../@generated');

function ensureOutputDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeForTemplate(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function toVariableName(name) {
  return name.replace(/-/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}

function generateSampleFile(samplePath, relativePath) {
  const content = fs.readFileSync(samplePath, 'utf-8');
  const filename = path.basename(samplePath);
  const name = path.basename(samplePath, path.extname(samplePath));
  const dir = path.dirname(relativePath);
  
  // Determine output directory
  const outputSubDir = dir === '.' ? OUTPUT_DIR : path.join(OUTPUT_DIR, dir);
  ensureOutputDir(outputSubDir);
  
  // Generate variable name from full path
  const varName = dir === '.' 
    ? toVariableName(name) + '_code'
    : toVariableName(dir) + '_' + toVariableName(name) + '_code';
  
  // Generate a TypeScript file that exports the raw content
  const outputContent = `// Auto-generated from samples/${relativePath}
// Do not edit directly - edit the source file instead

export const ${varName} = \`${escapeForTemplate(content)}\`;
`;

  const outputPath = path.join(outputSubDir, `${name}.ts`);
  fs.writeFileSync(outputPath, outputContent);
  
  const displayPath = dir === '.' ? `@generated/${name}.ts` : `@generated/${dir}/${name}.ts`;
  console.log(`Generated: ${displayPath}`);
  
  return { name, dir, varName };
}

function getAllSampleFiles(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      files.push(...getAllSampleFiles(fullPath, baseDir));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      files.push({ fullPath, relativePath });
    }
  }
  
  return files;
}

function generateAllSamples() {
  ensureOutputDir(OUTPUT_DIR);
  
  const files = getAllSampleFiles(SAMPLES_DIR);
  const generated = [];
  
  files.forEach(({ fullPath, relativePath }) => {
    const result = generateSampleFile(fullPath, relativePath);
    generated.push(result);
  });
  
  // Group by directory
  const byDir = {};
  generated.forEach(({ name, dir, varName }) => {
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push({ name, varName });
  });
  
  // Generate index file for root
  const rootExports = [];
  
  // Export direct files
  if (byDir['.']) {
    byDir['.'].forEach(({ name }) => {
      rootExports.push(`export * from './${name}';`);
    });
  }
  
  // Export subdirectories
  Object.keys(byDir).filter(d => d !== '.').forEach(dir => {
    rootExports.push(`export * from './${dir}';`);
    
    // Generate index for subdirectory
    const subIndexContent = byDir[dir].map(({ name }) => 
      `export * from './${name}';`
    ).join('\n') + '\n';
    
    fs.writeFileSync(path.join(OUTPUT_DIR, dir, 'index.ts'), subIndexContent);
    console.log(`Generated: @generated/${dir}/index.ts`);
  });
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), rootExports.join('\n') + '\n');
  console.log('Generated: @generated/index.ts');
}

// Initial generation
generateAllSamples();

// Watch mode
if (process.argv.includes('--watch')) {
  console.log('\nWatching for changes in samples/...\n');
  
  const watcher = chokidar.watch(SAMPLES_DIR, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    }
  });
  
  watcher.on('change', (filePath) => {
    console.log(`\nFile changed: ${path.relative(SAMPLES_DIR, filePath)}`);
    generateAllSamples();
  });
  
  watcher.on('add', (filePath) => {
    console.log(`\nFile added: ${path.relative(SAMPLES_DIR, filePath)}`);
    generateAllSamples();
  });
  
  watcher.on('unlink', (filePath) => {
    console.log(`\nFile removed: ${path.relative(SAMPLES_DIR, filePath)}`);
    generateAllSamples();
  });
}
