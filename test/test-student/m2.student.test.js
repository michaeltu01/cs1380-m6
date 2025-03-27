const distribution = require('../../config.js');
const local = distribution.local;
const id = distribution.util.id;

let localServer = null;

beforeAll((done) => {
    distribution.node.start((server) => {
        localServer = server;
        done();
    });
});

afterAll((done) => {
    localServer.close();
    done();
});

test('(1 pts) status.get() should return node ID (nid)', (done) => {
    const node = distribution.node.config;
    const remote = {node: node, service: 'status', method: 'get'};
    const message = ['nid'];
    
    local.comm.send(message, remote, (e, v) => {
        try {
            expect(e).toBeFalsy();
            expect(v).toBe(id.getNID(node));
            done();
        } catch (error) {
            done(error);
        }
    });
});

test('(1 pts) status.get() should return service ID (sid)', (done) => {
    const node = distribution.node.config;
    const remote = {node: node, service: 'status', method: 'get'};
    const message = ['sid'];
    
    local.comm.send(message, remote, (e, v) => {
        try {
            expect(e).toBeFalsy();
            expect(v).toBe(id.getSID(node));
            done();
        } catch (error) {
            done(error);
        }
    });
});

test('(1 pts) routes.get() should retrieve built-in services', (done) => {
    local.routes.get('status', (e, v) => {
        try {
            expect(e).toBeFalsy();
            expect(v).toBe(local.status);
            done();
        } catch (error) {
            done(error);
        }
    });
});

test('(1 pts) routes.get() should handle non-existent services', (done) => {
    local.routes.get('nonexistentService', (e, v) => {
        try {
            expect(e).toBeTruthy();
            expect(e).toBeInstanceOf(Error);
            expect(v).toBeFalsy();
            done();
        } catch (error) {
            done(error);
        }
    });
});

test('(1 pts) routes.put() should store a new service', (done) => {
    const counterService = {
        count: 0,
        increment: function() { return ++this.count; }
    };
    
    local.routes.put(counterService, 'counter', (e1, v1) => {
        local.routes.get('counter', (e2, v2) => {
            try {
                expect(e1).toBeFalsy();
                expect(e2).toBeFalsy();
                expect(v2.increment()).toBe(1);
                expect(v2.increment()).toBe(2);
                done();
            } catch (error) {
                done(error);
            }
        });
    });
});

test('(1 pts) routes.put() should update existing service', (done) => {
    const originalService = { value: 'original' };
    const updatedService = { value: 'updated' };
    
    local.routes.put(originalService, 'testService', (e1, v1) => {
        local.routes.put(updatedService, 'testService', (e2, v2) => {
            local.routes.get('testService', (e3, v3) => {
                try {
                    expect(e1).toBeFalsy();
                    expect(e2).toBeFalsy();
                    expect(e3).toBeFalsy();
                    expect(v3.value).toBe('updated');
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });
});

test('(1 pts) routes.rem() should remove an existing service', (done) => {
    const service = { test: () => 'test' };
    
    local.routes.put(service, 'removalTest', (e1, _v1) => {
        local.routes.rem('removalTest', (e2, _v2) => {
            local.routes.get('removalTest', (e3, _v3) => {
                try {
                    expect(e1).toBeFalsy();
                    expect(e2).toBeFalsy();
                    expect(e3).toBeTruthy();
                    expect(e3).toBeInstanceOf(Error);
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });
    });
});

test('(1 pts) routes.rem() should handle removing non-existent service', (done) => {
  local.routes.rem('nonExistentService', (e, v) => {
      try {
          expect(e).toBeFalsy();
          expect(v).toBeFalsy();
          done();
      } catch (error) {
          done(error);
      }
  });
});

test('(1 pts) comm.send() should successfully send status request', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};
  const message = ['sid'];
  
  local.comm.send(message, remote, (e, v) => {
      try {
          expect(e).toBeFalsy();
          expect(v).toBe(id.getSID(node));
          done();
      } catch (error) {
          done(error);
      }
  });
});

test('(1 pts) comm.send() should handle invalid service name', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'invalidService', method: 'get'};
  const message = ['test'];
  
  local.comm.send(message, remote, (e, v) => {
      try {
          expect(e).toBeTruthy();
          expect(e).toBeInstanceOf(Error);
          expect(v).toBeFalsy();
          done();
      } catch (error) {
          done(error);
      }
  });
});