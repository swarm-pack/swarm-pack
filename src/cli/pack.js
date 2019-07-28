#!/usr/bin/env node

const { Command } = require('commander');
const yaml = require('js-yaml');
const { setObjectProperty } = require('../utils');
const config = require('../config');

const program = new Command();

function withoutFirstInstanceOf(arr, elem) {
  return arr
    .slice(0, arr.indexOf(elem))
    .concat(arr.slice(arr.indexOf(elem) + 1, arr.length));
}

// Global options
program
  .version('0.0.1')
  .option('-H, --host <host>', 'remote docker host')
  .option('--port <port>', 'remote docker port')
  .option('--socketPath <socketPath>', 'path to docker daemon socket on filesystem');

// Initial parse to get global options into config
program.parse(process.argv);
config.init({ program });

program
  .version(require('../../package.json').version)

  // repo subcommands
  .command('repo')
  .allowUnknownOption()
  .description('Manage repos')
  .action(() =>
    require('./repoActions').parse(withoutFirstInstanceOf(process.argv, 'repo'))
  );

// pack subcommands
program
  .command('pack')
  .allowUnknownOption()
  .description('Manage packs')
  .action(() =>
    require('./packActions').parse(withoutFirstInstanceOf(process.argv, 'pack'))
  );

// release subcommands
program
  .command('release')
  .allowUnknownOption()
  .description('Manage releases')
  .action(() =>
    require('./releaseActions').parse(withoutFirstInstanceOf(process.argv, 'release'))
  );

// Shortcuts
program
  .command('deploy')
  .allowUnknownOption()
  .action(() => require('./packActions').parse(process.argv));

program
  .command('bundle')
  .allowUnknownOption()
  .action(() => require('./packActions').parse(process.argv));

program.parse(process.argv);
if (program.args.length === 0) program.help();

//
// program
//  .command('inspect <pack>')
//  .description(
//    'Inpsect various details of a pack. Can be repo pack, local directory or git URL.'
//  )
//  .action(require('./actions').pack_inspect);
//
// program
//  .command('cache <action>')
//  .description(
//    `Local repository cache actions:
// clear - clear the local cache
// update - fetch or update the local repo cache`
//  )
//  .option('')
//  .option('clear', 'Clear the local cache')
//  .action(require('./actions').cache_clear)
//  .option('')
//  .option('update', 'Fetch or update the local repository cache')
//  .action(require('./actions').cache_update);
//
