/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/

const fs = require('fs');
const path = require('path');

// check store directory exists
const baseDir = path.join(__dirname, '../store');
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir);
}

// create node specific directory
const nodeDir = path.join(baseDir, `s-${global.moreStatus.sid}`);
if (!fs.existsSync(nodeDir)) {
  fs.mkdirSync(nodeDir);
}

function getFilePath(config) {
  // convert key to base64 to handle special characters
  const safeKey = Buffer.from(config.key).toString('base64');
  return path.join(nodeDir, `${config.gid}-${safeKey}`);
}

function normalize(config) {
  if (typeof config === 'string') {
    return { key: config, gid: 'local' };
  } else if (config === null) {
    return { key: null, gid: 'local' };
  } else {
    return { 
      key: config.key, 
      gid: config.gid || 'local' 
    };
  }
}

function put(state, configuration, callback) {
  callback = callback || function() {};
  const config = normalize(configuration);

  // if no key provided, use hash of serialized object
  if (!config.key) {
    config.key = global.distribution.util.id.getID(state);
  }

  // serialize to string and write to file
  const serializedState = global.distribution.util.serialize(state);
  const filePath = getFilePath(config);

  fs.writeFile(filePath, serializedState, (err) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, state);
  });
}

function get(configuration, callback) {
  callback = callback || function() {};
  const config = normalize(configuration);

  // if no key provided, return all keys for the group
  if (!config.key) {
    fs.readdir(nodeDir, (err, files) => {
      if (err) {
        callback(err);
        return;
      }

      const keys = [];
      for (const file of files) {
        const [gid, encodedKey] = file.split('-');
        if (gid === config.gid) {
          // convert base64 key back to original
          const key = Buffer.from(encodedKey, 'base64').toString();
          keys.push(key);
        }
      }
      callback(null, keys);
    });
    return;
  }

  const filePath = getFilePath(config);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        callback(new Error(`Key "${config.key}" not found`));
      } else {
        callback(err);
      }
      return;
    }

    try {
      const state = global.distribution.util.deserialize(data.toString());
      callback(null, state);
    } catch (err) {
      callback(err);
    }
  });
}

function del(configuration, callback) {
  callback = callback || function() {};
  const config = normalize(configuration);

  const filePath = getFilePath(config);

  // get the value so it can be returned
  get(config, (err, value) => {
    if (err) {
      callback(err);
      return;
    }

    // delete file
    fs.unlink(filePath, (err) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, value);
    });
  });
}

module.exports = {put, get, del};
