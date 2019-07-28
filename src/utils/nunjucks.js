const nunjucks = require('nunjucks');
const yaml = require('js-yaml');
const utils = require('../utils');

const PackLoader = nunjucks.Loader.extend({
  init(pack) {
    this.pack = pack;
  },

  getSource(name) {
    return this.pack.getTemplate(name);
  }
});

module.exports = function(pack, options) {
  const env = new nunjucks.Environment(new PackLoader(pack), options);

  // Filters & helpers
  env.addFilter('dumpyml', function(o, indent, opts) {
    return yaml
      .safeDump(o, opts)
      .replace(/^/gm, ' '.repeat(indent))
      .trim();
  });

  env.addGlobal('dumpblock_if_set', ({ value, indent = 0, root = false }) => {
    if (utils.isEmpty(value)) return '';
    return yaml
      .safeDump(root ? { [root]: value } : value)
      .replace(/^/gm, ' '.repeat(indent))
      .trim();
  });

  return env;
};
