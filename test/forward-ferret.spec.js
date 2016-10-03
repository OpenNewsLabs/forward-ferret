'use strict';

const ferret = require('../lib/');
const mockPlugins = require('./mocks/simple-plugins.mock');

const assert = require('chai').assert;
describe('ferret', function() {
  describe('plugin loading', function () {
    it('should throw an error when no acquire plugin is loaded', function (done) {
      const a = ferret({}, {}).catch(function(err){
        assert.equal(err.message,'No plugins with "acquire" type loaded.');
        done();
      });
    });
    it('should throw an error when no output plugin is loaded', function (done) {
      const a = ferret({}, {
        'acquire-test': mockPlugins['acquire-test']
      }).catch(function(err){
        assert.equal(err.message,'No plugins with "output" type loaded.');
        done();
      });
    });
    it('should prioritise plugins with higher priority', function (done) {
      const a = ferret({}, mockPlugins);
      a.then(function(data){
        assert.equal( data.highpriority, true );
        done();
      }, function(err){
        throw(err);
        done();
      });
    });
  });
});
