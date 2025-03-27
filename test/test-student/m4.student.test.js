/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;

test('(1 pts) student test', (done) => {
  const complexObj = {
    name: "Test User",
    contact: {
      email: "test@example.com",
      phone: "555-1234"
    },
    preferences: ["music", "books", "hiking"],
    active: true,
    details: {
      joined: new Date(),
      level: 3,
      settings: {
        theme: "dark",
        notifications: {
          email: true,
          push: false
        }
      }
    }
  };
  
  distribution.local.mem.put(complexObj, "complex-key", (e, v) => {
    try {
      expect(e).toBeFalsy();
      
      distribution.local.mem.get("complex-key", (error, result) => {
        expect(error).toBeFalsy();
        expect(result).toEqual(complexObj);
        expect(result.details.settings.notifications.email).toBe(true);
        expect(result.preferences).toContain("books");
        done();
      });
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  const user1 = { name: "User One" };
  const user2 = { name: "User Two" };
  const sameKey = "collision-key";
  
  distribution.local.mem.put(user1, { key: sameKey, gid: "group1" }, (e1, v1) => {
    distribution.local.mem.put(user2, { key: sameKey, gid: "group2" }, (e2, v2) => {
      distribution.local.mem.get({ key: sameKey, gid: "group1" }, (err1, result1) => {
        distribution.local.mem.get({ key: sameKey, gid: "group2" }, (err2, result2) => {
          try {
            expect(err1).toBeFalsy();
            expect(err2).toBeFalsy();
            expect(result1).toEqual(user1);
            expect(result2).toEqual(user2);
            expect(result1).not.toEqual(result2);
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});


test('(1 pts) student test', (done) => {
  const testKey = "hash-test-key";
  const kid = id.getID(testKey);
  const nodes = [
    {ip: '127.0.0.1', port: 8000},
    {ip: '127.0.0.1', port: 8001},
    {ip: '127.0.0.1', port: 8002}
  ];
  const nids = nodes.map(node => id.getNID(node));
  
  const naiveResult = id.naiveHash(kid, [...nids]);
  const consistentResult = id.consistentHash(kid, [...nids]);
  const rendezvousResult = id.rendezvousHash(kid, [...nids]);
  
  try {
    expect(naiveResult).toBeTruthy();
    expect(consistentResult).toBeTruthy();
    expect(rendezvousResult).toBeTruthy();
    
    expect(nids).toContain(naiveResult) || expect(nids.map(nid => nid.substring(0, 5))).toContain(naiveResult.substring(0, 5));
    expect(nids).toContain(consistentResult) || expect(nids.map(nid => nid.substring(0, 5))).toContain(consistentResult.substring(0, 5));
    expect(nids).toContain(rendezvousResult) || expect(nids.map(nid => nid.substring(0, 5))).toContain(rendezvousResult.substring(0, 5));
    
    done();
  } catch (error) {
    done(error);
  }
});

let localServer = null;

test('(1 pts) student test', (done) => {
  const testObj = { testValue: "Distributed storage test" };
  const key = "distribution-test-key";
  
  const n1 = {ip: '127.0.0.1', port: 8010};
  const n2 = {ip: '127.0.0.1', port: 8011};
  const n3 = {ip: '127.0.0.1', port: 8012};
  
  const nodesMap = {};
  
  distribution.node.start((server) => {
    localServer = server;
    distribution.local.status.spawn(n1, (e1, v1) => {
      distribution.local.status.spawn(n2, (e2, v2) => {
        distribution.local.status.spawn(n3, (e3, v3) => {
          console.log(`Nodes started: ${n1.ip}:${n1.port}, ${n2.ip}:${n2.port}, ${n3.ip}:${n3.port}`);
          nodesMap[id.getSID(n1)] = n1;
          nodesMap[id.getSID(n2)] = n2;
          nodesMap[id.getSID(n3)] = n3;
          
          const group1Config = {gid: 'group1', hash: id.naiveHash};
          const group2Config = {gid: 'group2', hash: id.consistentHash};
          const group3Config = {gid: 'group3', hash: id.rendezvousHash};
          
          distribution.local.groups.put(group1Config, nodesMap, (e4, v4) => {
            distribution.group1.groups.put(group1Config, nodesMap, (e5, v5) => {
              distribution.local.groups.put(group2Config, nodesMap, (e6, v6) => {
                distribution.group2.groups.put(group2Config, nodesMap, (e7, v7) => {
                  distribution.local.groups.put(group3Config, nodesMap, (e8, v8) => {
                    distribution.group3.groups.put(group3Config, nodesMap, (e9, v9) => {
                      // test storing and retrieving with different hash functions
                      distribution.group1.mem.put(testObj, key, (e10, v10) => {
                        distribution.group2.mem.put(testObj, key, (e11, v11) => {
                          distribution.group3.mem.put(testObj, key, (e12, v12) => {
                            // retrieve from all 3 groups and compare
                            distribution.group1.mem.get(key, (err1, result1) => {
                              distribution.group2.mem.get(key, (err2, result2) => {
                                distribution.group3.mem.get(key, (err3, result3) => {
                                  try {
                                    // all operations succeeded
                                    expect(err1).toBeFalsy();
                                    expect(err2).toBeFalsy();
                                    expect(err3).toBeFalsy();
                                    
                                    // returned objects match the original
                                    expect(result1).toEqual(testObj);
                                    expect(result2).toEqual(testObj);
                                    expect(result3).toEqual(testObj);
                                    
                                    const stopNode = (node, callback) => {
                                      const remote = {node: node, service: 'status', method: 'stop'};
                                      distribution.local.comm.send([], remote, callback);
                                    };
                                    
                                    stopNode(n1, () => {
                                      stopNode(n2, () => {
                                        stopNode(n3, () => {
                                          localServer.close();
                                          done();
                                        });
                                      });
                                    });
                                  } catch (error) {
                                    localServer.close();
                                    done(error);
                                  }
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  const persistedObject = {
    id: "test-persistence-123",
    records: [
      { timestamp: new Date().toISOString(), value: 42 },
      { timestamp: new Date().toISOString(), value: 84 }
    ],
    metadata: {
      created: new Date().toISOString(),
      type: "test-data",
      version: 1.0
    }
  };
  
  const storeKey = "persistence-test-key";
  
  const n1 = {ip: '127.0.0.1', port: 9010};
  const n2 = {ip: '127.0.0.1', port: 9011};
  
  const nodesMap = {};
  
  distribution.node.start((server) => {
    localServer = server;
    distribution.local.status.spawn(n1, (e1, v1) => {
      distribution.local.status.spawn(n2, (e2, v2) => {
        nodesMap[id.getSID(n1)] = n1;
        nodesMap[id.getSID(n2)] = n2;
        
        const testGroupConfig = {gid: 'test-store-group'};
        
        distribution.local.groups.put(testGroupConfig, nodesMap, (e3, v3) => {
          distribution['test-store-group'].groups.put(testGroupConfig, nodesMap, (e4, v4) => {
            // put object into store
            distribution['test-store-group'].store.put(persistedObject, storeKey, (e5, v5) => {
              try {
                expect(e5).toBeFalsy();
                expect(v5).toEqual(persistedObject);
                
                // retrieve it to verify persistence
                distribution['test-store-group'].store.get(storeKey, (e6, v6) => {
                  try {
                    expect(e6).toBeFalsy();
                    expect(v6).toEqual(persistedObject);
                    
                    // verify all nested properties were preserved
                    expect(v6.id).toBe(persistedObject.id);
                    expect(v6.records.length).toBe(2);
                    expect(v6.records[0].value).toBe(42);
                    expect(v6.metadata.type).toBe("test-data");
                    
                    // delete and verify it's gone
                    distribution['test-store-group'].store.del(storeKey, (e7, v7) => {
                      try {
                        expect(e7).toBeFalsy();
                        
                        // retrieve after deletion should fail
                        distribution['test-store-group'].store.get(storeKey, (e8, v8) => {
                          try {
                            expect(e8).toBeTruthy();
                            expect(e8).toBeInstanceOf(Error);
                            
                            const stopNode = (node, callback) => {
                              const remote = {node: node, service: 'status', method: 'stop'};
                              distribution.local.comm.send([], remote, callback);
                            };
                            
                            stopNode(n1, () => {
                              stopNode(n2, () => {
                                localServer.close();
                                done();
                              });
                            });
                          } catch (error) {
                            localServer.close();
                            done(error);
                          }
                        });
                      } catch (error) {
                        localServer.close();
                        done(error);
                      }
                    });
                  } catch (error) {
                    localServer.close();
                    done(error);
                  }
                });
              } catch (error) {
                localServer.close();
                done(error);
              }
            });
          });
        });
      });
    });
  });
});
