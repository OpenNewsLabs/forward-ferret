#!/usr/bin/env node

/**
 * This is the command line interface for Ferret. It loads plugins, parses flags, passes it onwards.
 */

'use strict';
const meow = require('meow');
const ferret = require('../lib/');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const changeCase = require('change-case')
const _ = require('lodash');

const manual = 'Please see the included Readme for usage instructions.';

const plugins = require('require-all')(process.env.FERRET_PLUGINS_DIR || path.join(__dirname, '..', 'plugins'));
const pluginFlags = Object.keys(plugins).reduce((last, name) => {
  return Object.assign(last, plugins[name].flags);
}, {});


const cli = meow(manual, {
    alias: pluginFlags
});

const specifiedPluginNames = Object.keys(cli.flags).map(d => {
  if (d === 'parseXml2js') {
    return 'parse-xml2js';
  }
  return changeCase.paramCase(d);
});
const specifiedPlugins = _.filter(plugins, (v,k) => {
  return specifiedPluginNames.indexOf(k) > -1;
});

var a = ferret(cli, specifiedPlugins)
.catch((e) => {
  console.error(chalk.red(e.stack));
  process.exit(1);
});

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
