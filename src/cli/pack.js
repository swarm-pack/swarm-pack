#!/usr/bin/env node

const program = require("commander");
const { addDockerArgs } = require("../utils/docker");

program
  .version("0.0.1")
  .command("ls [options]")
  .description("list deployed pack")
  .option("-H, --host <host>", "remote docker host")
  .on("option:host", function() {
    addDockerArgs(['-H', this.host])
  })
  .action(require("./pack_ls"));

program
  .command("deploy <pack> <stack>")
  .description("deploy pack to stack")
  .option("-H, --host <host>", "remote docker host")
  .on("option:host", function() {
    addDockerArgs(['-H', this.host])
  })
  .action(require("./pack_deploy"));

program.parse(process.argv);

// if program was called with no arguments, show help.
if (program.args.length === 0) program.help();
