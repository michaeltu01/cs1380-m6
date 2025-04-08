const http = require('http');

function send(message, remote, callback) {
  if (!(message instanceof Array)) {
    console.log('Message is not an array');
    throw new Error('Message must be an array');
  }

  // get remote configuration
  const targetNode = remote.node;
  const serviceName = remote.service;
  const methodName = remote.method;
  const groupId = remote.gid || 'local';

  const serializedMessage = global.distribution.util.serialize(message);

  const requestOptions = {
    hostname: targetNode.ip,
    port: targetNode.port,
    path: `/${groupId}/${serviceName}/${methodName}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(serializedMessage)
    }
  };

  const request = http.request(requestOptions, response => {
    let responseData = '';

    response.on('data', function(chunk) {
      responseData += chunk;
    });

    response.on('end', function() {      
      if (callback) {
        try {
          const deserialized = global.distribution.util.deserialize(responseData);
          callback(...deserialized);
        } catch (error) {
          console.log("got response data", responseData);
          console.log('Error deserializing response:', error);
          callback(new Error('Failed to deserialize response'));
        }
      }
    });

    response.on('error', function(error) {
      if (callback) {
        console.log('Error on response:', error);
        callback(new Error('Error on response'));
      }
    });
  });

  request.on('error', function(error) {
    if (callback) {
      callback(new Error(error.message));
    }
  });

  request.write(serializedMessage);
  request.end();
}

module.exports = {send};