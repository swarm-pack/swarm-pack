const path = require('path');
const fs = require('fs-extra');
const { compile } = require('nexe')
const sh = require('shelljs');

const bundleDir = path.join(__dirname, 'build/Release');

const nodeVersion = "10.15.3"; // Latest nexe pre-built available
const targets = [ "mac-x64", "alpine-x64", "windows-x64", "linux-x64" ];

const version = process.env.CIRCLE_TAG || 'dev';

console.log(`Clearing ${bundleDir}...\n`);
fs.ensureDirSync(bundleDir);
fs.emptyDirSync(bundleDir);

async function buildTargets() {
  for (const target of targets) {
    const targetRef = `${target}-${nodeVersion}`;
    
    await compile({
      input: './src/cli/pack.js',
      output: path.join(bundleDir, `swarm-pack-${version}-${target}`),
      target: targetRef
    })
    //sh.cd(bundleDir);
    //sh.exec(`gzip swarm-pack-${version}(?!.*\.gz$) > swarm-pack-${version}-${target}.gz`)
  }

}

buildTargets();

// zip each 
