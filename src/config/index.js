const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const deepExtend = require('deep-extend');
const os = require('os');
const getEnv = require('getenv');
const { ensurePathExisted, isFileEmpty } = require('../utils');

let config = {};
let initialized = false;

const defaultConfigDirName = '.swarm-pack';
const defaultConfigFileName = 'config.yml';
const defaultCacheDirName = 'cache';

// Individual config helper for Docker config
function configureDocker({ socketPath = false, host = false, port = '2375' }) {
  if (socketPath && host) {
    throw new Error('Cannot specify both socketPath & host in configuration.');
  }

  if (host && (host.includes(':') || host.includes('/'))) {
    throw new Error(
      'Unlike docker -H, host should be a hostname only. Use port (--port) to specify port.'
    );
  }

  if (host) {
    config.docker = { host, port, url: `tcp://${host}:${port}` };
  } else if (socketPath) {
    config.docker = { socketPath, url: `unix://${socketPath}` };
  }
}

function setConfigEnv() {
  config.defaultLoc = path.join(os.homedir(), defaultConfigDirName);
  config.configLoc =
    getEnv('SWARM_PACK_CONFIG_FILE', '') ||
    path.join(config.defaultLoc, defaultConfigFileName);
  config.cacheDir = path.join(config.defaultLoc, defaultCacheDirName);
}

function persist() {
  const store = deepExtend({}, config);
  delete store.persist;
  fs.writeFileSync(config.configLoc, yaml.safeDump(store));
}

/*
Call include config and call init() when ENV vars and config files are ready

Always
  - Load defaults within package?
  - Override defaults with anything below...?
  - Determine the "mode" of execution and make available in config helper (e.g. mode = CLI or mode = NPM)?

When installing globally (or run fist time from CLI)
  - create a ~/.swarm-pack/config with defaults
  - export SWARM_PACK_CONFIG_FILE=~/.swarm-pack/config

When swarm-pack executed from CLI
  - load file pointed at SWARM_PACK_CONFIG_FILE
  - then apply overrides from CLI args

When swarm-pack called from javascript interface (e.g. as npm dependency)
  - ignore SWARM_PACK_CONFIG_FILE
  - accept either { config } or { config_file } via method ( some sort of init pattern ?)
  - apply overrides at the method level
*/
function init({ program, moduleConfig }) {
  // Load defaults
  const defaults = yaml.safeLoad(
    fs.readFileSync(path.resolve(__dirname, './defaults.yml'))
  );

  // Running from CLI
  if (program) {
    setConfigEnv();

    // Initialize swarm-pack config
    ensurePathExisted(config.cacheDir, true);
    // Create cache dir if it doesn't exist
    ensurePathExisted(config.configLoc);

    // Copy defaults.yml to config dir if doesn't exist
    if (isFileEmpty(config.configLoc)) {
      fs.copyFileSync(path.join(__dirname, 'defaults.yml'), config.configLoc);
    }

    config = deepExtend(
      {},
      config,
      defaults,
      yaml.safeLoad(fs.readFileSync(config.configLoc))
    );

    // CLI & other overrides last, these take precedence
    configureDocker({ ...program });

    // Persist config
    persist();

    // Running as NPM module - optional config passed in
  } else if (moduleConfig) {
    config = deepExtend({}, config, defaults, moduleConfig);
  }

  initialized = true;
}

function get() {
  if (!initialized) {
    throw new Error('Config must be initialized first!');
  }
  if (!config.persist) {
    config.persist = persist;
  }
  return config;
}

module.exports = {
  init,
  get,
  persist
};
