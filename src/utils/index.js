const fs = require('fs');

/**
 * Get a property of a (nested) object using a dot-notation string
 * E.g. getObjectProperty("foo.bar", {foo: {bar: "baz"}})
 *  returns "baz"
 */
function getObjectProperty(property, object) {
  return property.split('.').reduce((o, i) => o[i], object);
}

function readFile(fileName, type = 'utf-8') {
  return new Promise(function(resolve, reject) {
    fs.readFile(fileName, type, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

module.exports = {
  getObjectProperty,
  readFile
};
