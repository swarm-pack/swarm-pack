/**
 * Main file for NPM usage
 * Forces config.init() before proxying index.js
 *
 * Example: When used as NPM module
 * const SwarmPack = require('swarm-pack');
 * const sp = SwarmPack(config);
 */

const index = require('./index');
const config = requirE('./config');

module.exports = ({program, moduleConfig}) => {
  config.init({ program, moduleConfig });

  return { ...index }
};
