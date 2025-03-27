// get the node responsible for a key
function getNode(context, key, callback) {
  // get all nids in the group
  // console.log(`[all.store.getNode]: ${context.gid}`);
  global.distribution[context.gid].status.get('nid', (error, nids) => {
    // console.log(`[all.store.getNode]: ${JSON.stringify(nids)}`);
    // console.log(`[all.store.getNode -- error]: ${error}`);
    if (JSON.stringify(error) !== '{}') {
      callback(null);
      return;
    }

    const nodeIds = Object.values(nids);
    // convert key to KID using sha256
    const kid = global.distribution.util.id.getID(key);
    // use provided hash function to get target node ID
    const targetNid = context.hash(kid, nodeIds);
    // get short ID (first 5 chars)
    const sid = targetNid.substring(0, 5);
    
    // console.log(`[all.store.getNode]: ${JSON.stringify(nodeIds)} ${kid} ${targetNid} ${sid}`);
    // look up actual node info from group
    global.distribution.local.groups.get(context.gid, (error, nodes) => {
      if (error) {
        callback(null); 
        return;
      }
      callback(nodes[sid]);
    });
  });
}

function normalize(config, groupId) {
  const normalizedConfig = {};
  if (config === null) {
    config = {};
  }
  
  if (typeof config === 'string') {
    normalizedConfig.key = config;
    normalizedConfig.gid = groupId;
    normalizedConfig.action = 'put';
  } else if (typeof config === 'object') {
    normalizedConfig.key = config.key;
    normalizedConfig.gid = config.gid || groupId;
    normalizedConfig.action = config.action || 'put';
  }

  return normalizedConfig;
}



function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed mem service, the configuration will
          always be a string */
  return {
    get: (configuration, callback) => {
      // if null key, return all keys
      if (!configuration) {
        const message = [{
          key: null,
          gid: context.gid
        }];
        
        global.distribution[context.gid].comm.send(
          message,
          {
            service: 'mem',
            method: 'get'
          },
          (errors, results) => {
            // flatten results from all nodes
            const allKeys = Object.values(results).reduce(
              (acc, keys) => acc.concat(keys), 
              []
            );
            callback(errors, allKeys);
          }
        );
        return;
      }

      // normalize configuration
      configuration = normalize(configuration, context.gid);

      // get node
      getNode(context, configuration.key, (node) => {
        if (!node) {
          callback(new Error('No node found'));
          return;
        }

        // send request to responsible node
        const message = [normalizedConfig];
        const remote = {
          node: node,
          service: 'mem',
          method: 'get'
        };

        global.distribution.local.comm.send(message, remote, callback);
      });
    },

    put: (state, configuration, callback) => {
      configuration = configuration || global.distribution.util.id.getID(state);
      
      configuration = normalize(configuration, context.gid);

      // console.log(`[all.store.put]: (gid: ${context.gid}) ${JSON.stringify(state)} ${JSON.stringify(configuration)}`);

      getNode(context, configuration.key, (node) => {
        if (!node) {
          callback(new Error('No node found'));
          return;
        }

        const message = [state, configuration];
        const remote = {
          node: node,
          service: 'mem',
          method: 'put'
        };

        global.distribution.local.comm.send(message, remote, callback);
      });
    },

    del: (configuration, callback) => {
      configuration = normalize(configuration, context.gid);

      getNode(context, configuration, (node) => {
        if (!node) {
          callback(new Error('No node found'));
          return;
        }

        const message = [configuration];
        const remote = {
          node: node,
          service: 'mem',
          method: 'del'
        };

        global.distribution.local.comm.send(message, remote, callback);
      });
    },

    reconf: (configuration, callback) => {
      global.distribution[context.gid].mem.get(null, (errors, keys) => {
        global.distribution[context.gid].status.get('nid', (error, currentNodes) => {
          const currentNids = Object.values(currentNodes);
          const oldNids = Object.values(configuration).map(node => 
            global.distribution.util.id.getNID(node)
          );
          
          let relocatedCount = 0;
          if (keys.length === 0) {
            callback(null);
            return;
          }
    
          for (const key of keys) {
            const kid = global.distribution.util.id.getID(key);
            
            const oldTargetNid = context.hash(kid, oldNids);
            const newTargetNid = context.hash(kid, currentNids);
            
            // if target nodes are different, relocate the object
            if (oldTargetNid !== newTargetNid) {
              // get old node that contains key
              const oldNodeSid = oldTargetNid.substring(0, 5);
              const oldNode = configuration[oldNodeSid];
              
              // delete from old node and put in new node
              const message = [{ key: key, gid: context.gid }];
              const remote = {
                node: oldNode,
                service: 'mem',
                method: 'get'
              };
              
              // get object from old node
              global.distribution.local.comm.send(message, remote, (error, value) => {
                if (error) {
                  relocatedCount++;
                  checkCompletion();
                  return;
                }
                
                // delete from old node
                const delMessage = [{ key: key, gid: context.gid }];
                const delRemote = {
                  node: oldNode,
                  service: 'mem',
                  method: 'del'
                };
                
                global.distribution.local.comm.send(delMessage, delRemote, (error, result) => {
                  // put in new location
                  global.distribution[context.gid].mem.put(value, key, (error, result) => {
                    relocatedCount++;
                    checkCompletion();
                  });
                });
              });
            } else {
              relocatedCount++;
              checkCompletion();
            }
          }
          
          function checkCompletion() {
            if (relocatedCount === keys.length) {
              callback(null);
            }
          }
        });
      });
    }
  };
};

module.exports = mem;
