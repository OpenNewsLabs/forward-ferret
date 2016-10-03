/**
 * parseToString: Parse an array of streams into an array strings.
 */

'use strict';

const Promise = require('bluebird');

function parseToString(promise) {
  return new Promise((res, rej) => {
    promise.then(function(arr) {
      let promises = arr.map(streamToString);
      Promise.all(promises).then(res);
    });
  });
}

// returns promise resolving to string
function streamToString(stream) {
  return new Promise((res, rej) => {
    var output = '';
    stream.on('data',d=>{
      output += d;
    });
    stream.on('end',()=>{
      res(output)
    })
    stream.on('error',err=>{
      rej(err);
    });
  });
}


module.exports = {
  type: 'parse',
  priority: 0,
  function: parseToString
};
