'use strict';

const exec = require('child_process').exec;

const assert = require('chai').assert;
describe('command-line interface usage', function() {
  it('should NOT work without any flags', function (done) {
    let cmd = 'bin/ferret.js';
    exec(cmd, function(error, stdout, stderr) {
      assert.equal(stdout,'');
      assert.include(stderr,'No plugins with "acquire" type loaded');
      done();
    });
  });
  it('should NOT work without an output flag', function(done) {
    let cmd = `bin/ferret.js \
      --acquire-local \
      --local-path "test/fixtures/*"`;
    exec(cmd, function(error, stdout, stderr) {
      assert.equal(stdout,'');
      assert.include(stderr,'No plugins with "output" type loaded');
      done();
    });
  })
  it('should work with acquire and output flags', function(done) {
    let cmd = `bin/ferret.js \
      --acquire-local \
      --local-path "test/fixtures/old/*" \
      --output-stdout`;
    exec(cmd, function(error, stdout, stderr) {
      assert.equal(stdout.charAt(0),'[');
      done();
    });
  })
  it('should work with all flags set', function(done) {
    this.timeout(3000);
    let cmd = `bin/ferret.js \
      --acquire-local \
      --local-path "test/fixtures/old/*" \
      --parse-xml2js \
      --transform-clean-xml \
      --output-stdout`;
    exec(cmd, function(error, stdout, stderr) {
      assert.equal(stdout.charAt(0),'[');
      assert.include(stdout,'Bristol_mayor_test_nominations_Bristol_rev_2');
      done();
    });
  })
});


