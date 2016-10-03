'use strict';

const ferret = require('../lib/');
const parseToString = require('../plugins/parse-to-string');
const mockPlugins = require('./mocks/simple-plugins.mock');
const proxyquire = require('proxyquire');
const fs = require('fs');
const path = require('path');
const acquireFtp = proxyquire('../plugins/acquire-ftp', {'ftp': ftpStub});

const EventEmitter = require('events').EventEmitter;
// const sinon = require('sinon');

const assert = require('chai').assert;
var stub, readySpy;

describe('acquire-ftp', function() {
  it('should output a promise containing an array of streams', function (done) {
    const a = ferret({
      flags: {
        ftpHideProgress: true
      }
    }, {
      'acquire-ftp': acquireFtp,
      'output-test': mockPlugins['output-test']
    });

    assert.typeOf(a.then, 'function');

    a.then(function(data){
      assert.typeOf(data, 'array');
      data.forEach(s => {
        assert.typeOf(s.on, 'function');
        assert.typeOf(s.pipe, 'function');
      });
      done();
    }).catch((err)=>{
      throw(err);
      done();
    });
  });
});

function ftpStub() {
  return {
    connect: function() {
      return this;
    },
    on: function(eventName, cb) {
      return cb();
    },
    list: function(path) {
      var err = null;
      var list;

      if (typeof path !== 'function') {
        list = [
          {name: path + '/file1.xml', type: 'f'},
          {name: path + '/file2.xml', type: 'f'},
          {name: path + '/file3.xml', type: 'f'}
        ];
      } else { // This is the root directory
        list = [
          {name: 'results/', type: 'd'}
        ];
      }

      arguments[arguments.length -1](null, list);
    },
    get: function(pathString, cb) {
      cb(null, fs.createReadStream(path.join('test', 'fixtures', 'Local_Test_result_Derby_1.xml')));
    },
    end: function() {
      return;
    }
  };
}
