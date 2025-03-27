const log = require('../util/log');
const crypto = require('crypto');

if (!global.toLocal) {
  global.toLocal = new Map();
}

// function createRemotePointer(func) {
//   const timestamp = new Date().getTime();
//   const randomData = Math.random().toString();
//   const hash = crypto.createHash('sha256');
//   hash.update(timestamp + randomData + func.toString());
//   const pointer = hash.digest('hex');
//   console.log('[wire] remotePointer:', pointer);
//   return pointer;
// }

// function createRPC(func) {
//   console.log('[wire] createRPC:', func.name || 'anonymous');
  
//   const remotePointer = createRemotePointer(func);
  
//   // store in map
//   global.toLocal.set(remotePointer, func);

//   const rpcFunc = function() {
//     const args = Array.from(arguments);
//     const callback = args.pop();
    
//     const remote = {
//       node: global.nodeConfig,
//       service: 'rpc',
//       method: remotePointer
//     };

//     try {
//       const comm = global.distribution.local.comm;
//       comm.send(args, remote, callback);
//     } catch (error) {
//       callback(error);
//     }
//   };

//   Object.defineProperty(rpcFunc, 'toString', {
//     value: () => `function anonymous() { [rpc code] }`,
//     enumerable: false
//   });

//   return rpcFunc;
// }

let createRPC = require('@brown-ds/distribution/distribution/util/wire').createRPC;

/*
  The toAsync function transforms a synchronous function that returns a value into an asynchronous one,
  which accepts a callback as its final argument and passes the value to the callback.
*/
function toAsync(func) {
  // console.log('[wire] toAsync:', func.name);
  log(`Converting function to async: ${func.name}: ${func.toString().replace(/\n/g, '|')}`);

  // It's the caller's responsibility to provide a callback
  const asyncFunc = (...args) => {
    const callback = args.pop();
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };

  /* Overwrite toString to return the original function's code.
   Otherwise, all functions passed through toAsync would have the same id. */
  asyncFunc.toString = () => func.toString();
  return asyncFunc;
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};
