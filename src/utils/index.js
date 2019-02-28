
/**
 * Get a property of a (nested) object using a dot-notation string
 * E.g. getObjectProperty("foo.bar", {foo: {bar: "baz"}})
 *  returns "baz"
 */
function getObjectProperty(property, object) {
  return property.split('.').reduce((o,i)=>o[i], object)
}

module.exports = {
  getObjectProperty
};