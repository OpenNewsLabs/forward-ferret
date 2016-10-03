/**
 * outputSaveLocal: Save strings or JSON objects to flat files.
 * Flags:
 * - localSave    Directory path
 */

'use strict';

const fs = require('fs');
const _ = require('lodash');

const outputSaveLocal = function(promise){

  let flags = this.flags;
  let outputDirectory = flags.localSave;

  return new Promise((res,rej)=>{
    if (!('then' in promise)) {
      rej(new Error('output-save-local: input is not a promise'));
    }
    if (!outputDirectory) {
      rej(new Error('output-save-local: must pass a local directory path via the `local-save` flag'));
    }

    if (!fs.existsSync(outputDirectory)){
        fs.mkdirSync(outputDirectory);
    }

    promise.then((data) => {
      if (Array.isArray(data)) {
        data.forEach(function(file,i){
          const fileType = typeof file;
          if (fileType === 'object') {
            // check for stream
            if (_.isFunction(file.on)) {
              return rej(new Error('output-save-local: data appears to be a stream and cannot be saved to disk'));
            }
            fs.writeFileSync(outputDirectory+'/'+i+'.json',JSON.stringify(file));
          } else if (fileType === 'string') {
            fs.writeFileSync(outputDirectory+'/'+i+'.txt',file);
          } else {
            return rej(new Error('output-save-local: data is neither an object nor a string'));
          }
        });
      } else {
        const file = data;
        const fileType = typeof file;
        if (fileType === 'object') {
          // check for stream
          if (_.isFunction(file.on)) {
            return rej(new Error('output-save-local: data appears to be a stream and cannot be saved to disk'));
          }
          fs.writeFileSync(outputDirectory+'/0.json',JSON.stringify(file));
        } else if (fileType === 'string') {
          fs.writeFileSync(outputDirectory+'/0.txt',file);
        } else {
          return rej(new Error('output-save-local: data is neither an object nor a string'));
        }
      }
      res(data);
    });
  });
}

module.exports = {
  type: 'output',
  priority: 0,
  function: outputSaveLocal
};
