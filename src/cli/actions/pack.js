const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const deepExtend = require('deep-extend');
const lodash = require('lodash');

const { loadPack, compileAndDeploy } = require('../../index');


//const { generatePack } = require('../pack/create');
const { bundle } = require('../../lib/pack');
//const questions = require('./questions');

function noEmptyValues(obj) {
  lodash.forOwn(obj, (value, key) => {
    if (!value) {
      console.error(`${key} missing or invalid value`);
      process.exit(1);
    }
  });
}

async function pack_inspect(packRef) {
  noEmptyValues({ packRef });
  const { metadata, defaults } = await loadPack({ packRef });
  console.log(JSON.stringify({ metadata, defaults }, null, 2));
}

async function pack_deploy(packRef, stack, cmd) {
  noEmptyValues({ packRef, stack });
  let values = {};
  if (cmd.valuesFile) {
    values = yaml.safeLoad(fs.readFileSync(path.resolve(cmd.valuesFile)));
  }
  // If any values were set with --set
  if (Object.keys(cmd.set).length) {
    values = deepExtend(values, cmd.set);
  }
  await compileAndDeploy({ packRef, stack, values });
  console.log(`Deployed pack ${packRef} to stack ${stack}`);
}

async function pack_bundle(packDir, cmd) {
  const bundlePath = await bundle({
    packDir: path.resolve(packDir),
    outputPath: path.resolve(cmd.outputPath || process.cwd())
  });

  console.log(`Created package: ${bundlePath}`);
}

module.exports = {
  pack_bundle, pack_deploy, pack_inspect
}