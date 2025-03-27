const groups = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  
  return {
    put: (name, nodes, callback) => {
      global.distribution[context.gid].comm.send(
        [name, nodes],
        {
          service: 'groups',
          method: 'put'
        },
        (error, result) => {
          callback(error, result);
        }
      );
    },

    del: (name, callback) => {
      global.distribution[context.gid].comm.send(
        [name],
        {
          service: 'groups',
          method: 'del'
        },
        (error, result) => {
          callback(error, result);
        }
      );
    },

    get: (name, callback) => {
      global.distribution[context.gid].comm.send(
        [name],
        {
          service: 'groups',
          method: 'get'
        },
        (error, result) => {
          // console.log(('[groups.all.get]: ' + JSON.stringify(results)));
          // console.log(('[groups.all.get - error]: ' + JSON.stringify(error)));
          callback(error, result);
        }
      );
    },

    add: (name, node, callback) => {
      global.distribution[context.gid].comm.send(
        [name, node],
        {
          service: 'groups',
          method: 'add'
        },
        (error, result) => {
          callback(error, result);
        }
      );
    },

    rem: (name, nodeId, callback) => {
      global.distribution[context.gid].comm.send(
        [name, nodeId],
        {
          service: 'groups',
          method: 'rem'
        },
        (error, result) => {
          callback(error, result);
        }
      );
    }
  };
};

module.exports = groups;