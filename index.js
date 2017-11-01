'use strict';

const debug = require('debug')('global-or-local');
const path = require('path');
const fs = require('fs');

const _paths = [];

const Module = module.constructor;

Module.globalPaths.forEach(_path => {
  if (_path.indexOf('node_') === -1) {
    Array.prototype.push.apply(_paths, Module._nodeModulePaths(_path));
  } else {
    _paths.push(_path);
  }
});

const nodeModules = path.join(process.cwd(), 'node_modules');

if (_paths.indexOf(nodeModules) === -1) {
  _paths.unshift(nodeModules);
}

const _resolveOriginal = Module._resolveFilename;
const _resolved = {};

const _known = [];

function _resolveHack(name) {
  let _err;

  try {
    /* eslint-disable prefer-spread */
    /* eslint-disable prefer-rest-params */
    return _resolveOriginal.apply(null, arguments);
  } catch (e) {
    _err = e;

    // avoid relative files
    if (name.charAt('.') === 0 || name.indexOf('/') > -1) {
      throw e;
    }
  }

  if (_resolved[name]) {
    return _resolved[name];
  }

  for (let i = 0, c = _paths.length; i < c; i += 1) {
    const fixedDir = path.join(_paths[i], name);

    if (fs.existsSync(fixedDir)) {
      debug(fixedDir);

      /* eslint-disable prefer-rest-params */
      const file = _resolveOriginal.apply(null,
        [fixedDir].concat(Array.prototype.slice.call(arguments, 1)));

      _resolved[name] = file;

      return file;
    }
  }

  if (_err && _err.code === 'MODULE_NOT_FOUND' && _known.indexOf(name) > -1) {
    throw new Error(`'${name}' is not installed, please try: npm install --save-dev ${name}`);
  }

  throw _err;
}

module.exports = {
  install(knownModules) {
    if (typeof knownModules === 'string') {
      knownModules = Array.prototype.slice.call(arguments);
    }

    if (knownModules && !Array.isArray(knownModules)) {
      throw new Error(`Expect known modules as array, given '${knownModules}'`);
    }

    if (Array.isArray(knownModules)) {
      Array.prototype.push.apply(_known, knownModules);
    }

    Module._resolveFilename = _resolveHack;
  },
  uninstall() {
    Module._resolveFilename = _resolveOriginal;

    _known.splice(0, _known.length);
  },
};
