#!/usr/bin/env node

const program = require("commander");

program
  .version("0.0.1")
  .command("ls [options]")
  .description("list deployed pack")
  .option("-H, --host <host>", "remote docker host")
  .action(require("./pack_ls"));

program
  .command("deploy <pack> <stack>")
  .description("deploy pack to stack")
  .option("-H, --host <host>", "remote docker host")
  .action(require("./pack_deploy"));

program.parse(process.argv);

// if program was called with no arguments, show help.
if (program.args.length === 0) program.help();
