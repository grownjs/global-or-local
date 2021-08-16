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

let _map = {};
let _known = [];
let _knownDev = [];
let _knownOptional = [];

function _resolveHack(name) {
  if (name.charAt() === '/' || name.charAt() === '.') {
    return _resolveOriginal.apply(null, arguments);
  }

  let _err;
  try {
    const keys = Object.keys(_map);

    for (let i = 0; i < keys.length; i += 1) {
      if (name.indexOf(keys[i]) === 0) {
        arguments[0] = path.join(_map[keys[i]], name.substr(keys[i].length));
        break;
      }
    }

    /* eslint-disable prefer-spread */
    /* eslint-disable prefer-rest-params */
    return _resolveOriginal.apply(null, arguments);
  } catch (e) {
    _err = e;
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

  if (_err && _err.code === 'MODULE_NOT_FOUND') {
    let _args = '--save';

    if (_knownDev.indexOf(name) !== -1) {
      _args = '--save-dev';
    }

    if (_knownOptional.indexOf(name) !== -1) {
      _args = '--save-optional';
    }

    throw new Error(`'${name}' is not installed, please try: npm install ${name} ${_args || ''}`);
  }

  throw _err;
}

const self = module.exports = {
  dependencies(knownModules) {
    self.install(knownModules);

    return self;
  },
  devDependencies(knownModules) {
    self.install(knownModules, 'dev');

    return self;
  },
  optionalDependencies(knownModules) {
    self.install(knownModules, 'optional');

    return self;
  },
  install(knownModules, typeOfDependency) {
    if (typeof knownModules === 'string') {
      knownModules = Array.prototype.slice.call(arguments);
    }

    if (knownModules && !Array.isArray(knownModules)) {
      throw new Error(`Expect known modules as array, given '${knownModules}'`);
    }

    let target = _known;

    if (typeOfDependency === 'dev') {
      target = _knownDev;
    }

    if (typeOfDependency === 'optional') {
      target = _knownOptional;
    }

    if (Array.isArray(knownModules)) {
      Array.prototype.push.apply(target, knownModules);
    }

    Module._resolveFilename = _resolveHack;

    return self;
  },
  uninstall() {
    Module._resolveFilename = _resolveOriginal;

    _map = {};

    _known = [];
    _knownDev = [];
    _knownOptional = [];

    return self;
  },
  bind(prefix, baseDir) {
    if (typeof prefix === 'object') {
      Object.assign(_map, prefix);
    } else {
      _map[prefix] = baseDir;
    }

    return self;
  },
};
