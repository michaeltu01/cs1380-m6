/*
    Checklist:

    1. Serialize strings
    2. Serialize numbers
    3. Serialize booleans
    4. Serialize (non-circular) Objects
    5. Serialize (non-circular) Arrays
    6. Serialize undefined and null
    7. Serialize Date, Error objects
    8. Serialize (non-native) functions
    9. Serialize circular objects and arrays
    10. Serialize native functions
*/

const visited = new Map();

const nativeFunctions = new Set([
  Object, Array, String, Number, Boolean, Date, Error,
  console.log, require('fs').readFile
]);
/*
function serialize(value) {
  // reset visited map for each new serialization
  visited.clear();
  
  return JSON.stringify(serializeValue(value));
}

function serializeValue(value) {
  if (value === null) {
    return { type: 'null', value: 'null' };
  }

  if (value === undefined) {
    return { type: 'undefined', value: 'undefined' };
  }

  // check for circular references
  if (typeof value === 'object' || typeof value === 'function') {
    if (visited.has(value)) {
      return visited.get(value);
    }
  }

  const type = typeof value;

  switch (type) {
    case 'number':
      return { type: 'number', value: value.toString() };
    
    case 'string':
      return { type: 'string', value: value };
    
    case 'boolean':
      return { type: 'boolean', value: value.toString() };
    
    case 'function':
      if (nativeFunctions.has(value)) {
        return { type: 'native-function', value: value.name };
      }
      return { type: 'function', value: value.toString() };
    
    case 'object':
      if (Array.isArray(value)) {
        return serializeArray(value);
      }
      if (value instanceof Date) {
        return { type: 'date', value: value.toISOString() };
      }
      if (value instanceof Error) {
        return { 
          type: 'error', 
          value: {
            message: value.message,
            stack: value.stack
          }
        };
      }
      return serializeObject(value);
    
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}

function serializeArray(arr) {
  const serialized = { type: 'array', value: [] };
  visited.set(arr, serialized);
  
  for (let i = 0; i < arr.length; i++) {
    serialized.value.push(serializeValue(arr[i]));
  }
  
  return serialized;
}

function serializeObject(obj) {
  const serialized = { type: 'object', value: {} };
  visited.set(obj, serialized);
  
  for (const key of Object.getOwnPropertyNames(obj)) {
    serialized.value[key] = serializeValue(obj[key]);
  }
  
  return serialized;
}

function deserialize(string) {
  if (!string) return undefined;
  return deserializeValue(JSON.parse(string));
}

function deserializeValue(obj) {
  if (!obj || !obj.type) {
    return undefined;
  }

  switch (obj.type) {
    case 'null':
      return null;
    
    case 'undefined':
      return undefined;
    
    case 'number':
      return Number(obj.value);
    
    case 'string':
      return obj.value;
    
    case 'boolean':
      return obj.value === 'true';
    
    case 'function':
      // use function constructor to recreate the function
      try {
        const functionBody = obj.value;
        if (functionBody.includes('=>')) {
          // arrow function
          const parts = functionBody.split('=>');
          const params = parts[0].trim().replace(/[()]/g, '');
          const body = parts[1].trim();
          return new Function(...params.split(','), `return ${body}`);
        } else {
          // regular function
          return eval(`(${functionBody})`);
        }
      } catch (e) {
        console.error('Error deserializing function:', e);
        return () => {};
      }
    
    case 'native-function':
      // return the corresponding native function
      for (const func of nativeFunctions) {
        if (func.name === obj.value) {
          return func;
        }
      }
      return undefined;
    
    case 'array':
      return obj.value.map(item => deserializeValue(item));
    
    case 'date':
      return new Date(obj.value);
    
    case 'error':
      const error = new Error(obj.value.message);
      error.stack = obj.value.stack;
      return error;
    
    case 'object':
      const result = {};
      for (const key in obj.value) {
        result[key] = deserializeValue(obj.value[key]);
      }
      return result;
    
    default:
      throw new Error(`Unsupported type: ${obj.type}`);
  }
}
  */

let serialize = require('@brown-ds/distribution/distribution/util/serialization').serialize;
let deserialize = require('@brown-ds/distribution/distribution/util/serialization').deserialize;

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};