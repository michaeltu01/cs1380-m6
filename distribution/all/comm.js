function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';
  
  function send(message, remote, callback) {
    global.distribution.local.groups.get(context.gid, (error, nodes) => {
      const nodeIds = Object.keys(nodes);
      const totalNodes = nodeIds.length;

      if (totalNodes === 0) {
        callback(new Error('No nodes found'));
        return;
      }

      let completedRequests = 0;
      let completedSuccess = {};
      let completedError = {};

      // send to each node in the group
      for (const nodeId of nodeIds) {
        const node = nodes[nodeId];
        const nodeRemote = {
          node: {
            ip: node.ip,
            port: node.port
          },
          service: remote.service,
          method: remote.method,
          gid: remote.gid || 'local'
        };

        global.distribution.local.comm.send(
          message,
          nodeRemote,
          (error, result) => {
            completedRequests++;
            
            if (error) {
              completedError[nodeId] = error;
            } else {
              completedSuccess[nodeId] = result;
            }

            // if all requests are complete, call the callback
            if (completedRequests === totalNodes) {
              callback(completedError, completedSuccess);
            }
          }
        );
      }
    });
  }

  return { send };
}

module.exports = comm;