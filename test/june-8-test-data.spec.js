'use strict';

const exec = require('child_process').exec;

const assert = require('chai').assert;
describe('wsj-specific brexit usage', function() {
  it('should work', function(done) {
    let cmd = `bin/ferret.js \
      --acquire-local \
      --local-path "test/fixtures/june-8-test/EU_result*.xml" \
      --parse-xml2js \
      --transform-clean-xml \
      --output-stdout`;
    exec(cmd, {maxBuffer: 1024 * 500}, function(error, stdout, stderr) {
      // console.log(stdout);
      assert.include(stdout,'ReferendumResult');
      assert.equal(error,null);
      done();
    });
  })
});
