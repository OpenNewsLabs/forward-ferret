/**
 * acquireLocal: Create a new stream from each file in the specified directory.
 * Flags:
 * - localPath    Glob / directory path
 */

'use strict';
const fs = require('fs');
const Promise = require('bluebird');
const glob = require("glob")
const isGlob = require('is-glob');

function acquireLocal(options) {
  this.flags = this.flags || {};
  const path = this.flags.localPath;

  return new Promise((res, rej) => {
    if (!this.flags || !path) {
      rej(new Error('acquire-local: No `local-path` specified.'));
    } else if( !isGlob(path) && !checkFileExists(path) ){
      rej(new Error(`acquire-local: '${path}' is a directory. Must specify a file or a glob.`))
    } else {
      glob(path, options, function (err, files) {
        if (err) {
          rej(err);
        }
        if (files.length === 0) {
          rej(new Error('acquire-local: No files matched.'))
        }
        files.forEach(f=>{
          try {
            fs.createReadStream(f).on('data',d=>{});
          } catch (err) {
            rej(err);
          }
        });
        let streams = files.map(function(f){
          return fs.createReadStream(f);
        });
        res(streams);
      });
    }
  });
}

module.exports = {
  type: 'acquire',
  priority: 0,
  function: acquireLocal,
  flags: {
    p: 'local-path'
  }
};


function checkFileExists(path) {
  try {
    let stats = fs.statSync(path);
    return stats.isFile();
  }
  catch (e) {
    return false;
  }
}