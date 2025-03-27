const status = function(config) {
  const context = {
    gid: config.gid || 'all'
  };

  return {
    get: (configuration, callback) => {
      // console.log(`[status.all.get]: (gid: ${context.gid}) ${configuration}`);
      const message = [configuration];
      const remote = {
        service: 'status',
        method: 'get'
      };

      global.distribution[context.gid].comm.send(message, remote, (error, results) => {
        if (configuration === 'heapTotal') {
          const totalHeap = Object.values(results).reduce((sum, value) => {
            return sum + value;
          }, 0);
          callback(error, totalHeap);
          return;
        } else if (configuration === 'nid') {
          const allNodeIds = Object.values(results).reduce((acc, nodeId) => {
            return acc.concat(nodeId);
          }, []);
          callback(error, allNodeIds);
          return
        } else {
          // console.log(('[status.all.get]: ' + JSON.stringify(results)));
          // console.log(('[status.all.get - error]: ' + JSON.stringify(error)));
          callback(error, results);
          return;
        }
        }
      );
    },

    spawn: (nodeConfig, callback) => {
      const dist = global.distribution;
      callback = callback || (() => {});

      const addNodeToGroup = (error, result) => {
        if (error) {
          callback(error);
          return;
        }

        // Add to local group first
        dist.local.groups.add(context.gid, nodeConfig, (addError) => {
          if (addError) {
            callback(addError);
            return;
          }

          // Notify other nodes in group
          const notifyParams = [context.gid, nodeConfig];
          const notifyTarget = {
            service: 'groups',
            method: 'add'
          };

          dist[context.gid].comm.send(notifyParams, notifyTarget, (notifyError) => {
            // We still want to return success even if notification fails
            callback(null, result);
          });
        });
      };

      // Start the spawn process
      dist.local.status.spawn(nodeConfig, addNodeToGroup);
    },

    stop: (callback) => {
      global.distribution[context.gid].comm.send(
        [],
        {
          service: 'status',
          method: 'stop'
        },
        callback
      );
    }
  };
};

module.exports = status;