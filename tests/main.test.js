const { expect } = require('chai');
const resolver = require('..');

function findNoop() {
  return require.resolve('noop');
}

function setupESLint() {
  return require.resolve('eslint');
}

const __idk__ = 'im_not_even_exists';

/* global afterEach, describe, it */

describe('global-or-local', () => {
  afterEach(() => {
    resolver.uninstall();
  });

  describe('#install', () => {
    it('will fail on invalid, relative or absolute paths', () => {
      resolver.install();
      expect(() => {
        require.resolve(__idk__);
      }).to.throw();
      expect(() => {
        require.resolve('.');
      }).to.throw();
      expect(() => {
        require.resolve('/');
      }).to.throw();
    });

    it('will fail on invalid known module names', () => {
      expect(() => {
        return resolver.install(-1);
      }).to.throw();
    });

    it('will fallback to arguments otherwise', () => {
      expect(() => {
        return resolver.install('foo');
      }).not.to.throw();
    });
  });

  describe('#resolve', () => {
    it('will fail if a module is not installed', () => {
      expect(findNoop).to.throw();
    });

    it('can resolve any module globally', () => {
      resolver.install();
      expect(findNoop).not.to.throw();
    });

    it('will return previously resolved paths', () => {
      resolver.install();
      expect(findNoop).not.to.throw();
      expect(findNoop).not.to.throw();
    });

    it('can warn about known modules', () => {
      resolver.install([__idk__]);

      let msg = null;
      let e;

      try {
        require.resolve(__idk__);
      } catch (_error) {
        e = _error;
        msg = e.message;
      }

      expect(msg).to.contain(`npm install ${__idk__} --save`);
    });

    it('resolve locally otherwise', () => {
      expect(setupESLint).not.to.throw();
    });
  });
});
