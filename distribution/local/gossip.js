const gossip = {};

// seen messages
const seenMessages = new Set();

gossip.recv = function(payload, callback) {
    callback = callback || function() {};

    const message = payload.message;
    const remote = payload.remote;
    const messageId = payload.mid;
    const groupId = payload.gid;

    // message already receieved -> error
    if (seenMessages.has(messageId)) {
        callback(new Error("Message already received"));
        return;
    }

    // store message then forward to other nodes in group
    seenMessages.add(messageId);
    global.distribution[groupId].gossip.send(payload, remote);
    

    // actually execute the request/message
    remote.node = {
        ip: global.nodeConfig.ip,
        port: global.nodeConfig.port
    };

    global.distribution.local.comm.send(message, remote, (error, result) => {
        callback(error, result);
    });
};

module.exports = gossip;
