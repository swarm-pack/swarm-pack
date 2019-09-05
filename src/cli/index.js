#!/usr/bin/env node
const { Command } = require('commander');
const yaml = require('js-yaml');
const config = require('../config');
const { version } = require('../../package.json');
const { setObjectProperty } = require('../utils');

const program = new Command();

function setValues(str, values) {
  const [key, value] = str.split('=');
  if (!key || !value) {
    console.log('Error parsing --set. Should be in format --set image.tag=1.1.1');
    process.exit(1);
  }
  return setObjectProperty(values, key, yaml.safeLoad(value));
}

// Global options
program
  .version(version)
  .option('-H, --host <host>', 'remote docker host')
  .option('--port <port>', 'remote docker port')
  .option('--socketPath <socketPath>', 'path to docker daemon socket on filesystem')
  .option(
    '--include-prerelease',
    'Include pre-release versions when looking for matching packs'
  );

// Initial parse to get global options into config
program.parse(process.argv);
config.init({ program });

const { pack_bundle, pack_deploy, pack_inspect } = require('./actions/pack');
const { pack_create } = require('./actions/pack_create');
const { release_ls, release_remove } = require('./actions/release');
const {
  repo_list,
  repo_add,
  repo_remove,
  repo_search,
  repo_index,
  repo_update
} = require('./actions/repo');

// PACK COMMANDS
program
  .command('pack:create')
  .description('Create a new Pack using generator')
  .action(pack_create);

program
  .command('pack:bundle <packDir>')
  .description('Build a pack directory to a tgz bundle')
  .option('--output-path <str>', 'Path in which to save generated package')
  .action(pack_bundle);

program
  .command('pack:deploy <pack> <stack>')
  .alias('deploy')
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
  .command('pack:inspect <pack>')
  .description(
    'Inspect various details of a pack. Can be repo pack, local directory or git URL.'
  )
  .action(pack_inspect);

// REPO COMMANDS
program
  .command('repo:ls')
  .description('List repository')
  .action(repo_list);
program
  .command('repo:add <name> <url>')
  .description('Add repository')
  .action(repo_add);
program
  .command('repo:rm <nameOrUrl>')
  .alias('repo:remove')
  .description('Remove repository')
  .action(repo_remove);
program
  .command('repo:search <keyword>')
  .description('Search the repository for pack by name')
  .action(repo_search);
program
  .command('repo:index')
  .description('build index file for repo in current directory')
  .option('--merge <str>', 'Merge this index with existing index file (path or url)')
  .option('--url <str>', 'Base URL where packs are hosted')
  .option(
    '--output-path <str>',
    'Directory into which to save the index.yml. Default curr working dir.',
    '.'
  )
  .action(repo_index);
program
  .command('repo:update')
  .alias('update')
  .description(`Update information of available packs locally from pack repositories`)
  .action(repo_update);

// RELEASE ACTIONS
program
  .command('release:ls')
  .description('list deployed packs')
  .action(release_ls);

program
  .command('release:remove <pack> <stack>')
  .description('Remove pack from a swarm cluster namespaced')
  .action(release_remove);

program.parse(process.argv);
