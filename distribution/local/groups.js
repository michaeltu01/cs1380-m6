const id = require('../util/id');

const groupsMap = new Map();
groupsMap['all'] = {};

const groups = {};

groups.get = function(name, callback) {
  callback = callback || function() {};
  
  if (name in groupsMap) {
    callback(null, groupsMap[name]);
  } else {
    // console.log(`[groups.get] Group "${name}" not found`);
    callback(new Error('Group ' + name + ' not found'));
  }
};

groups.put = function(config, nodes, callback) {
  nodes = nodes || {};
  
  if (typeof config === 'string') {
    config = { gid: config };
  }
  // console.log(`[groups.put] Initializing group "${config.gid}" with nodes:`, nodes);
  groupsMap[config.gid] = nodes;

  Object.keys(nodes).forEach(nodeKey => {
    const node = nodes[nodeKey];
    const sid = id.getSID(node);
    groupsMap['all'][sid] = node;
  });

  global.distribution[config.gid] = {};

  // initialize distributed services
  const services = [
    'status', 'comm', 'gossip', 'groups', 'routes', 
    'mem', 'store', 'mr'
  ];

  services.forEach(service => {
    global.distribution[config.gid][service] = 
      require(`../all/${service}`)(config);
  });

  callback(null, nodes);
};

groups.del = function(name, callback) {
  if (name in groupsMap) {
    const nodes = groupsMap[name];
    // console.log(`[groups.del] Found group "${name}" to delete:`, nodes);
    delete groupsMap[name];
    // console.log(`[groups.del] Successfully deleted group "${name}"`);
    callback(null, nodes);
  } else {
    // console.log(`[groups.del] Group "${name}" not found`);
    callback(new Error('Group ' + name + ' not found'));
  }
};

groups.add = function(name, node, callback) {
  // console.log(`[groups.add] Adding node to group "${name}":`, node);
  
  callback = callback || function() {};
  const sid = id.getSID(node);
  
  if (name in groupsMap) {
    if (!groupsMap[name]) {
    //   console.log(`[groups.add] Initializing empty group: ${name}`);
      groupsMap[name] = {};
    }
    // console.log(`[groups.add] Generated SID for node: ${sid}`);
    
    groupsMap[name][sid] = node;
    groupsMap['all'][sid] = node;
    
    // console.log(`[groups.add] Updated groupsStore for "${name}":`, groupsMap[name]);
    // console.log(`[groups.add] Updated "all" group:`, groupsMap['all']);
    
    if (callback) {
      callback(null, groupsMap[name]);
    }
  } else {
    // console.log(`[groups.add] Cannot add node - group "${name}" not found`);
    if (callback) {
      callback(new Error('Group ' + name + ' not found'));
    }
  }
};

groups.rem = function(name, nodeId, callback) {
//   console.log(`[groups.rem] Removing node ${nodeId} from group "${name}"`);
  
  callback = callback || function() {};
  
  if (name in groupsMap) {
    // console.log(`[groups.rem] Found group "${name}". Removing node ${nodeId}`);
    delete groupsMap[name][nodeId];
    delete groupsMap['all'][nodeId];
    // console.log(`[groups.rem] Updated groupsStore for "${name}":`, groupsMaps[name]);
    // console.log(`[groups.rem] Updated "all" group:`, groupsMaps['all']);
    callback(null, groupsMap[name]);
  } else {
    // console.log(`[groups.rem] Cannot remove node - group "${name}" not found`);
    callback(new Error('Group ' + name + ' not found'));
  }
};

module.exports = groups;

// groups.get = require('@brown-ds/distribution/distribution/local/groups').get;
// groups.put = require('@brown-ds/distribution/distribution/local/groups').put;
// groups.add = require('@brown-ds/distribution/distribution/local/groups').add;
// groups.rem = require('@brown-ds/distribution/distribution/local/groups').rem;
// groups.del = require('@brown-ds/distribution/distribution/local/groups').del;