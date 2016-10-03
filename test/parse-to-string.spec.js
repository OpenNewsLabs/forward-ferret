'use strict';

const ferret = require('../lib/');
const mockPlugins = require('./mocks/simple-plugins.mock');
const acquireLocal = require('../plugins/acquire-local');
const parseToString = require('../plugins/parse-to-string');

const assert = require('chai').assert;
describe('parse-to-string', function() {
  it('should convert streams to strings', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname+'/fixtures/old/*'
      }
    }, {
      'acquire-ftp': acquireLocal,
      'parse-to-string': parseToString,
      'output-test': mockPlugins['output-test']
    }).then(function(data){
      assert.ok('length' in data);
      assert.typeOf(data[0],'string');
      done();
    }).catch((err)=>{
      throw(err);
      done();
    });
  });
});