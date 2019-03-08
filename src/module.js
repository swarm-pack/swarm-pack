/**
 * Main file for NPM usage
 * Forces config.init() before proxying index.js
 *
 * Example: When used as NPM module
 * const SwarmPack = require('swarm-pack');
 * const sp = SwarmPack(config);
 */

const _config = require('./config');

module.exports = ({ program, config }) => {
  _config.init({ program, moduleConfig: config });

  return { ...require('./index') }
};
