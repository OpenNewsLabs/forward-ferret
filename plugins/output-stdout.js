/**
 * acquireLocal: Standard Output output service. This is as simple as it gets — just stringify the data and print to STDOut.
 */

'use strict';

module.exports = {
  type: 'output',
  priority: 10,
  function: function(data) {
    data.then((data) => {
      console.log(JSON.stringify(data));
    });

    return data; // Also return the same promise so it can be used elsewhere.
  }
};
