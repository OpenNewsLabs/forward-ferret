/**
 * transform-2016-uk-referendum: Reformat xml2js'd data for 2016 UK referendum.
 */

'use strict';

const Promise = require('bluebird');
const jp = require('jsonpath');


function ukRefRegions(promise) {
  return new Promise((res,rej) => {
    promise.then(arr => {
      // get all result files
      
      const files = arr.filter(f => f.file.indexOf('EU_result') > -1);

      // Compile list of 382 areas
      let areas = {};
      removeDuplicateFiles(files)
        .forEach(f => {
          const d = f.xmlData;
          let number = jp.query(d, '$..number')[0];
          if (number.length === 1) {
            number = '00' + number;
          } else if (number.length === 2) {
            number = '0' + number;
          }
          let obj = {
            id:                number,
            name:              jp.query(d, '$..name')[1],
            winningAnswerText: jp.query(d, '$..winningAnswerText')[0],
            remainVotes:       jp.query(d, '$..Answer')[0][0]['$'].votes,
            leaveVotes:        jp.query(d, '$..Answer')[0][1]['$'].votes,
            regionId:          areaDict[number].regionId,
            turnout:           jp.query(d, '$..turnout')[0],
            electorate:        jp.query(d, '$..electorate')[0],
            called:            true
          }
          Object.keys(obj).forEach(key => {
            if ((obj[key] !== true) && (obj[key].match(/^\d+\.*\d*$/) !== null) && (!key.toLowerCase().match('id'))) {
              obj[key] = parseInt(obj[key], 10);
            }
          });          
          areas[number] = obj;
        });
      
      // add any missing areas
      Object.keys(areaDict).forEach(function(areaId) {
        if (areas[areaId] === undefined) {
          areas[areaId] = {
            id:                areaId,
            name:              areaDict[areaId].name,
            winningAnswerText: '',
            remainVotes:       0,
            leaveVotes:        0,
            regionId:          areaDict[areaId].regionId,
            turnout:           0,
            electorate:        false,
            called:            false
          }
        }
      });
	  
      // Compile list of 12 regions, with contained areas as property
      const regions = {};
      regionList.forEach(d => {
        const areasInThisRegion = Object.keys(areas)
          .filter(id => areas[id].regionId === d.id)
          .map(id => areas[id]);
        let leaveVotes = 0;
        let remainVotes = 0;
        let turnout = 0;
        let electorate = 0;
        let winning = '';
        
        if (areasInThisRegion.length > 0) {
          remainVotes = areasInThisRegion
            .map(a => a.remainVotes)
            .reduce((a,b) => a + b);
          leaveVotes = areasInThisRegion
            .map(a => a.leaveVotes)
            .reduce((a,b) => a + b);
          turnout = areasInThisRegion
            .map(a => a.turnout)
            .reduce((a,b) => a + b);
          electorate = areasInThisRegion
            .map(a => a.electorate)
            .reduce((a,b) => a + b);
          winning = leaveVotes > remainVotes ? 'Leave the EU' : 'Remain a member of the EU';
          if (leaveVotes === remainVotes) {
            winning = '';
          }
        }
        let areasAsObj = {};
        areasInThisRegion.forEach(a => {
          areasAsObj[a.id] = a;
        });
        let calledAreas = areasInThisRegion.filter(d => d.called);
        regions[d.id] = {
          name:               d.name,
          id:                 d.id,
          remainVotes:        remainVotes,
          leaveVotes:         leaveVotes,
          areasReported:      calledAreas.length,
          reportedPercent:    (calledAreas.length / d.areas) * 100,
          called:             (calledAreas.length === d.areas),
          winningAnswerText:  winning,
          turnout:            turnout,
          electorate:         electorate,
          areas:              areasAsObj
        }
      });

      // add any missing regions
      regionList.forEach(function(region) {
        if (regions[region.id] === undefined) {
          const areasInThisRegion = Object.keys(areas)
            .filter(id => areas[id].regionId === region.id)
            .map(id => areas[id]);
          let areasAsObj = {};
          areasInThisRegion.forEach(a => {
            areasAsObj[a.id] = a;
          });
          regions[region.id] = {
            name:               region.name,
            id:                 region.id,
            remainVotes:        0,
            leaveVotes:         0,
            areasReported:      region.areas,
            reportedPercent:    0,
            called:             false,
            winningAnswerText:  '',
            turnout:            0,
            electorate:         false,
            areas:              areasAsObj
          }
        }
      });
      
      // Calculate national totals
      const totals = arr
        .filter(f => f.file.indexOf('EU_running_totals') > -1)
        .map(f => {
          const split = f.file.split('_');
          f.number = parseInt(split[split.length - 1], 10);
          return f;
        })
        .sort((a,b) => {
          return b.number - a.number;
        });
      
      const latest = totals[0].xmlData;
            
      const numberOfResults = parseInt(jp.query(latest, '$..numberOfResults')[0], 10);
      const totalVotingAreas = parseInt(jp.query(latest, '$..totalVotingAreas')[0], 10);
      let answers = jp.query(latest, '$..Answer')[0].map(a => a['$']);
      answers.forEach(a => {
        Object.keys(a).forEach(key => {
          if ((key !== 'percentageShare') && (a[key].match(/^\d+\.*\d*$/) !== null)) {
            a[key] = parseInt(a[key], 10);
          }
        });
      });
      
      // resolve promise with JSON
      res({
        numberOfResults: numberOfResults,
        totalVotingAreas: totalVotingAreas,
        answers: answers,
        regions: regions,
        timestamp: Date.now()
      });
    });
  });
}

