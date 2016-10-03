# Forward Ferret

> **Reverse ferret:** “The moment when a newspaper, having reported an event with great conviction one week, says the opposite the following week with equal conviction.”<br/>— [Roland White, _The Sunday Times_, July 6, 2008](https://web.archive.org/web/20100415010356/http://www.timesonline.co.uk/tol/news/uk/article4275198.ece)

**Forward Ferret:** A command-line application for processing UK election data. Built by developers at the Times of London and the Wall Street Journal specifically for converting the Press Association's XML feeds into JSON.

## Table of Contents  

* [Installation](#installation)
* [Usage](#usage)  
* [Built-in plugins](#built-in-plugins)
* [Using programmatically](#using-programmatically)
* [Developer guide](#developer-guide)
* [Version history, contributors & license](#version-history)

## Installation

Make sure you have [Node.js](https://nodejs.org) v6.2.0 or higher installed. Then run:

	npm install forward-ferret -g

## Usage

Forward Ferret uses a plugin system which is configured using command-line flags.

For example, to convert XML on a remote FTP server to JSON, one could use the following:

    ferret \
      --acquire-ftp \
	  --ftp-user "YOUR_USERNAME" \
	  --ftp-password "YOUR_PASSWORD" \
	  --ftp-hostname "FTP_SERVER_ADDRESS" \
      --parse-xml2js \
      --transform-clean-xml \
      --output-stdout

In this example:

- The acquire plugin is `acquire-ftp`, which requires the configuration flags `ftp-user`, `ftp-password`, `ftp-hostname`.
- The parse plugin is `parse-xml2js`, which runs the XML files through [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js).
- The transform plugin is `transform-clean-xml`, which removes leftover cruft from the XML file.
- The output plugin is `output-stdout`, which effectively logs the output to the command line.

Forward Ferret will not run without specified acquire and output plugins.

See below for a [full list of plugins](#built-in-plugins).

## Built-in plugins

- **[Acquire](#acquire)**
    - [acquire-ftp](#acquire-ftp)
    - [acquire-local](#acquire-local)
- **[Parse](#parse)**
    - [parse-xml2js](#parse-xml2js)
    - [parse-to-string](#parse-to-string)
- **[Transform](#transform)**
    - [transform-clean-xml](#transform-clean-xml)
    - [transform-2016-uk-referendum](#transform-2016-uk-referendum)
- **[Output](#output)**
    - [output-stdout](#output-stdout)
    - [output-save-local](#output-save-local)

### Acquire

These plugins **acquire** data and convert them into arrays of streams.

#### acquire-ftp

Get the contents of files stored on a remote FTP server.

- **Flags:**
    - `ftp-user`
    - `ftp-password`
    - `ftp-hostname`
- **Output:** Array of streams, each containing content of a file

#### acquire-local

Get the contents of local files.

- **Flags:**
    - `local-path` Glob / directory path, e.g. `~/Documents/Downloads/*.xml`
        - Note: On the command line, this must be surrounded by double-quote marks
- **Output:** Array of streams, each containing content of a file

### Parse

These plugins **parse** arrays of streams and turns them into JSON (or, to be precise, in-memory JavaScript objects).

#### parse-xml2js

Convert XML strings to JS objects using the [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js) library.

- **Flags:** None
- **Input:** Array of streams, each containing raw text of file
- **Output:** Array of JS objects

#### parse-to-string

Convert array of streams to array of strings.

- **Flags:** None
- **Input:** Array of streams, each containing raw text of file
- **Output:** Array of JS objects

### Transform

These plugins **transform** JavaScript objects into a more desirable format.

#### transform-clean-xml

Simplify output of xml2js, flattening data in '$' and simplifying single-item arrays.

- **Flags:** None
- **Input:** Array of streams, each containing a JS object
- **Output:** Array of JS objects

#### transform-2016-uk-referendum

A plugin written specifically for the UK's 2016 referendum on EU membership.

- **Flags:** None
- **Input:** Array of xml2js-created JS objects
- **Output:** JS object


### Output

These plugins **output** the resulting data so it can be used elsewhere.

#### output-stdout

Print out the data to the terminal's 'standard output'. Basically like running `console.log` in Node.

- **Flags:** None
- **Input:** JS object
- **Output:** JS object

#### output-save-local

Save an array of strings (or JS objects) as flat files, named sequentially (`0.txt`, `1.txt`, etc).

- **Flags:**
    - `local-save` Local directory to save files in.
- **Input:** Array of strings or JS objects
- **Output:** Array of strings or JS objects


## Using Ferret programmatically

i.e. in a script, rather than on the command line.

    npm install forward-ferret --save

Then in a JavaScript file:

    const ferret = require('../lib/');
    let f = ferret(cli, plugins);

`ferret` returns a promise, which resolves to the output of the plugin chain.


## Developer guide

For those wanting to make their own plungs.

### Setup

Install Node and npm. Then clone or download this repo and run:

    npm install

### Testing

To run tests:

    npm test

### Plugin development

#### Plugin structure

```js
module.exports = {
  type: 'acquire', // see below for list of types
  priority: 0, // higher number means greater precedence
  function: function(inputPromise){
    // main plugin functionality goes here
    inputPromise.then(function(data){
      // do something with whatever data has been passed in
    });
    // make sure to return a promise!
  },
  // flags passed to the command line interface (using "meow")
  flags: {
    u: 'ftp-user',
    p: 'ftp-password',
    h: 'ftp-hostname'
  }
};
```

#### Plugin types

All inputs and outputs are wrapped in promises.

Type      | Input     | Output           | Example usage
---       | ---       | ---              | ---
acquire   | n/a       | array of streams | Fetch XML files from an FTP server (`acquire-ftp`)
parse     | stream    | js object        | Convert XML data into JS object (`parseXml2Js`)
transform | js object | js object        | 'Munge' data to desired format
output    | js object | n/a              | Output to stdout (`output-stdout`)

## Version history

**v1.0.1**

- Fix binary path in package.json

**v1.0.0**

- Initial public release

## Contributors

- [Ændrew Rininsland](https://github.com/aendrew)
- [Elliot Bentley](https://github.com/ejb)

## License

[ISC](/LICENSE)