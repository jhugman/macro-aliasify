var test = require('tap').test,
    aliasify = require('..');

test('Basic operation, no recursion', function (t) {

  t.deepEqual(aliasify(__dirname + '/fixtures/no-recursion'), [
    './lib/aliased-extension:aliased'
  ]);

  t.end();
});


test('Basic operation, with recursion', function (t) {

  t.deepEqual(aliasify(__dirname + '/fixtures/recursion'), [
    './lib/aliased-extension:parent-aliased',
    'a-dependency/lib/aliased-extension:child-aliased',
  ]);

  t.end();
});