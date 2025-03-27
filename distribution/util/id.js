/** @typedef {import("../types.js").Node} Node */

const assert = require('assert');
const crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
/** @typedef {!string} ID */

/**
 * @param {any} obj
 * @return {ID}
 */
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @return {ID}
 */
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @return {ID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

function idToNum(id) {
  const n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  const kidNum = idToNum(kid);

  const nodeIds = nids.map((nid) => ({
    id: nid,
    num: idToNum(nid)
  }));

  nodeIds.sort((a, b) => a.num - b.num);
  for (const node of nodeIds) {
    if (node.num >= kidNum) {
      return node.id;
    }
  }
  return nodeIds[0].id;
}

function rendezvousHash(kid, nids) {
  const concatIds = nids.map((nid) => ({
    id: nid,
    hash: idToNum(getID(kid + nid))
  }));

  let max = -1;
  let maxNode = null;
  for (const node of concatIds) {
    if (node.hash > max) {
      max = node.hash;
      maxNode = node.id;
    }
  }
  return maxNode;
}

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
