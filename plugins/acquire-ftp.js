/**
 * acquireFTP: Create a new stream from each file in the specified FTP directory.
 * Flags:
 * - ftpUser      FTP username
 * - ftpPassword  FTP password
 * - ftpHostname  FTP hostname
 */

'use strict';
const Client = require('ftp');
const ProgressBar = require('progress');
const Promise = require('bluebird');

function acquireFTP(options) {
  var ftpUser,
    ftpPassword,
    ftpHostname,
    hideProgress;

  if (this.flags) {
    ftpUser = this.flags.ftpUser;
    ftpPassword = this.flags.ftpPassword;
    ftpHostname = this.flags.ftpHostname;
    hideProgress = this.flags.ftpHideProgress;
  }

  const c = new Client();
  c.connect({
    host: ftpHostname || process.env.FTP_HOSTNAME || 'ftpout.pa.press.net',
    user: ftpUser || process.env.FTP_USERNAME,
    password: ftpPassword || process.env.FTP_PASSWORD
  });

  // Return this promise with a lot of logic in it.
  return new Promise((res, rej) => {
    let streams = [];

    c.on('ready', () => {
      c.list((err, list) => {
        if (err) rej(err);
        const dirs = list // Filter out unwanted and relative directory paths.
          .filter(v => v.type === 'd' && !v.name.match(/^\./))
          // .filter(v => !!~chosen.indexOf(v.name)); // @TODO FIX

        let dirPromises = [];

        dirs.forEach((dir) => {
          let p = new Promise((resolve, reject) => {
            c.list(dir.name, (err, files) => {
              if (err) reject(err);

              // Filter out files specified by filterOut. @TODO fix
              // files = files.filter((v) => {
              //   return !new RegExp(`(${ filters.join('|') })`, 'i').test(v.name);
              // });

              resolve({name: dir.name, files: files});
            });
          });

          dirPromises.push(p);
        });

        Promise.all(dirPromises)
        .then((dirs) => {
          let filePromises = [];

          dirs.forEach((dir) => {
            let files = dir.files.filter(v => v.type !== 'd' && v.name !== '.timestamp'); // Remove directories from list

            let bar;

            if (!hideProgress) {
              // Display a fancy progress bar like a total bawws
              bar = new ProgressBar('downloading ' + dir.name + ' [:bar] :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 50,
                total: files.length
              });
            } else {
              bar = {
                tick: function(){} // just a noop.
              };
            }


            // Loop through each filename...
            files.forEach((file) => {
              let p = new Promise((next, reject) => {
                // Get each file...
                c.get(`${dir.name}/${file.name}`, (err, stream) => {
                  if (err) reject(err);
                  streams.push(stream); // Add to main output
                  bar.tick();
                  next(); // Resolve promise
                });
              });

              filePromises.push(p);
            });
          });

          // Once these all resolve we know we have all of our streams.
          // In retrospect, mabbe I don't understand streams...
          Promise.all(filePromises)
          .then(() => {
            res(streams);
            c.end();
          })
        })
        .catch((e) => {
          console.log('error in Promise.all');
          rej(e);
        });
      });
    });
  });
}

module.exports = {
  type: 'acquire',
  priority: 0,
  function: acquireFTP,
  flags: {
    u: 'ftp-user',
    p: 'ftp-password',
    h: 'ftp-hostname'
  }
};
