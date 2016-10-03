'use strict';

const ferret = require('../lib/');
const acquireLocal = require('../plugins/acquire-local');
const parseToString = require('../plugins/parse-to-string');
const mockPlugins = require('./mocks/simple-plugins.mock');

const assert = require('chai').assert;
describe('acquire-local', function() {
  it('should load an array of streams', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname+'/fixtures/old/*'
      }
    }, {
      'acquire-local': acquireLocal,
      'output-test': mockPlugins['output-test']
    }).then(function(data){
      assert.typeOf(data,'array');
      data.forEach(s=>{
        assert.typeOf(s.on,'function');
        assert.typeOf(s.pipe,'function');
      });

      let output = '';
      data[0].on('data', function(chunk) {
          output += chunk;
      });
      data[0].on('end', function() {
        assert.typeOf(output,'string');
        assert.match(output,/ElectionNominations/g);
        done();
      });
    }).catch((err)=>{
      throw(err);
      done();
    });
  });
  it('should throw an error if not given a glob', function (done) {
    const a = ferret({}, {
      'acquire-local': acquireLocal,
      'output-test': mockPlugins['output-test']
    }).catch((err)=>{
      assert.equal(err.message,'acquire-local: No `local-path` specified.')
      done();
    });
  });
  it('should throw an error if given a bad glob', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname+'/nonexistent-folder/*'
      }
    }, {
      'acquire-local': acquireLocal,
      'output-test': mockPlugins['output-test']
    }).catch((err)=>{
      assert.equal(err.message,'acquire-local: No files matched.')
      done();
    });
  });
  it('should throw an error if given a directory, not a glob', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname+'/tmp'
      }
    }, {
      'acquire-local': acquireLocal,
      'output-test': mockPlugins['output-test']
    }).catch((err)=>{
      assert.equal(err.message,'acquire-local: \''+__dirname+'/tmp\' is a directory. Must specify a file or a glob.')
      done();
    });
  });
  it('should accept a single file', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname+'/../Readme.md'
      }
    }, {
      'acquire-local': acquireLocal,
      'parse-to-string': parseToString,
      'output-test': mockPlugins['output-test']
    }).then((data)=>{
      assert.include(data[0],'ferret');
      done();
    });
  });
  
});
