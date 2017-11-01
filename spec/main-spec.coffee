resolver = require('..')

findNoop = ->
  require.resolve 'noop'

describe 'global-or-local', ->
  afterEach ->
    resolver.uninstall()

  it 'will fail if a module is not installed', ->
    expect(findNoop).toThrow()

  it 'can resolve any module globally', ->
    resolver.install()
    expect(findNoop).not.toThrow()

  it 'can warn about known modules', ->
    resolver.install ['im_not_even_exists']

    msg = null

    try
      require.resolve 'im_not_even_exists'
    catch e
      msg = e.message

    expect(msg).toContain "npm install --save-dev im_not_even_exists"

  it 'resolve locally otherwise', ->
    expect(-> require.resolve 'eslint').not.toThrow()
