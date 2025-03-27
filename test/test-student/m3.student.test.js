const distribution = require('../../config.js');
const id = distribution.util.id;

const testGroup = {};
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 9001};
const n2 = {ip: '127.0.0.1', port: 9002};
const n3 = {ip: '127.0.0.1', port: 9003};

test('(1 pts) student test', (done) => {
  // distributed heapTotal is sum of individual heaps
  let heapSum = 0;
  let nodesChecked = 0;
  
  Object.values(testGroup).forEach(node => {
    const remote = {node, service: 'status', method: 'get'};
    distribution.local.comm.send(['heapTotal'], remote, (e, v) => {
      heapSum += v;
      nodesChecked++;
      
      if (nodesChecked === Object.keys(testGroup).length) {
        distribution.all.status.get('heapTotal', (e, totalHeap) => {
          try {
            expect(e).toEqual({});
            expect(totalHeap).toBe(heapSum);
            done();
          } catch (error) {
            done(error);
          }
        });
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  // group view consistency after multiple modifications
  let initialGroup = {[id.getSID(n1)]: n1};
  
  distribution.all.groups.put('modGroup', initialGroup, (e, v) => {
    distribution.all.groups.add('modGroup', n2, (e, v) => {
      distribution.all.groups.rem('modGroup', id.getSID(n1), (e, v) => {
        distribution.all.groups.add('modGroup', n3, (e, v) => {
          distribution.all.groups.get('modGroup', (e, v) => {
            try {
              // all nodes should see n2 and n3, but not n1
              Object.values(v).forEach(view => {
                expect(Object.keys(view)).toContain(id.getSID(n2));
                expect(Object.keys(view)).toContain(id.getSID(n3));
                expect(Object.keys(view)).not.toContain(id.getSID(n1));
              });
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      });
    });
  });
});


test('(1 pts) student test', (done) => {
  const badStatus = {
    get: (config, cb) => cb(new Error('Simulated error'))
  };
  
  distribution.local.routes.put(badStatus, 'badStatus', (e, v) => {
    const remote = {service: 'badStatus', method: 'get'};
    distribution.all.comm.send(['test'], remote, (e, v) => {
      try {
        // should get errors from all nodes
        Object.values(e).forEach(error => {
          expect(error).toBeInstanceOf(Error);
        });
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const node1 = distribution({ ip: '127.0.0.1', port: 8080 });
  
  // putting and getting a simple group
  const testNodes = {
    'node1': { ip: '127.0.0.1', port: 8080 }
  };
  
  node1.local.groups.put('testGroup', testNodes, (err) => {
    expect(err).toBeNull();
    
    node1.local.groups.get('testGroup', (err, group) => {
      expect(err).toBeNull();
      expect(group).toEqual(testNodes);
      done();
    });
  });
});

test('(1 pts) student test', (done) => {
  const node1 = distribution({ ip: '127.0.0.1', port: 8083 });
  const testNode = { ip: '127.0.0.1', port: 8084 };
  
  // empty group
  node1.local.groups.put('testGroup', {}, (err) => {
    expect(err).toBeNull();
    
    // add a node
    node1.local.groups.add('testGroup', testNode, (err) => {
      expect(err).toBeNull();
      
      // verify node was added
      node1.local.groups.get('testGroup', (err, group) => {
        expect(err).toBeNull();
        expect(Object.values(group)[0]).toEqual(testNode);
        done();
      });
    });
  });
});

beforeAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        testGroup[id.getSID(n1)] = n1;
        testGroup[id.getSID(n2)] = n2;
        testGroup[id.getSID(n3)] = n3;

        distribution.node.start((server) => {
          localServer = server;

          distribution.local.status.spawn(n1, (e, v) => {
            distribution.local.status.spawn(n2, (e, v) => {
              distribution.local.status.spawn(n3, (e, v) => {
                distribution.local.groups.put({gid: 'all'}, testGroup, (e, v) => {
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});