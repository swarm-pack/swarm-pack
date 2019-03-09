#!/usr/bin/env node

const program = require("commander");
const config = require("../config");

program
  .version("0.0.1")
  .option("-H, --host <host>", "remote docker host")
  .option("--port <port>", "remote docker port")
  .option("--socketPath <socketPath>", "path to docker daemon socket on filesystem")

// Initial parse to get global options into config
program.parse(process.argv);

// Must init config before including actions etc
config.init({ program });

program.command("ls [options]")
  .description("list deployed pack")
  .action(require("./actions").pack_ls);

program
  .command("deploy <pack> <stack>")
  .description(`Deploy a swarm-pack, to a swqrm cluster namespaced to a stack.
pack - a pack reference in the repo (‘stable/drupal’), a full path to a directory or packaged chart, or a URL.
stack - a Docker Stack namespace`)
  .action(require("./actions").pack_deploy);

program
  .command("version <pack>")
  .description("Get version info for a pack. Includes version from packfile and last git commit hash for pack dir")
  .action(require("./actions").pack_inspect_version)

program
  .command("inspect <pack>")
  .description("Inpsect various details of a pack. Can be repo pack, local directory or git URL.")
  .action(require("./actions").pack_inspect)

// Waiting for multi-word commands
// So we can do `swarm-pack cache update` etc
// https://github.com/tj/commander.js/issues/655
program
  .command("cache <action>")
  .description(`Local repository cache actions:
clear - clear the local cache
update - fetch or update the local repo cache`)
  .action((action) => {
    if (action === "clear") require("./actions").cache_clear()
    if (action === "update") require("./actions").cache_update()
  })


// Parse to run action
program.parse(process.argv)

// if program was called with no arguments, show help.
if (program.args.length === 0) program.help();
