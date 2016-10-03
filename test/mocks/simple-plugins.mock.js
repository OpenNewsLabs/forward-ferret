'use strict';

let mockPlugins = {};
const Promise = require('bluebird');

mockPlugins['acquire-test-highpriority'] = {
  type: 'acquire',
  priority: 5,
  function: function(){
    return new Promise((res, rej) => {
      res({
        test: true,
        highpriority: true
      });
    });
  },
  flags: {}
};

mockPlugins['acquire-test'] = {
  type: 'acquire',
  priority: 0,
  function: function(){
    return new Promise((res, rej) => {
      res([{
        test: true,
        highpriority: false
      }]);
    });
  },
  flags: {}
};

mockPlugins['output-test'] = {
  type: 'output',
  priority: 0,
  function: function(promise){
    return promise;
  },
  flags: {}
};


module.exports = mockPlugins;

