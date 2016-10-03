'use strict';

const ferret = require('../lib/');
const acquireLocal = require('../plugins/acquire-local');
const parseToString = require('../plugins/parse-to-string');
const parseXML2JS = require('../plugins/parse-xml2js');
const transformCleanXml = require('../plugins/transform-clean-xml');
const outputTest = require('./mocks/simple-plugins.mock')['output-test'];
const mktemp = require('mktemp');

const fs = require('fs');

const tmpdir = mktemp.createDirSync('/tmp/XXXXX');

const assert = require('chai').assert;
describe('transform-clean-xml', function() {
  it('should clean cruft resulting from xml2js', function (done) {
    this.timeout(3000);
    const a = ferret({
      flags: {
        localPath: __dirname + '/fixtures/old/*', // acquire plugin
        localSave: tmpdir // output plugin
      }
    }, {
      'acquire-local': acquireLocal,
      'parse-xml2js': parseXML2JS,
      'transform-clean-xml': transformCleanXml,
      'output-test': outputTest
    }).then(function(data){
      assert.ok('Constituency' in data[0].xmlData.ElectionNominations.Election);
      assert.ok('name' in data[0].xmlData.ElectionNominations.Election);
      assert.notOk('$' in data[0].xmlData.ElectionNominations.Election);
      done();
    }).catch((err) => {
      throw(err);
      done();
    });
  });
});
