const fs = require('fs-extra');
const { spawn } = require('child_process');
const md5 = require('md5');
const objectHash = require('object-hash');

const revHashLength = 16;

// Take a buffer, return a string. Defaults to utf8 encoding
function stringToBase64(string, encoding) {
  if (!encoding) {
    encoding = 'utf8';
  }
  return Buffer.from(string, encoding).toString('base64');
}

function revHashStr(str) {
  return md5(str).substr(0, revHashLength);
}

async function revHashFile(path) {
  return md5(await fs.readFile(path)).substr(0, revHashLength);
}

function revHashFileSync(path) {
  return md5(fs.readFileSync(path)).substr(0, revHashLength);
}

function revHashObject(o) {
  return objectHash(o, { algorithm: 'md5' }).substr(0, revHashLength);
}

/**
 * Get a property of a (nested) object using a dot-notation string
 * E.g. getObjectProperty("foo.bar", {foo: {bar: "baz"}})
 *  returns "baz"
 */
function getObjectProperty(property, object) {
  return property.split('.').reduce((o, i) => o[i], object);
}

/**
 * Set a property on an object using dot-notation string
 * e.g. setObjectProperty({}, 'foo.bar', 'baz')
 * returns {foo: {bar: 'baz'}}
 * TODO - parsing of Array notation is for another day... e.g. "foo.bar[0]=baz"
 */
function setObjectProperty(object, key, value) {
  const levels = key.split('.');
  let curLevel = object;
  let i = 0;
  while (i < levels.length - 1) {
    if (typeof curLevel[levels[i]] === 'undefined') {
      curLevel[levels[i]] = {};
    }
    curLevel = curLevel[levels[i]];
    i++;
  }
  curLevel[levels[levels.length - 1]] = value;
  return object;
}

function readFile(fileName, type = 'utf-8') {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, type, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

function ensurePathExisted(path, isDir = false) {
  if (isDir) {
    fs.ensureDirSync(path);
  } else {
    fs.ensureFileSync(path);
  }
}

function isFileEmpty(path) {
  if (!fs.pathExistsSync(path)) {
    throw new Error(`${path} is not existed`);
  }

  return fs.statSync(path).size === 0;
}

/**
 * Empty things:
 *  - Zero length string
 *  - Objects or arrays with no own properties / items
 *  - Undefined, null, NaN
 * Non-empty things:
 *  - Boolean true or false
 *  - All numbers including 0
 *  - Strings with characters
 *  - Objects and arrays with props or items
 */
function isEmpty(thing) {
  if (typeof thing === 'number' && !Number.isNaN(thing)) return false;
  if (typeof thing === 'object' && thing !== null) return Object.keys(thing).length === 0;
  if (typeof thing === 'boolean') return false;
  return !thing;
}

/**
 * Async function to wait specific amount of `ms` then resolve a promise (no return value)
 */
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getObjectProperty,
  stringToBase64,
  readFile,
  ensurePathExisted,
  isFileEmpty,
  setObjectProperty,
  isEmpty,
  revHashStr,
  revHashFile,
  revHashFileSync,
  revHashObject,
  wait
};
