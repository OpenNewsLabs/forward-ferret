'use strict';

const ferret = require('../lib/');
const acquireLocal = require('../plugins/acquire-local');
const parseToString = require('../plugins/parse-to-string');
const parseXML2JS = require('../plugins/parse-xml2js');
const transformReferendum = require('../plugins/transform-2016-uk-referendum');
const outputTest = require('./mocks/simple-plugins.mock')['output-test'];
const mktemp = require('mktemp');

const fs = require('fs');

const tmpdir = mktemp.createDirSync('/tmp/XXXXX');

const assert = require('chai').assert;
describe('transform-2016-uk-referendum', function() {
  it('should extract all relevant data from XML files', function (done) {
    this.timeout(3000);
    const a = ferret({
      flags: {
        localPath: __dirname + '/fixtures/june-8-test/*',
        localSave: tmpdir
      }
    }, {
      'acquire-local': acquireLocal,
      'parse-xml2js': parseXML2JS,
      'transform-2016-uk-transform': transformReferendum,
      'output-test': outputTest
    }).then(function(data){

        // console.log(JSON.stringify(data));

      // regional tests 
      assert.typeOf(data.timestamp, 'number');
      assert.equal(Object.keys(data.regions).length, 12);
      assert.typeOf(data.regions, 'object');
      const a = data.regions['02'];
      assert.typeOf(a, 'object');
      assert.equal(a.id, '02');
      assert.equal(a.name, 'Eastern');
      assert.equal(a.winningAnswerText, 'Leave the EU');
      assert.equal(a.called, false);
      assert.equal(a.areasReported, 16);
      assert.equal(a.reportedPercent, (16 / 47) * 100);
      assert.equal(a.remainVotes, 335244);
      assert.equal(a.leaveVotes, 385670);
      assert.typeOf(a.areas, 'object');
      assert.equal(Object.keys(a.areas).length, 47);

      
      
      // summary tests 
      assert.typeOf(data.numberOfResults, 'number');
      assert.equal(data.numberOfResults, 150);
      assert.equal(data.answers.length, 2);
      assert.typeOf(data.answers[0].votingAreas, 'number');
      assert.typeOf(data.answers[0].shortText, 'string');
      assert.typeOf(data.timestamp, 'number');
      
      // console.log(JSON.stringify(data));
      
      done();
    }).catch((err) => {
      throw(err);
      done();
    });
  });

  it('should extract minimal data for 1%', function (done) {
    this.timeout(3000);
    const a = ferret({
      flags: {
        localPath: __dirname + '/fixtures/june-15-test/001pc/test/results/*',
        localSave: tmpdir
      }
    }, {
      'acquire-local': acquireLocal,
      'parse-xml2js': parseXML2JS,
      'transform-2016-uk-transform': transformReferendum,
      'output-test': outputTest
    }).then(function(data){
        
      assert.equal(data.answers[0].percentageShare , 48.85);
      assert.notEqual(data.answers[0].percentageShare , 48);

      // regional tests 
      assert.typeOf(data.timestamp, 'number');
      const a = data.regions['03']
      assert.typeOf(a, 'object');
      assert.equal(a.id, '03');
      assert.equal(a.name, 'London');
      assert.equal(a.winningAnswerText, 'Leave the EU');
      assert.equal(a.called, false);
      assert.equal(a.areasReported, 2);
      assert.equal(a.reportedPercent, (2 / 33) * 100);
      assert.equal(a.remainVotes, 36946 + 47335);  
      assert.equal(a.leaveVotes, 50703 + 37547);
      assert.equal(Object.keys(a.areas).length, 33);
	  
	  // console.log(data.regions['01'])
	  
	  // empty region
      const b = data.regions['01'];
      assert.equal(b.id, '01');
      assert.equal(b.winningAnswerText, '');
      assert.equal(b.called, false);
      assert.equal(b.areasReported, 0);
      assert.equal(b.reportedPercent, 0);
      assert.equal(b.remainVotes, 0);  
      assert.equal(b.leaveVotes, 0);
      assert.equal(Object.keys(b.areas).length, 40);
      assert.equal(b.areas['106'].name, 'East Lindsey');
      assert.equal(b.areas['106'].remainVotes, 0);
	  
      // summary tests 
      assert.typeOf(data.numberOfResults, 'number');
      assert.equal(data.numberOfResults, 2);
      assert.equal(data.answers.length, 2);
      assert.typeOf(data.answers[0].votingAreas, 'number');
      assert.typeOf(data.answers[0].shortText, 'string');
      assert.typeOf(data.timestamp, 'number');
	  
      // console.log(JSON.stringify(data));
      
      done();
    }).catch((err) => {
      throw(err);
      done();
    });
  });

  it('should extract loadsa data for 100%', function (done) {
    this.timeout(3000);
    const a = ferret({
      flags: {
        localPath: __dirname + '/fixtures/june-15-test/100pc/test/results/*',
        localSave: tmpdir
      }
    }, {
      'acquire-local': acquireLocal,
      'parse-xml2js': parseXML2JS,
      'transform-2016-uk-transform': transformReferendum,
      'output-test': outputTest
    }).then(function(data){

      // regional tests 
      assert.typeOf(data.timestamp, 'number');
      const a = data.regions['04'];
      assert.typeOf(a, 'object');
      assert.equal(a.id, '04');
      assert.equal(a.name, 'North East');
      assert.equal(a.winningAnswerText, 'Leave the EU');
      assert.equal(a.called, true);
      assert.equal(a.areasReported, 12);
      assert.equal(a.reportedPercent, 100);
      assert.equal(a.remainVotes, 469674);  
      assert.equal(a.leaveVotes, 495620);
      assert.typeOf(a.turnout, 'number');
      assert.typeOf(a.electorate, 'number');
      assert.ok(a.turnout < a.electorate);
      assert.typeOf(a.areas, 'object');
      assert.equal(Object.keys(a.areas).length, 12);
    
      let reportedAreas = Object.keys(data.regions)
        .map(id => data.regions[id])
        .map(r => r.areasReported)
        .reduce((a,b) => a + b);
      assert.equal(reportedAreas, 382);
      assert.equal(
        Object.keys(data.regions)
          .map(id => data.regions[id])
          .filter(r => r.reportedPercent === 100)
          .length,
        Object.keys(data.regions).length
      );
      
      // smaller areas as property of larger regions
      const area = a.areas['130'];
      assert.equal(area.name, 'Gateshead');
      assert.equal(area.id, '130');
      assert.typeOf(area.electorate, 'number');
      assert.typeOf(area.turnout, 'number');
      assert.typeOf(area.regionId, 'string');
      assert.typeOf(area.leaveVotes, 'number');
      assert.typeOf(area.remainVotes, 'number');
      assert.typeOf(area.winningAnswerText, 'string');
    
      // summary tests 
      assert.typeOf(data.numberOfResults, 'number');
      assert.equal(data.numberOfResults, 382);
      assert.equal(data.answers.length, 2);
      assert.typeOf(data.answers[0].votingAreas, 'number');
      assert.typeOf(data.answers[0].shortText, 'string');
      assert.typeOf(data.timestamp, 'number');
      
      // check northern ireland
      const ni = data.regions['06'];
      assert.equal(Object.keys(ni.areas).length, 1);
      const nia = ni.areas['228'];
      assert.equal(ni.leaveVotes, nia.leaveVotes);
      assert.equal(ni.remainVotes, nia.remainVotes);
      
      // console.log(JSON.stringify(data));
      
      done();
    }).catch((err) => {
      throw(err);
      done();
    });
  });


});
