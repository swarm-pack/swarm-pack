#!/usr/bin/env node

const program = require("commander");
const docker = require("../utils/docker");

program
  .version("0.0.1")
  .option("-H, --host <host>", "remote docker host")
  .option("--port <port>", "remote docker port")
  .option("--socketPath <socketPath>", "path to docker daemon socket on filesystem")

// Initial parse to get global options into config
program.parse(process.argv);
docker.configure({ ...program });

program.command("ls [options]")
  .description("list deployed pack")
  .action((q, opts) => {
    require("./pack_ls")
  });

/**
 * pack deploy . prod
 * pack deploy stable/foo prod
 */

program
  .command("deploy <pack> <stack>")
  .description(`Deploy a swarm-pack, to a swqrm cluster namespaced to a stack.
pack - a pack reference in the repo (‘stable/drupal’), a full path to a directory or packaged chart, or a URL.
stack - a Docker Stack namespace`)
  .action(require("./pack_deploy"));

// Parse to run action
program.parse(process.argv)

// if program was called with no arguments, show help.
if (program.args.length === 0) program.help();