module.exports = {
  type: 'transform',
  priority: 0,
  function: ukRefRegions
};

function removeDuplicateFiles(arr) {
  let dict = {};
  arr.forEach(a => {
    const fileArr = a.file.split(/(_\d+\.xml)/g);
    if (!(fileArr[0] in dict)) {
      dict[fileArr[0]] = [fileArr[1]];
    } else {
      dict[fileArr[0]].push(fileArr[1]);
    }
  });
  const wanted = Object.keys(dict).map(key => {
    let copies = dict[key].sort();
    return key + copies[copies.length-1] ;
  });
  return arr.filter(f => wanted.indexOf(f.file) > -1);
}


const regionList = [
  { id: '01', name: 'East Midlands'          , areas:  40  },
  { id: '02', name: 'Eastern'                , areas:  47  },
  { id: '03', name: 'London'                 , areas:  33  },
  { id: '04', name: 'North East'             , areas:  12  },
  { id: '05', name: 'North West'             , areas:  39  },
  { id: '06', name: 'Northern Ireland'       , areas:   1  },
  { id: '07', name: 'Scotland'               , areas:  32  },
  { id: '08', name: 'South East'             , areas:  67  },
  { id: '09', name: 'South West & Gibraltar' , areas:  38  },
  { id: '10', name: 'Wales'                  , areas:  22  },
  { id: '11', name: 'West Midlands'          , areas:  30  },
  { id: '12', name: 'Yorkshire & The Humber' , areas:  21  }
];

