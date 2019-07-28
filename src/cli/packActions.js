const inquirer = require('inquirer');
const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const deepExtend = require('deep-extend');
const lodash = require('lodash');
const { compileAndDeploy } = require('../index');
const { generatePack } = require('../pack/create');
const { bundle } = require('../lib/pack');
const questions = require('./questions');

const program = new Command();

function parse(argv) {
  program
    .command('create')
    .description('Create a new Pack using generator')
    .action(pack_create);

  program
    .command('bundle <packDir>')
    .description('Build a pack directory to a tgz bundle')
    .option('--output-path <str>', 'Path in which to save generated package')
    .action(pack_bundle);

  program
    .command('deploy <pack> <stack>')
    .description(
      `Deploy a swarm-pack, to a swarm cluster namespaced to a stack.
      pack - a pack reference in the repo (‘stable/drupal’), a full path to a directory or packaged chart, or a URL.
      stack - a Docker Stack namespace`
    )
    .option('-f, --values-file <str>', 'use a values file')
    .option(
      '--set <str>',
      'set a value e.g. myvalue=foo (can be used multiple times)',
      setValues,
      {}
    )
    .action(pack_deploy);

  program
    .command('inspect <pack>')
    .description(
      'Inspect various details of a pack. Can be repo pack, local directory or git URL.'
    )
    .action(pack_inspect);

  program.parse(argv);
}

function noEmptyValues(obj) {
  lodash.forOwn(obj, (value, key) => {
    if (!value) {
      console.error(`${key} missing or invalid value`);
      process.exit(1);
    }
  });
}

function setValues(str, values) {
  const [key, value] = str.split('=');
  if (!key || !value) {
    console.log('Error parsing --set. Should be in format --set image.tag=1.1.1');
    process.exit(1);
  }
  return setObjectProperty(values, key, yaml.safeLoad(value));
}

async function pack_inspect(packRef) {
  noEmptyValues({ packRef });
  console.log(JSON.stringify(await repo.inspectPack(packRef), null, 2));
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

  compileAndDeploy({ packRef, stack, values });
}

async function pack_create() {
  inquirer.prompt(questions.create).then(answers => generatePack(answers));
}

async function pack_bundle(packDir, cmd) {
  const bundlePath = await bundle({
    packDir: path.resolve(packDir),
    outputPath: path.resolve(cmd.outputPath || process.cwd())
  });

  console.log(`Created package: ${bundlePath}`);
}

module.exports = {
  parse
  // help
};
