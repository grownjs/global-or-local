resolver = require('..')

findNoop = ->
  require.resolve 'noop'

setupESLint = ->
  require.resolve 'eslint'

__idk__ = 'im_not_even_exists'

describe 'global-or-local', ->
  afterEach ->
    resolver.uninstall()

  describe '#install', ->
    it 'will fail on invalid, relative or absolute paths', ->
      resolver.install()
      expect(-> require.resolve __idk__).toThrow()
      expect(-> require.resolve '.').toThrow()
      expect(-> require.resolve '/').toThrow()

    it 'will fail on invalid known module names', ->
      expect(-> resolver.install(-1)).toThrow()

    it 'will fallback to arguments otherwise', ->
      expect(-> resolver.install 'foo').not.toThrow()


  describe '#resolve', ->
    it 'will fail if a module is not installed', ->
      expect(findNoop).toThrow()

    it 'can resolve any module globally', ->
      resolver.install()
      expect(findNoop).not.toThrow()

    it 'will return previously resolved paths', ->
      resolver.install()
      expect(findNoop).not.toThrow()
      expect(findNoop).not.toThrow()

    it 'can warn about known modules', ->
      resolver.install [__idk__]

      msg = null

      try
        require.resolve __idk__
      catch e
        msg = e.message

      expect(msg).toContain "npm install --save-dev #{__idk__}"

    it 'resolve locally otherwise', ->
      expect(setupESLint).not.toThrow()