const areaDict = {
  "100": {
    "name": "East Cambridgeshire",
    "region": "Eastern",
    "regionId": "02"
  },
  "101": {
    "name": "East Devon",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "102": {
    "name": "East Dorset",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "103": {
    "name": "East Dunbartonshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "104": {
    "name": "East Hampshire",
    "region": "South East",
    "regionId": "08"
  },
  "105": {
    "name": "East Hertfordshire",
    "region": "Eastern",
    "regionId": "02"
  },
  "106": {
    "name": "East Lindsey",
    "region": "East Midlands",
    "regionId": "01"
  },
  "107": {
    "name": "East Lothian",
    "region": "Scotland",
    "regionId": "07"
  },
  "108": {
    "name": "East Northamptonshire",
    "region": "East Midlands",
    "regionId": "01"
  },
  "109": {
    "name": "East Renfrewshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "110": {
    "name": "East Riding of Yorkshire",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "111": {
    "name": "East Staffordshire",
    "region": "West Midlands",
    "regionId": "11"
  },
  "112": {
    "name": "Eastbourne",
    "region": "South East",
    "regionId": "08"
  },
  "113": {
    "name": "Eastleigh",
    "region": "South East",
    "regionId": "08"
  },
  "114": {
    "name": "Eden",
    "region": "North West",
    "regionId": "05"
  },
  "115": {
    "name": "Edinburgh",
    "region": "Scotland",
    "regionId": "07"
  },
  "116": {
    "name": "Elmbridge",
    "region": "South East",
    "regionId": "08"
  },
  "117": {
    "name": "Enfield",
    "region": "London",
    "regionId": "03"
  },
  "118": {
    "name": "Epping Forest",
    "region": "Eastern",
    "regionId": "02"
  },
  "119": {
    "name": "Epsom & Ewell",
    "region": "South East",
    "regionId": "08"
  },
  "120": {
    "name": "Erewash",
    "region": "East Midlands",
    "regionId": "01"
  },
  "121": {
    "name": "Exeter",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "122": {
    "name": "Falkirk",
    "region": "Scotland",
    "regionId": "07"
  },
  "123": {
    "name": "Fareham",
    "region": "South East",
    "regionId": "08"
  },
  "124": {
    "name": "Fenland",
    "region": "Eastern",
    "regionId": "02"
  },
  "125": {
    "name": "Fife",
    "region": "Scotland",
    "regionId": "07"
  },
  "126": {
    "name": "Flintshire",
    "region": "Wales",
    "regionId": "10"
  },
  "127": {
    "name": "Forest Heath",
    "region": "Eastern",
    "regionId": "02"
  },
  "128": {
    "name": "Forest of Dean",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "129": {
    "name": "Fylde",
    "region": "North West",
    "regionId": "05"
  },
  "130": {
    "name": "Gateshead",
    "region": "North East",
    "regionId": "04"
  },
  "131": {
    "name": "Gedling",
    "region": "East Midlands",
    "regionId": "01"
  },
  "132": {
    "name": "Gibraltar",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "133": {
    "name": "Glasgow",
    "region": "Scotland",
    "regionId": "07"
  },
  "134": {
    "name": "Gloucester",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "135": {
    "name": "Gosport",
    "region": "South East",
    "regionId": "08"
  },
  "136": {
    "name": "Gravesham",
    "region": "South East",
    "regionId": "08"
  },
  "137": {
    "name": "Great Yarmouth",
    "region": "Eastern",
    "regionId": "02"
  },
  "138": {
    "name": "Greenwich",
    "region": "London",
    "regionId": "03"
  },
  "139": {
    "name": "Guildford",
    "region": "South East",
    "regionId": "08"
  },
  "140": {
    "name": "Gwynedd",
    "region": "Wales",
    "regionId": "10"
  },
  "141": {
    "name": "Hackney",
    "region": "London",
    "regionId": "03"
  },
  "142": {
    "name": "Halton",
    "region": "North West",
    "regionId": "05"
  },
  "143": {
    "name": "Hambleton",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "144": {
    "name": "Hammersmith & Fulham",
    "region": "London",
    "regionId": "03"
  },
  "145": {
    "name": "Harborough",
    "region": "East Midlands",
    "regionId": "01"
  },
  "146": {
    "name": "Haringey",
    "region": "London",
    "regionId": "03"
  },
  "147": {
    "name": "Harlow",
    "region": "Eastern",
    "regionId": "02"
  },
  "148": {
    "name": "Harrogate",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "149": {
    "name": "Harrow",
    "region": "London",
    "regionId": "03"
  },
  "150": {
    "name": "Hart",
    "region": "South East",
    "regionId": "08"
  },
  "151": {
    "name": "Hartlepool",
    "region": "North East",
    "regionId": "04"
  },
  "152": {
    "name": "Hastings",
    "region": "South East",
    "regionId": "08"
  },
  "153": {
    "name": "Havant",
    "region": "South East",
    "regionId": "08"
  },
  "154": {
    "name": "Havering",
    "region": "London",
    "regionId": "03"
  },
  "155": {
    "name": "Herefordshire",
    "region": "West Midlands",
    "regionId": "11"
  },
  "156": {
    "name": "Hertsmere",
    "region": "Eastern",
    "regionId": "02"
  },
  "157": {
    "name": "High Peak",
    "region": "East Midlands",
    "regionId": "01"
  },
  "158": {
    "name": "Highland",
    "region": "Scotland",
    "regionId": "07"
  },
  "159": {
    "name": "Hillingdon",
    "region": "London",
    "regionId": "03"
  },
  "160": {
    "name": "Hinckley & Bosworth",
    "region": "East Midlands",
    "regionId": "01"
  },
  "161": {
    "name": "Horsham",
    "region": "South East",
    "regionId": "08"
  },
  "162": {
    "name": "Hounslow",
    "region": "London",
    "regionId": "03"
  },
  "163": {
    "name": "Huntingdonshire",
    "region": "Eastern",
    "regionId": "02"
  },
  "164": {
    "name": "Hyndburn",
    "region": "North West",
    "regionId": "05"
  },
  "165": {
    "name": "Inverclyde",
    "region": "Scotland",
    "regionId": "07"
  },
  "166": {
    "name": "Ipswich",
    "region": "Eastern",
    "regionId": "02"
  },
  "167": {
    "name": "Isle of Wight",
    "region": "South East",
    "regionId": "08"
  },
  "168": {
    "name": "Isles of Scilly",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "169": {
    "name": "Islington",
    "region": "London",
    "regionId": "03"
  },
  "170": {
    "name": "Kensington & Chelsea",
    "region": "London",
    "regionId": "03"
  },
  "171": {
    "name": "Kettering",
    "region": "East Midlands",
    "regionId": "01"
  },
  "172": {
    "name": "King's Lynn & West Norfolk",
    "region": "Eastern",
    "regionId": "02"
  },
  "173": {
    "name": "Kingston-upon-Hull",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "174": {
    "name": "Kingston-upon-Thames",
    "region": "London",
    "regionId": "03"
  },
  "175": {
    "name": "Kirklees",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "176": {
    "name": "Knowsley",
    "region": "North West",
    "regionId": "05"
  },
  "177": {
    "name": "Lambeth",
    "region": "London",
    "regionId": "03"
  },
  "178": {
    "name": "Lancaster",
    "region": "North West",
    "regionId": "05"
  },
  "179": {
    "name": "Leeds",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "180": {
    "name": "Leicester",
    "region": "East Midlands",
    "regionId": "01"
  },
  "181": {
    "name": "Lewes",
    "region": "South East",
    "regionId": "08"
  },
  "182": {
    "name": "Lewisham",
    "region": "London",
    "regionId": "03"
  },
  "183": {
    "name": "Lichfield",
    "region": "West Midlands",
    "regionId": "11"
  },
  "184": {
    "name": "Lincoln",
    "region": "East Midlands",
    "regionId": "01"
  },
  "185": {
    "name": "Liverpool",
    "region": "North West",
    "regionId": "05"
  },
  "186": {
    "name": "Luton",
    "region": "Eastern",
    "regionId": "02"
  },
  "187": {
    "name": "Maidstone",
    "region": "South East",
    "regionId": "08"
  },
  "188": {
    "name": "Maldon",
    "region": "Eastern",
    "regionId": "02"
  },
  "189": {
    "name": "Malvern Hills",
    "region": "West Midlands",
    "regionId": "11"
  },
  "190": {
    "name": "Manchester",
    "region": "North West",
    "regionId": "05"
  },
  "191": {
    "name": "Mansfield",
    "region": "East Midlands",
    "regionId": "01"
  },
  "192": {
    "name": "Medway",
    "region": "South East",
    "regionId": "08"
  },
  "193": {
    "name": "Melton",
    "region": "East Midlands",
    "regionId": "01"
  },
  "194": {
    "name": "Mendip",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "195": {
    "name": "Merthyr Tydfil",
    "region": "Wales",
    "regionId": "10"
  },
  "196": {
    "name": "Merton",
    "region": "London",
    "regionId": "03"
  },
  "197": {
    "name": "Mid Devon",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "198": {
    "name": "Mid Suffolk",
    "region": "Eastern",
    "regionId": "02"
  },
  "199": {
    "name": "Mid Sussex",
    "region": "South East",
    "regionId": "08"
  },
  "200": {
    "name": "Middlesbrough",
    "region": "North East",
    "regionId": "04"
  },
  "201": {
    "name": "Midlothian",
    "region": "Scotland",
    "regionId": "07"
  },
  "202": {
    "name": "Milton Keynes",
    "region": "South East",
    "regionId": "08"
  },
  "203": {
    "name": "Mole Valley",
    "region": "South East",
    "regionId": "08"
  },
  "204": {
    "name": "Monmouthshire",
    "region": "Wales",
    "regionId": "10"
  },
  "205": {
    "name": "Moray",
    "region": "Scotland",
    "regionId": "07"
  },
  "206": {
    "name": "Neath Port Talbot",
    "region": "Wales",
    "regionId": "10"
  },
  "207": {
    "name": "New Forest",
    "region": "South East",
    "regionId": "08"
  },
  "208": {
    "name": "Newark & Sherwood",
    "region": "East Midlands",
    "regionId": "01"
  },
  "209": {
    "name": "Newcastle-under-Lyme",
    "region": "West Midlands",
    "regionId": "11"
  },
  "210": {
    "name": "Newcastle-upon-Tyne",
    "region": "North East",
    "regionId": "04"
  },
  "211": {
    "name": "Newham",
    "region": "London",
    "regionId": "03"
  },
  "212": {
    "name": "Newport",
    "region": "Wales",
    "regionId": "10"
  },
  "213": {
    "name": "North Ayrshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "214": {
    "name": "North Devon",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "215": {
    "name": "North Dorset",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "216": {
    "name": "North East Derbyshire",
    "region": "East Midlands",
    "regionId": "01"
  },
  "217": {
    "name": "North East Lincolnshire",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "218": {
    "name": "North Hertfordshire",
    "region": "Eastern",
    "regionId": "02"
  },
  "219": {
    "name": "North Kesteven",
    "region": "East Midlands",
    "regionId": "01"
  },
  "220": {
    "name": "North Lanarkshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "221": {
    "name": "North Lincolnshire",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "222": {
    "name": "North Norfolk",
    "region": "Eastern",
    "regionId": "02"
  },
  "223": {
    "name": "North Somerset",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "224": {
    "name": "North Tyneside",
    "region": "North East",
    "regionId": "04"
  },
  "225": {
    "name": "North Warwickshire",
    "region": "West Midlands",
    "regionId": "11"
  },
  "226": {
    "name": "North West Leicestershire",
    "region": "East Midlands",
    "regionId": "01"
  },
  "227": {
    "name": "Northampton",
    "region": "East Midlands",
    "regionId": "01"
  },
  "228": {
    "name": "Northern Ireland",
    "region": "Northern Ireland",
    "regionId": "06"
  },
  "229": {
    "name": "Northumberland",
    "region": "North East",
    "regionId": "04"
  },
  "230": {
    "name": "Norwich",
    "region": "Eastern",
    "regionId": "02"
  },
  "231": {
    "name": "Nottingham",
    "region": "East Midlands",
    "regionId": "01"
  },
  "232": {
    "name": "Nuneaton & Bedworth",
    "region": "West Midlands",
    "regionId": "11"
  },
  "233": {
    "name": "Oadby & Wigston",
    "region": "East Midlands",
    "regionId": "01"
  },
  "234": {
    "name": "Oldham",
    "region": "North West",
    "regionId": "05"
  },
  "235": {
    "name": "Orkney Islands",
    "region": "Scotland",
    "regionId": "07"
  },
  "236": {
    "name": "Oxford",
    "region": "South East",
    "regionId": "08"
  },
  "237": {
    "name": "Pembrokeshire",
    "region": "Wales",
    "regionId": "10"
  },
  "238": {
    "name": "Pendle",
    "region": "North West",
    "regionId": "05"
  },
  "239": {
    "name": "Perth & Kinross",
    "region": "Scotland",
    "regionId": "07"
  },
  "240": {
    "name": "Peterborough",
    "region": "Eastern",
    "regionId": "02"
  },
  "241": {
    "name": "Plymouth",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "242": {
    "name": "Poole",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "243": {
    "name": "Portsmouth",
    "region": "South East",
    "regionId": "08"
  },
  "244": {
    "name": "Powys",
    "region": "Wales",
    "regionId": "10"
  },
  "245": {
    "name": "Preston",
    "region": "North West",
    "regionId": "05"
  },
  "246": {
    "name": "Purbeck",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "247": {
    "name": "Reading",
    "region": "South East",
    "regionId": "08"
  },
  "248": {
    "name": "Redbridge",
    "region": "London",
    "regionId": "03"
  },
  "249": {
    "name": "Redcar & Cleveland",
    "region": "North East",
    "regionId": "04"
  },
  "250": {
    "name": "Redditch",
    "region": "West Midlands",
    "regionId": "11"
  },
  "251": {
    "name": "Reigate & Banstead",
    "region": "South East",
    "regionId": "08"
  },
  "252": {
    "name": "Renfrewshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "253": {
    "name": "Rhondda Cynon Taf",
    "region": "Wales",
    "regionId": "10"
  },
  "254": {
    "name": "Ribble Valley",
    "region": "North West",
    "regionId": "05"
  },
  "255": {
    "name": "Richmond-upon-Thames",
    "region": "London",
    "regionId": "03"
  },
  "256": {
    "name": "Richmondshire",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "257": {
    "name": "Rochdale",
    "region": "North West",
    "regionId": "05"
  },
  "258": {
    "name": "Rochford",
    "region": "Eastern",
    "regionId": "02"
  },
  "259": {
    "name": "Rossendale",
    "region": "North West",
    "regionId": "05"
  },
  "260": {
    "name": "Rother",
    "region": "South East",
    "regionId": "08"
  },
  "261": {
    "name": "Rotherham",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "262": {
    "name": "Rugby",
    "region": "West Midlands",
    "regionId": "11"
  },
  "263": {
    "name": "Runnymede",
    "region": "South East",
    "regionId": "08"
  },
  "264": {
    "name": "Rushcliffe",
    "region": "East Midlands",
    "regionId": "01"
  },
  "265": {
    "name": "Rushmoor",
    "region": "South East",
    "regionId": "08"
  },
  "266": {
    "name": "Rutland",
    "region": "East Midlands",
    "regionId": "01"
  },
  "267": {
    "name": "Ryedale",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "268": {
    "name": "Salford",
    "region": "North West",
    "regionId": "05"
  },
  "269": {
    "name": "Sandwell",
    "region": "West Midlands",
    "regionId": "11"
  },
  "270": {
    "name": "Scarborough",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "271": {
    "name": "Scottish Borders",
    "region": "Scotland",
    "regionId": "07"
  },
  "272": {
    "name": "Sedgemoor",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "273": {
    "name": "Sefton",
    "region": "North West",
    "regionId": "05"
  },
  "274": {
    "name": "Selby",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "275": {
    "name": "Sevenoaks",
    "region": "South East",
    "regionId": "08"
  },
  "276": {
    "name": "Sheffield",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "277": {
    "name": "Shepway",
    "region": "South East",
    "regionId": "08"
  },
  "278": {
    "name": "Shetland Islands",
    "region": "Scotland",
    "regionId": "07"
  },
  "279": {
    "name": "Shropshire",
    "region": "West Midlands",
    "regionId": "11"
  },
  "280": {
    "name": "Slough",
    "region": "South East",
    "regionId": "08"
  },
  "281": {
    "name": "Solihull",
    "region": "West Midlands",
    "regionId": "11"
  },
  "282": {
    "name": "South Ayrshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "283": {
    "name": "South Bucks",
    "region": "South East",
    "regionId": "08"
  },
  "284": {
    "name": "South Cambridgeshire",
    "region": "Eastern",
    "regionId": "02"
  },
  "285": {
    "name": "South Derbyshire",
    "region": "East Midlands",
    "regionId": "01"
  },
  "286": {
    "name": "South Gloucestershire",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "287": {
    "name": "South Hams",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "288": {
    "name": "South Holland",
    "region": "East Midlands",
    "regionId": "01"
  },
  "289": {
    "name": "South Kesteven",
    "region": "East Midlands",
    "regionId": "01"
  },
  "290": {
    "name": "South Lakeland",
    "region": "North West",
    "regionId": "05"
  },
  "291": {
    "name": "South Lanarkshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "292": {
    "name": "South Norfolk",
    "region": "Eastern",
    "regionId": "02"
  },
  "293": {
    "name": "South Northamptonshire",
    "region": "East Midlands",
    "regionId": "01"
  },
  "294": {
    "name": "South Oxfordshire",
    "region": "South East",
    "regionId": "08"
  },
  "295": {
    "name": "South Ribble",
    "region": "North West",
    "regionId": "05"
  },
  "296": {
    "name": "South Somerset",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "297": {
    "name": "South Staffordshire",
    "region": "West Midlands",
    "regionId": "11"
  },
  "298": {
    "name": "South Tyneside",
    "region": "North East",
    "regionId": "04"
  },
  "299": {
    "name": "Southampton",
    "region": "South East",
    "regionId": "08"
  },
  "300": {
    "name": "Southend-on-Sea",
    "region": "Eastern",
    "regionId": "02"
  },
  "301": {
    "name": "Southwark",
    "region": "London",
    "regionId": "03"
  },
  "302": {
    "name": "Spelthorne",
    "region": "South East",
    "regionId": "08"
  },
  "303": {
    "name": "St Albans",
    "region": "Eastern",
    "regionId": "02"
  },
  "304": {
    "name": "St Edmundsbury",
    "region": "Eastern",
    "regionId": "02"
  },
  "305": {
    "name": "St Helens",
    "region": "North West",
    "regionId": "05"
  },
  "306": {
    "name": "Stafford",
    "region": "West Midlands",
    "regionId": "11"
  },
  "307": {
    "name": "Staffordshire Moorlands",
    "region": "West Midlands",
    "regionId": "11"
  },
  "308": {
    "name": "Stevenage",
    "region": "Eastern",
    "regionId": "02"
  },
  "309": {
    "name": "Stirling",
    "region": "Scotland",
    "regionId": "07"
  },
  "310": {
    "name": "Stockport",
    "region": "North West",
    "regionId": "05"
  },
  "311": {
    "name": "Stockton-on-Tees",
    "region": "North East",
    "regionId": "04"
  },
  "312": {
    "name": "Stoke-on-Trent",
    "region": "West Midlands",
    "regionId": "11"
  },
  "313": {
    "name": "Stratford-on-Avon",
    "region": "West Midlands",
    "regionId": "11"
  },
  "314": {
    "name": "Stroud",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "315": {
    "name": "Suffolk Coastal",
    "region": "Eastern",
    "regionId": "02"
  },
  "316": {
    "name": "Sunderland",
    "region": "North East",
    "regionId": "04"
  },
  "317": {
    "name": "Surrey Heath",
    "region": "South East",
    "regionId": "08"
  },
  "318": {
    "name": "Sutton",
    "region": "London",
    "regionId": "03"
  },
  "319": {
    "name": "Swale",
    "region": "South East",
    "regionId": "08"
  },
  "320": {
    "name": "Swansea",
    "region": "Wales",
    "regionId": "10"
  },
  "321": {
    "name": "Swindon",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "322": {
    "name": "Tameside",
    "region": "North West",
    "regionId": "05"
  },
  "323": {
    "name": "Tamworth",
    "region": "West Midlands",
    "regionId": "11"
  },
  "324": {
    "name": "Tandridge",
    "region": "South East",
    "regionId": "08"
  },
  "325": {
    "name": "Taunton Deane",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "326": {
    "name": "Teignbridge",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "327": {
    "name": "Telford & Wrekin",
    "region": "West Midlands",
    "regionId": "11"
  },
  "328": {
    "name": "Tendring",
    "region": "Eastern",
    "regionId": "02"
  },
  "329": {
    "name": "Test Valley",
    "region": "South East",
    "regionId": "08"
  },
  "330": {
    "name": "Tewkesbury",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "331": {
    "name": "Thanet",
    "region": "South East",
    "regionId": "08"
  },
  "332": {
    "name": "Three Rivers",
    "region": "Eastern",
    "regionId": "02"
  },
  "333": {
    "name": "Thurrock",
    "region": "Eastern",
    "regionId": "02"
  },
  "334": {
    "name": "Tonbridge & Malling",
    "region": "South East",
    "regionId": "08"
  },
  "335": {
    "name": "Torbay",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "336": {
    "name": "Torfaen",
    "region": "Wales",
    "regionId": "10"
  },
  "337": {
    "name": "Torridge",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "338": {
    "name": "Tower Hamlets",
    "region": "London",
    "regionId": "03"
  },
  "339": {
    "name": "Trafford",
    "region": "North West",
    "regionId": "05"
  },
  "340": {
    "name": "Tunbridge Wells",
    "region": "South East",
    "regionId": "08"
  },
  "341": {
    "name": "Uttlesford",
    "region": "Eastern",
    "regionId": "02"
  },
  "342": {
    "name": "Vale of Glamorgan",
    "region": "Wales",
    "regionId": "10"
  },
  "343": {
    "name": "Vale of White Horse",
    "region": "South East",
    "regionId": "08"
  },
  "344": {
    "name": "Wakefield",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "345": {
    "name": "Walsall",
    "region": "West Midlands",
    "regionId": "11"
  },
  "346": {
    "name": "Waltham Forest",
    "region": "London",
    "regionId": "03"
  },
  "347": {
    "name": "Wandsworth",
    "region": "London",
    "regionId": "03"
  },
  "348": {
    "name": "Warrington",
    "region": "North West",
    "regionId": "05"
  },
  "349": {
    "name": "Warwick",
    "region": "West Midlands",
    "regionId": "11"
  },
  "350": {
    "name": "Watford",
    "region": "Eastern",
    "regionId": "02"
  },
  "351": {
    "name": "Waveney",
    "region": "Eastern",
    "regionId": "02"
  },
  "352": {
    "name": "Waverley",
    "region": "South East",
    "regionId": "08"
  },
  "353": {
    "name": "Wealden",
    "region": "South East",
    "regionId": "08"
  },
  "354": {
    "name": "Wellingborough",
    "region": "East Midlands",
    "regionId": "01"
  },
  "355": {
    "name": "Welwyn Hatfield",
    "region": "Eastern",
    "regionId": "02"
  },
  "356": {
    "name": "West Berkshire",
    "region": "South East",
    "regionId": "08"
  },
  "357": {
    "name": "West Devon",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "358": {
    "name": "West Dorset",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "359": {
    "name": "West Dunbartonshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "360": {
    "name": "West Lancashire",
    "region": "North West",
    "regionId": "05"
  },
  "361": {
    "name": "West Lindsey",
    "region": "East Midlands",
    "regionId": "01"
  },
  "362": {
    "name": "West Lothian",
    "region": "Scotland",
    "regionId": "07"
  },
  "363": {
    "name": "West Oxfordshire",
    "region": "South East",
    "regionId": "08"
  },
  "364": {
    "name": "West Somerset",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "365": {
    "name": "Westminster",
    "region": "London",
    "regionId": "03"
  },
  "366": {
    "name": "Weymouth & Portland",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "367": {
    "name": "Wigan",
    "region": "North West",
    "regionId": "05"
  },
  "368": {
    "name": "Wiltshire",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "369": {
    "name": "Winchester",
    "region": "South East",
    "regionId": "08"
  },
  "370": {
    "name": "Windsor & Maidenhead Royal",
    "region": "South East",
    "regionId": "08"
  },
  "371": {
    "name": "Wirral",
    "region": "North West",
    "regionId": "05"
  },
  "372": {
    "name": "Woking",
    "region": "South East",
    "regionId": "08"
  },
  "373": {
    "name": "Wokingham",
    "region": "South East",
    "regionId": "08"
  },
  "374": {
    "name": "Wolverhampton",
    "region": "West Midlands",
    "regionId": "11"
  },
  "375": {
    "name": "Worcester",
    "region": "West Midlands",
    "regionId": "11"
  },
  "376": {
    "name": "Worthing",
    "region": "South East",
    "regionId": "08"
  },
  "377": {
    "name": "Wrexham",
    "region": "Wales",
    "regionId": "10"
  },
  "378": {
    "name": "Wychavon",
    "region": "West Midlands",
    "regionId": "11"
  },
  "379": {
    "name": "Wycombe",
    "region": "South East",
    "regionId": "08"
  },
  "380": {
    "name": "Wyre",
    "region": "North West",
    "regionId": "05"
  },
  "381": {
    "name": "Wyre Forest",
    "region": "West Midlands",
    "regionId": "11"
  },
  "382": {
    "name": "York",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "005": {
    "name": "Amber Valley",
    "region": "East Midlands",
    "regionId": "01"
  },
  "010": {
    "name": "Ashfield",
    "region": "East Midlands",
    "regionId": "01"
  },
  "020": {
    "name": "Bassetlaw",
    "region": "East Midlands",
    "regionId": "01"
  },
  "025": {
    "name": "Blaby",
    "region": "East Midlands",
    "regionId": "01"
  },
  "029": {
    "name": "Bolsover",
    "region": "East Midlands",
    "regionId": "01"
  },
  "031": {
    "name": "Boston",
    "region": "East Midlands",
    "regionId": "01"
  },
  "046": {
    "name": "Broxtowe",
    "region": "East Midlands",
    "regionId": "01"
  },
  "061": {
    "name": "Charnwood",
    "region": "East Midlands",
    "regionId": "01"
  },
  "067": {
    "name": "Chesterfield",
    "region": "East Midlands",
    "regionId": "01"
  },
  "078": {
    "name": "Corby",
    "region": "East Midlands",
    "regionId": "01"
  },
  "088": {
    "name": "Daventry",
    "region": "East Midlands",
    "regionId": "01"
  },
  "090": {
    "name": "Derby",
    "region": "East Midlands",
    "regionId": "01"
  },
  "091": {
    "name": "Derbyshire Dales",
    "region": "East Midlands",
    "regionId": "01"
  },
  "013": {
    "name": "Babergh",
    "region": "Eastern",
    "regionId": "02"
  },
  "018": {
    "name": "Basildon",
    "region": "Eastern",
    "regionId": "02"
  },
  "022": {
    "name": "Bedford",
    "region": "Eastern",
    "regionId": "02"
  },
  "035": {
    "name": "Braintree",
    "region": "Eastern",
    "regionId": "02"
  },
  "036": {
    "name": "Breckland",
    "region": "Eastern",
    "regionId": "02"
  },
  "038": {
    "name": "Brentwood",
    "region": "Eastern",
    "regionId": "02"
  },
  "042": {
    "name": "Broadland",
    "region": "Eastern",
    "regionId": "02"
  },
  "045": {
    "name": "Broxbourne",
    "region": "Eastern",
    "regionId": "02"
  },
  "051": {
    "name": "Cambridge",
    "region": "Eastern",
    "regionId": "02"
  },
  "058": {
    "name": "Castle Point",
    "region": "Eastern",
    "regionId": "02"
  },
  "059": {
    "name": "Central Bedfordshire",
    "region": "Eastern",
    "regionId": "02"
  },
  "062": {
    "name": "Chelmsford",
    "region": "Eastern",
    "regionId": "02"
  },
  "074": {
    "name": "Colchester",
    "region": "Eastern",
    "regionId": "02"
  },
  "085": {
    "name": "Dacorum",
    "region": "Eastern",
    "regionId": "02"
  },
  "014": {
    "name": "Barking & Dagenham",
    "region": "London",
    "regionId": "03"
  },
  "015": {
    "name": "Barnet",
    "region": "London",
    "regionId": "03"
  },
  "023": {
    "name": "Bexley",
    "region": "London",
    "regionId": "03"
  },
  "037": {
    "name": "Brent",
    "region": "London",
    "regionId": "03"
  },
  "043": {
    "name": "Bromley",
    "region": "London",
    "regionId": "03"
  },
  "052": {
    "name": "Camden",
    "region": "London",
    "regionId": "03"
  },
  "072": {
    "name": "City of London",
    "region": "London",
    "regionId": "03"
  },
  "084": {
    "name": "Croydon",
    "region": "London",
    "regionId": "03"
  },
  "098": {
    "name": "Ealing",
    "region": "London",
    "regionId": "03"
  },
  "086": {
    "name": "Darlington",
    "region": "North East",
    "regionId": "04"
  },
  "097": {
    "name": "Durham",
    "region": "North East",
    "regionId": "04"
  },
  "004": {
    "name": "Allerdale",
    "region": "North West",
    "regionId": "05"
  },
  "017": {
    "name": "Barrow-in-Furness",
    "region": "North West",
    "regionId": "05"
  },
  "026": {
    "name": "Blackburn with Darwen",
    "region": "North West",
    "regionId": "05"
  },
  "027": {
    "name": "Blackpool",
    "region": "North West",
    "regionId": "05"
  },
  "030": {
    "name": "Bolton",
    "region": "North West",
    "regionId": "05"
  },
  "047": {
    "name": "Burnley",
    "region": "North West",
    "regionId": "05"
  },
  "048": {
    "name": "Bury",
    "region": "North West",
    "regionId": "05"
  },
  "056": {
    "name": "Carlisle",
    "region": "North West",
    "regionId": "05"
  },
  "065": {
    "name": "Cheshire East",
    "region": "North West",
    "regionId": "05"
  },
  "066": {
    "name": "Cheshire West & Chester",
    "region": "North West",
    "regionId": "05"
  },
  "070": {
    "name": "Chorley",
    "region": "North West",
    "regionId": "05"
  },
  "077": {
    "name": "Copeland",
    "region": "North West",
    "regionId": "05"
  },
  "001": {
    "name": "Aberdeen",
    "region": "Scotland",
    "regionId": "07"
  },
  "002": {
    "name": "Aberdeenshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "007": {
    "name": "Angus",
    "region": "Scotland",
    "regionId": "07"
  },
  "008": {
    "name": "Argyll & Bute",
    "region": "Scotland",
    "regionId": "07"
  },
  "073": {
    "name": "Clackmannanshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "075": {
    "name": "Comhairle Nan Eilean Siar",
    "region": "Scotland",
    "regionId": "07"
  },
  "095": {
    "name": "Dumfries & Galloway",
    "region": "Scotland",
    "regionId": "07"
  },
  "096": {
    "name": "Dundee",
    "region": "Scotland",
    "regionId": "07"
  },
  "099": {
    "name": "East Ayrshire",
    "region": "Scotland",
    "regionId": "07"
  },
  "003": {
    "name": "Adur",
    "region": "South East",
    "regionId": "08"
  },
  "009": {
    "name": "Arun",
    "region": "South East",
    "regionId": "08"
  },
  "011": {
    "name": "Ashford",
    "region": "South East",
    "regionId": "08"
  },
  "012": {
    "name": "Aylesbury Vale",
    "region": "South East",
    "regionId": "08"
  },
  "019": {
    "name": "Basingstoke & Deane",
    "region": "South East",
    "regionId": "08"
  },
  "033": {
    "name": "Bracknell Forest",
    "region": "South East",
    "regionId": "08"
  },
  "040": {
    "name": "Brighton & Hove",
    "region": "South East",
    "regionId": "08"
  },
  "054": {
    "name": "Canterbury",
    "region": "South East",
    "regionId": "08"
  },
  "064": {
    "name": "Cherwell",
    "region": "South East",
    "regionId": "08"
  },
  "068": {
    "name": "Chichester",
    "region": "South East",
    "regionId": "08"
  },
  "069": {
    "name": "Chiltern",
    "region": "South East",
    "regionId": "08"
  },
  "083": {
    "name": "Crawley",
    "region": "South East",
    "regionId": "08"
  },
  "087": {
    "name": "Dartford",
    "region": "South East",
    "regionId": "08"
  },
  "093": {
    "name": "Dover",
    "region": "South East",
    "regionId": "08"
  },
  "021": {
    "name": "Bath & North East Somerset",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "032": {
    "name": "Bournemouth",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "041": {
    "name": "Bristol",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "063": {
    "name": "Cheltenham",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "071": {
    "name": "Christchurch",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "079": {
    "name": "Cornwall",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "080": {
    "name": "Cotswold",
    "region": "South West & Gibraltar",
    "regionId": "09"
  },
  "006": {
    "name": "Anglesey",
    "region": "Wales",
    "regionId": "10"
  },
  "028": {
    "name": "Blaenau Gwent",
    "region": "Wales",
    "regionId": "10"
  },
  "039": {
    "name": "Bridgend",
    "region": "Wales",
    "regionId": "10"
  },
  "049": {
    "name": "Caerphilly",
    "region": "Wales",
    "regionId": "10"
  },
  "055": {
    "name": "Cardiff",
    "region": "Wales",
    "regionId": "10"
  },
  "057": {
    "name": "Carmarthenshire",
    "region": "Wales",
    "regionId": "10"
  },
  "060": {
    "name": "Ceredigion",
    "region": "Wales",
    "regionId": "10"
  },
  "076": {
    "name": "Conwy",
    "region": "Wales",
    "regionId": "10"
  },
  "089": {
    "name": "Denbighshire",
    "region": "Wales",
    "regionId": "10"
  },
  "024": {
    "name": "Birmingham",
    "region": "West Midlands",
    "regionId": "11"
  },
  "044": {
    "name": "Bromsgrove",
    "region": "West Midlands",
    "regionId": "11"
  },
  "053": {
    "name": "Cannock Chase",
    "region": "West Midlands",
    "regionId": "11"
  },
  "081": {
    "name": "Coventry",
    "region": "West Midlands",
    "regionId": "11"
  },
  "094": {
    "name": "Dudley",
    "region": "West Midlands",
    "regionId": "11"
  },
  "016": {
    "name": "Barnsley",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "034": {
    "name": "Bradford",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "050": {
    "name": "Calderdale",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "082": {
    "name": "Craven",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  },
  "092": {
    "name": "Doncaster",
    "region": "Yorkshire & The Humber",
    "regionId": "12"
  }
};