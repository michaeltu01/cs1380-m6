const http = require("http")
const url = require("url")

const start = function (callback) {
  const server = http.createServer((req, res) => {
    if (req.method !== "PUT") {
      res.writeHead(405, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: 'Method not allowed'}));
      return;
    }
    const pathname = url.parse(req.url).pathname
    const [, gid, service, method] = pathname.split("/");

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {      
      if (body.length === 0) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(global.distribution.util.serialize(new Error("Request body is required")));
        return;
      }

      try {
        body = JSON.parse(body);
      } catch (err) {
        res.end(global.distribution.util.serialize(err));
        return;
      }
      body = global.distribution.util.deserialize(body);
      
      if (!Array.isArray(body)) {
        res.end(global.distribution.util.serialize(new Error("Request body must be an array")));
      }
      
      global.distribution.local.routes.get(
        {service: service, gid: gid}, 
        (error, serviceObj) => {
          const sendResponse = (err, result) => {
            res.writeHead(err ? 500 : 200, {'Content-Type': 'application/json'});
            res.end(global.distribution.util.serialize([err, result]));
          };

          if (error || !service) {
            sendResponse(null, {error: error ? error.message : 'Service not found'});
            return;
          }

          if (!serviceObj[method]) {
            sendResponse(new Error(`Method ${method} not found in service ${serviceName}`));
            return;
          }

          try {
            serviceObj[method](...body, sendResponse);
          } catch (err) { 
            sendResponse(err);
          }
        }
      );
    });
  });
  
  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    global.distribution.node.server = server, callback(server);
  });
  
  server.on("error", err => {
    throw err;
  });
};

module.exports = {start: start};
