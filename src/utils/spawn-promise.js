/**
 * Based on https://github.com/medikoo/stream-promise
 * With the following changes:
 *  - Accept a Stream as input as alternative to string. Stream will be piped to child process
 *  - Promise resolves with array of strings representing lines of stdout, instead of concatanted buffer
 *  - Passes parent ENV to child process
 */

const co = require('co');
const childProcess = require('child_process');
const stream = require('stream');

const exitCodes = {
  1: 'Uncaught Fatal Exception',
  3: 'Internal JavaScript Parse Error',
  4: 'Internal JavaScript Evaluation Failure',
  5: 'Fatal Error',
  6: 'Non-function Internal Exception Handler',
  7: 'Internal Exception Handler Run-Time Failure',
  9: 'Invalid Argument',
  10: 'Internal JavaScript Run-Time Failure',
  12: 'Invalid Debug Argument'
};
const isEmpty = object => Object.keys(object).length === 0;
/**
 * Spawn a child process and receive output via a Promise interface.
 *
 * @params {String} command
 *  Command to spawn.
 * @params {String[]} args
 *  Array of arguments to run command with.
 * @params {String} input
 *  Input to pass command via stdin.
 *
 * @returns {Promise}
 *  Resolved with buffer of stdout
 *  Rejected with error
 */
const spawn = co.wrap(function*(command, args, input) {
  const child = childProcess.spawn(command, args, { env: process.env });

  // TODO handle sig events? (sigint, etc.)

  // Capture errors
  const errors = {};
  const stderrOutput = {};
  child.on('error', error => (errors.spawn = error));
  child.stdin.on('error', error => (errors.stdin = error));
  child.stdout.on('error', error => (errors.stdout = error));
  child.stderr.setEncoding('utf8');
  child.stderr.on('error', error => (errors.stderr = error));
  child.stderr.on('data', data => {
    if (!stderrOutput.process) stderrOutput.process = '';
    stderrOutput.process += data;
  });

  // Capture output
  const buffers = [];
  child.stdout.on('data', data => buffers.push(data));

  // Run
  const exitCode = yield new Promise(resolve => {
    child.on('close', (code, signal) => resolve(code));
    if (input instanceof stream.Stream) {
      input.pipe(child.stdin);
    } else {
      child.stdin.end(input);
    }
  });
  if (exitCode !== 0) {
    errors.exit = `Command failed: ${exitCode}: ${exitCodes[exitCode]}`;
    errors.process = stderrOutput.process;
  }

  // Return
  if (!isEmpty(errors)) throw new Error(JSON.stringify(errors));
  return buffers.map(b => b.toString().trim());
});

module.exports = spawn;
