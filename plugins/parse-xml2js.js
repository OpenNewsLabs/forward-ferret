/**
 * parseXml2Js: Parse an array of XML streams into an array of JS objects
 */

'use strict';

const path = require('path');
const xml2js = require('xml2js'); // TODO replace with xml4js if PA ever adds xmlns attrs to their XML
const Promise = require('bluebird');
const parserOptions = {}; // TODO add support for options
const parser = Promise.promisify(new xml2js.Parser(parserOptions).parseString); // This makes xml2js return promises

function parseXml2Js(streamsPromise) {
  return new Promise((res, rej) => {
    streamsPromise.then((streams) => {
      let promises = [];
      let output = {};

      streams.forEach((stream) => {
        var streamPromise = new Promise(function(res, rej){
          let chunks = [];

          stream.on('data', (chunk) => {
            chunks.push(chunk);
          });

          stream.on('end', () => {
            let xmlString = Buffer.concat(chunks).toString('utf8'); // Convert to a string.
            parser(xmlString).then((data) => {
              res({
                file: path.basename(stream.path),
                xmlData: data
              });
            })
            .catch((e) => {
              rej(e);
            });
          });
        });
        promises.push(streamPromise);
      });

      Promise.all(promises).then((data) => {
        res(data);
      })
      .catch((e) => {
        rej(e);
      });
    });
  });
}


module.exports = {
  type: 'parse',
  priority: 0,
  function: parseXml2Js
};
