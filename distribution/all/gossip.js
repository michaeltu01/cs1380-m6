const gossip = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.subset = config.subset || function(lst) {
    return Math.ceil(Math.log(lst.length));
  };

  const intervals = new Map();

  return {
    send: (payload, remote, callback) => {
      global.distribution.local.groups.get(context.gid, (error, nodes) => {
        if (error) {
          callback(error);
          return;
        }

        const subsetSize = context.subset(Object.keys(nodes));
        const selectRandomNodes = (nodeList) => {
          const selected = new Set();
          while (selected.size < subsetSize) {
            const idx = Math.floor(Math.random() * nodeList.length);
            selected.add(nodeList[idx]);
          }
          return selected;
        };

        const selectedNodes = selectRandomNodes(Object.keys(nodes));
        let message;
        if (payload.mid) {
          message = payload;
        } else {
          message = {
            message: payload,
            remote: remote,
            mid: global.distribution.util.id.getMID(payload),
            gid: context.gid
          };
        }
        
        const completedSuccess = {};
        const completedErrors = {};
        let completedRequests = 0;

        for (const nodeId of selectedNodes) {
          const node = nodes[nodeId];
          const target = {
            node: {
              ip: node.ip,
              port: node.port
            },
            service: 'gossip',
            method: 'recv'
          };

          global.distribution.local.comm.send([message], target, (err, result) => {
            if (err) {
              completedErrors[nodeId] = err;
            } else {
              completedSuccess[nodeId] = result;
            }

            completedRequests++;
            if (completedRequests === subsetSize) {
              callback(completedErrors, completedSuccess);
            }
          });
        }
      });
    },

    at: (period, func, callback) => {
      // get unique interval id
      const intervalID = global.distribution.util.id.getMID('interval');
      
      const interval = setInterval(() => {
        func((error, result) => {
          if (error) {
            console.error('Error in interval task:', error);
          }
        });
      }, period);

      intervals.set(intervalID, interval);
      // stop interval from keeping process alive
      interval.unref();

      if (callback) {
        callback(null, intervalID);
      }
    },

    del: (intervalID, callback) => {
      const interval = intervals.get(intervalID);
      
      if (!interval) {
        if (callback) {
          callback(new Error('Interval not found'));
        }
        return;
      }

      clearInterval(interval);
      intervals.delete(intervalID);

      if (callback) {
        callback(null, intervalID);
      }
    },
  };
};

module.exports = gossip;
