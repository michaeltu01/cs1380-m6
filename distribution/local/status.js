const log = require('../util/log');
const distribution = global.distribution;
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const status = {};

global.moreStatus = {
  sid: global.distribution.util.id.getSID(global.nodeConfig),
  nid: global.distribution.util.id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  callback = callback || function() { };

  if (configuration === 'nid') {
    callback(null, global.moreStatus.nid);
    return;
  }
  if (configuration === 'sid') {
    callback(null, global.moreStatus.sid);
    return;
  }
  if (configuration === 'ip') {
    callback(null, global.nodeConfig.ip);
    return;
  }
  if (configuration === 'port') {
    callback(null, global.nodeConfig.port);
    return;
  }
  if (configuration === 'counts') {
    callback(null, global.moreStatus.counts);
    return;
  }
  if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
    return;
  }
  if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
    return;
  }
  callback(new Error('Status key not found'));
};

status.spawn = function(config, callback) {
  function buildStartupHandler(originalStartFn, spawnCallback) {
    const fnBody = `
      const startFunction = ${originalStartFn.toString()};
      
      const notifyParent = ${global.distribution.util.wire.createRPC(
        global.distribution.util.wire.toAsync(spawnCallback)
      ).toString()};

      try {
        startFunction();
        notifyParent(null, global.nodeConfig, () => {});
      } catch (error) {
        notifyParent(error, null, () => {});
      }
    `;
    return new Function(fnBody);
  }

  const nodeCfg = config;
  nodeCfg.onStart = nodeCfg.onStart || function() {};

  if (!nodeCfg.port || !nodeCfg.ip) {
    callback(new Error('Port and IP are required in the configuration'));
    return;
  }

  nodeCfg.onStart = buildStartupHandler(nodeCfg.onStart, callback);

  const distPath = path.resolve(__dirname, '../../distribution.js');
  
  const child = spawn(
    'node',
    [
      distPath,
      '--config',
      global.distribution.util.serialize(nodeCfg)
    ],
    {
      detached: true,
      stdio: 'inherit'
    }
  );
};

status.stop = function(callback) {
  callback = callback || function() {};
  callback(null, global.nodeConfig);
    
  global.distribution.node.server.close();
  process.exit(0);
};

// status.spawn = require('@brown-ds/distribution/distribution/local/status').spawn;
// status.stop = require('@brown-ds/distribution/distribution/local/status').stop;

module.exports = status;