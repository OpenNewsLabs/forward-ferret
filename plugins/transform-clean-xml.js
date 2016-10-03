/**
 * transform-clean-xml:Simplify the structure of an xml2js-generated object
 */

'use strict';

const Promise = require('bluebird');

function cleanXml(promise) {
  return new Promise((res,rej) => {
    promise.then(arr=> {
      let cleaned = recursiveClean(arr);
      res(arr);
    });
  });
}

function recursiveClean(input) {
  if (Array.isArray(input)) {
    input.forEach(d => {
      d = recursiveClean(d);
    });
    if (input.length === 1) {
      input = input[0];    
    }
  } else if (typeof input === 'object') {
    const keys = Object.keys(input);
    keys.forEach(k => {
      input[k] = recursiveClean(input[k]);
    });
    if (keys.indexOf('$') > -1 && (typeof input['$'] === 'object')) {
      input = extractProperties(input,'$');
    }
  }
  return input;
}

// this bit extracts all properties from the $ object
// and moves them to the parent object
function extractProperties(obj, property) {
  let movedKeys = [];
  const subKeys = Object.keys(obj[property]);
  subKeys.forEach(k => {
    if (!(k in obj)) {
      obj[k] = obj[property][k];
      movedKeys.push(movedKeys);
    }
  });
  // if we've successfully copied all keys from the $ object, it's safe to delete
  if (subKeys.length === movedKeys.length) {
    delete obj[property];
  }
  return obj;
}

module.exports = {
  type: 'transform',
  priority: 0,
  function: cleanXml
};
