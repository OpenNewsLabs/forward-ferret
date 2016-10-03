'use strict';

const ferret = require('../lib/');
const mockPlugins = require('./mocks/simple-plugins.mock');
const acquireLocal = require('../plugins/acquire-local');
const parseXML2JS = require('../plugins/parse-xml2js');

const assert = require('chai').assert;
describe('parse-xml2js', function() {
  it('should convert xml streams into JSON objects', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname + '/fixtures/old/*'
      }
    }, {
      'acquire-local': acquireLocal,
      'parse-xml2js': parseXML2JS,
      'output-test': mockPlugins['output-test']
    }).then(function(data){
      assert.typeOf(data, 'array');
      assert.typeOf(data[0], 'object');
      assert.typeOf(data[0].file, 'string');
      assert.typeOf(data[0].xmlData, 'object');
      assert.include(data[0].file,'.xml');
      done();
    }).catch((err)=>{
      throw(err);
      done();
    });
  });
});
