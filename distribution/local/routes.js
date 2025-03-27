const routeMap = new Map();

function get(config, callback) {
  if (!callback) {
    return;
  }

  if (typeof config === 'string') {
    config = { service: config };
  }

  const serviceName = config.service;
  const groupId = config.gid;

  // distributed services
  if (groupId && groupId !== 'local') {
    callback(null, global.distribution[groupId][serviceName]);
    return;
  }

  // local services
  if (serviceName in routeMap) {
    callback(null, routeMap[serviceName]);
    return;
  }

  // rpc functions
  const rpcFunction = global.toLocal[serviceName];
  if (rpcFunction) {
    callback(null, { call: rpcFunction });
    return;
  }

  callback(new Error(`Service ${serviceName} not found in routes`));
}

function put(service, name, callback) {  
  routeMap[name] = service;
    
  if (callback) {
    callback(null, name);
  }
}

function rem(name, callback) {
  const service = routeMap[name];
  delete routeMap[name];
  callback(null, service);
}

module.exports = {get, put, rem};