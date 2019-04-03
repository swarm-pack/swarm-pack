#!/usr/bin/env node

const program = require('commander');
const { setObjectProperty } = require('../utils');
const config = require('../config');

function setValues(str, values) {
  const [key, value] = str.split('=');
  if (!key || !value) {
    console.log('Error parsing --set. Should be in format --set image.tag=1.1.1');
    process.exit(1);
  }
  return setObjectProperty(values, key, value);
}

program
  .version('0.0.1')
  .option('-H, --host <host>', 'remote docker host')
  .option('--port <port>', 'remote docker port')
  .option('--socketPath <socketPath>', 'path to docker daemon socket on filesystem');

// Initial parse to get global options into config
program.parse(process.argv);

// Must init config before including actions etc
config.init({ program });

program
  .command('create')
  .description('Create a new Pack using generator')
  .action(require('./actions').create);

program
  .command('ls [options]')
  .description('list deployed pack')
  .action(require('./actions').pack_ls);

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
  .action(require('./actions').pack_deploy);

program
  .command('remove <pack> <stack>')
  .description('Remove pack from a swarm cluster namespaced')
  .action(require('./actions').pack_remove);

program
  .command('version <pack>')
  .description(
    'Get version info for a pack. Includes version from packfile and last git commit hash for pack dir'
  )
  .action(require('./actions').pack_inspect_version);

program
  .command('inspect <pack>')
  .description(
    'Inpsect various details of a pack. Can be repo pack, local directory or git URL.'
  )
  .action(require('./actions').pack_inspect);

program
  .command('cache <action>')
  .description(
    `Local repository cache actions:
clear - clear the local cache
update - fetch or update the local repo cache`
  )
  .option('')
  .option('clear', 'Clear the local cache')
  .action(require('./actions').cache_clear)
  .option('')
  .option('update', 'Fetch or update the local repository cache')
  .action(require('./actions').cache_update);

program
  .command('search <keyword>')
  .description('Search the repository for pack by name')
  .action(require('./actions').repo_search);

program
  .command('repo')
  .description('Manage repo')
  .option('')
  .option('ls', 'List repository')
  .action(require('./actions').repo_list)
  .option('')
  .option('add <name> <url>', 'Add repository')
  .action(require('./actions').repo_add)
  .option('')
  .option('rm <nameOrUrl>', 'Remove repository')
  .action(require('./actions').repo_remove);

// Parse to run action
program.parse(process.argv);

// if program was called with no arguments, show help.
if (program.args.length === 0) program.help();
