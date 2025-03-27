const memStore = {
  store: {},
  
  get(config) {
    if (!this.store[config.gid]) {
      return undefined;
    }
    return this.store[config.gid][config.key];
  },
  
  put(config, value) {
    if (!this.store[config.gid]) {
      this.store[config.gid] = {};
    }
    this.store[config.gid][config.key] = value;
  },
  
  append(config, value) {
    if (!this.get(config)) {
      this.put(config, []);
    }
    
    if (!Array.isArray(this.get(config))) {
      this.put(config, [this.get(config)]);
    }
    
    if (Array.isArray(value)) {
      this.put(config, this.get(config).concat(value));
    } else {
      this.store[config.gid][config.key].push(value);
    }
  },
  
  del(config) {
    if (!this.store[config.gid]) {
      return undefined;
    }
    
    const value = this.store[config.gid][config.key];
    delete this.store[config.gid][config.key];
    return value;
  },
};

function normalize(config) {
  const normalConfig = {};
  
  if (config === null) {
    config = {};
  }
  
  if (typeof config === 'string') {
    normalConfig.key = config;
    normalConfig.gid = 'local';
    normalConfig.action = 'put';
  } else if (typeof config === 'object') {
    normalConfig.key = config.key;
    normalConfig.gid = config.gid || 'local';
    normalConfig.action = config.action || 'put';
  }
  
  return normalConfig;
}

function put(state, configuration, callback) {
  callback = callback || function() {};
  
  const config = normalize(configuration);
  config.key = config.key || global.distribution.util.id.getID(state);
  
  memStore[config.action](config, state);
  
  callback(null, state);
}

function get(configuration, callback) {
  callback = callback || function() {};
  
  const config = normalize(configuration);
  
  // if no key provided, return all keys for the group
  if (!config.key) {
    let keys = memStore.store[config.gid] || {};
    keys = Object.keys(keys);
    callback(null, keys);
    return;
  }
  
  const value = memStore.get(config);
  
  if (value !== undefined) {
    callback(null, value);
  } else {
    callback(new Error(`Memory key "${config.key}" not found for ${config.gid}'s store`));
  }
}

function del(configuration, callback) {
  callback = callback || function() {};
  
  const config = normalize(configuration);
  const value = memStore.del(config);
  
  if (value !== undefined) {
    callback(null, value);
  } else {
    callback(new Error(`Memory key "${config.key}" not found for ${config.gid}'s store`));
  }
}

module.exports = { put, get, del };