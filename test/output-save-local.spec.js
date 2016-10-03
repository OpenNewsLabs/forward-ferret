'use strict';

const ferret = require('../lib/');
const acquireLocal = require('../plugins/acquire-local');
const outputSaveLocal = require('../plugins/output-save-local');
const parseToString = require('../plugins/parse-to-string');
const parseXML2JS = require('../plugins/parse-xml2js');
const mktemp = require('mktemp');

const fs = require('fs');

const tmpdir = mktemp.createDirSync('/tmp/XXXXX');

const assert = require('chai').assert;
describe('output-save-local', function() {
  it('should throw an error if passed a stream', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname + '/fixtures/old/*', // acquire plugin
        localSave: tmpdir // output plugin
      }
    }, {
      'acquire-local': acquireLocal,
      'output-save-local': outputSaveLocal
    }).catch((err)=>{
      assert.equal(err.message, 'output-save-local: data appears to be a stream and cannot be saved to disk');
      done();
    });
  });

  it('should throw an error if local save is not specified', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname + '/fixtures/old/*' // acquire plugin
      }
    }, {
      'acquire-ftp': acquireLocal,
      'parse-to-string': parseToString,
      'output-save-local': outputSaveLocal
    }).catch((err)=>{
      assert.equal(err.message,'output-save-local: must pass a local directory path via the `local-save` flag');
      done();
    });
  });
  // it('should convert strings into flat files', function (done) {
  //   const a = ferret({
  //     flags: {
  //       localPath: __dirname + '/fixtures/old/*', // acquire plugin
  //       localSave: tmpdir // output plugin
  //     }
  //   }, {
  //     'acquire-ftp': acquireLocal,
  //     'parse-to-string': parseToString,
  //     'output-save-local': outputSaveLocal
  //   }).then(function(data){
  //     fs.readFile(tmpdir + '/0.txt', 'utf8', (err, data) => {
  //       assert.equal(data.charAt(0), '<');
  //       done();
  //     });
  //   }).catch((err)=>{
  //     throw(err);
  //     done();
  //   });
  // });
  it('should convert JS objects into flat JSON files', function (done) {
    const a = ferret({
      flags: {
        localPath: __dirname + '/fixtures/old/*', // acquire plugin
        localSave: tmpdir // output plugin
      }
    }, {
      'acquire-dummy': {
        type: 'acquire',
        priority: 0,
        function: function(){
          return new Promise((res, rej) => {
            res({
              test: true,
              highpriority: false,
              dummyArray: [0,1,2]
            });
          });
        },
        flags: {}
},
      'output-save-local': outputSaveLocal
    }).then(function(data){
      fs.readFile(tmpdir + '/0.json', 'utf8', function(err, data){
        assert.equal(data.charAt(0), '{');
        done();
      });
    }).catch((err) => {
      throw(err);
      done();
    });
  });
});
