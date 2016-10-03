/**
 * @module Ferret
 * @description This is the main controller for Ferret.
 * @returns It returns a promise, wherein all the plugins are ordered and then composed.
 */

const _ = require('lodash');
const Promise = require('bluebird');

module.exports = exports = function(options, plugins) {
  
  return new Promise((res, rej) => {
    // Acquire
    const acquirePlugins = Object.keys(plugins).map((name) => {
      if (plugins[name].type === 'acquire') return plugins[name];
    })
    .sort((a, b) => {
      return a.priority - b.priority;
    })
    .filter(_.identity);

    // Parse
    const parsePlugins = Object.keys(plugins).map((name) => {
      if (plugins[name].type === 'parse') return plugins[name];
    })
    .sort((a, b) => {
      return a.priority - b.priority;
    })
    .filter(_.identity);

    // Transform
    const transformPlugins = Object.keys(plugins).map((name) => {
      if (plugins[name].type === 'transform') return plugins[name];
    })
    .sort((a, b) => {
      return a.priority - b.priority;
    })
    .filter(_.identity);

    // Output
    const outputPlugins = Object.keys(plugins).map((name) => {
      if (plugins[name].type === 'output') return plugins[name];
    })
    .sort((a, b) => {
      return a.priority - b.priority;
    })
    .filter(_.identity);
    
    if (acquirePlugins.length === 0) {
      rej(new Error('No plugins with "acquire" type loaded.'));
    }
    if (outputPlugins.length === 0) {
      rej(new Error('No plugins with "output" type loaded.'));
    }

    // This concatenates all the above arrays and pulls out the exported function.
    try {
      const executionChain = _.concat(acquirePlugins, parsePlugins, transformPlugins, outputPlugins)
        .map((plugin) => {
          if (plugin && typeof plugin.function === 'function') return plugin.function;
        });
      
      const main = _.flow(executionChain); // Compose the execution chain...

      res(main.call(options)); // Finally, run the execution chain, resolving the promise with the output.
    } catch(e) {
      rej(e); // Or if it chokes, reject the promise.
    }
  });
}
