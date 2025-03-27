/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;

const test1Group = {};
const test2Group = {};
const test3Group = {};
const test4Group = {};
const test5Group = {};
const n1 = {ip: '127.0.0.1', port: 7210};
const n2 = {ip: '127.0.0.1', port: 7211};
const n3 = {ip: '127.0.0.1', port: 7212};
let localServer = null;

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    const urlRegex = /https?:\/\/[\w\d\.-]+\.[\w\d]{2,}(?:\/[\w\d\-._~:/?#[\]@!$&'()*+,;=]*)?/g;
    const urls = value.match(urlRegex) || [];
    
    const results = [];
    urls.forEach(url => {
      const out = {};
      out[key] = url;
      results.push(out);
    });
    
    return results;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values;
    return out;
  };

  const dataset = [
    {'page1': '<div>Check out <a href="https://example.com">Example</a> and <a href="https://test.org/page">Test</a></div>'},
    {'page2': 'Visit our site at https://oursite.com or https://oursite.com/contact'},
    {'page3': 'No URLs here'}
  ];

  const expected = [
    {'page1': ['https://example.com', 'https://test.org/page']},
    {'page2': ['https://oursite.com', 'https://oursite.com/contact']},
    {'page3': []}
  ];

  let counter = 0;
  dataset.forEach((doc) => {
    const key = Object.keys(doc)[0];
    const value = doc[key];
    distribution.test1group.store.put(value, key, (e, v) => {
      counter++;
      if (counter === dataset.length) {
        distribution.test1group.store.get(null, (e, keys) => {
          distribution.test1group.mr.exec({keys, map: mapper, reduce: reducer}, (e, results) => {
            try {
              expected.forEach(exp => {
                const pageId = Object.keys(exp)[0];
                const expectedUrls = exp[pageId];
                
                const resultPage = results.find(r => Object.keys(r)[0] === pageId);
                
                if (expectedUrls.length === 0) {
                  if (!resultPage) {
                    expect(resultPage).toBeUndefined();
                  }
                  else {
                    const urls = resultPage[pageId] || [];
                    expect(urls.length).toBe(0);
                  }
                } else {
                  expectedUrls.forEach(url => {
                    expect(resultPage[pageId]).toContain(url);
                  });
                }
              });
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    const words = value.toLowerCase().split(/\W+/).filter(word => word.length > 0);
    const results = [];
    
    const uniqueWords = [...new Set(words)];
    
    uniqueWords.forEach(word => {
      const out = {};
      out[word] = key;
      results.push(out);
    });
    return results;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values;
    return out;
  };

  const dataset = [
    {'doc1': 'The quick brown fox'},
    {'doc2': 'Quick brown dogs are rare'},
    {'doc3': 'The lazy fox sleeps'}
  ];

  const expected = [
    {'the': ['doc1', 'doc3']},
    {'fox': ['doc1', 'doc3']},
    {'quick': ['doc1', 'doc2']},
    {'brown': ['doc1', 'doc2']}
  ];

  let counter = 0;
  dataset.forEach((doc) => {
    const key = Object.keys(doc)[0];
    const value = doc[key];
    distribution.test2group.store.put(value, key, (e, v) => {
      counter++;
      if (counter === dataset.length) {
        distribution.test2group.store.get(null, (e, keys) => {
          distribution.test2group.mr.exec({keys, map: mapper, reduce: reducer}, (e, results) => {
            try {
              expected.forEach(exp => {
                const term = Object.keys(exp)[0];
                const expectedDocs = exp[term];
                
                const resultTerm = results.find(r => Object.keys(r)[0] === term);
                expect(resultTerm).toBeDefined();
                
                const resultDocs = resultTerm[term];
                expectedDocs.forEach(doc => {
                  expect(resultDocs).toContain(doc);
                });
                
                expect(resultDocs.length).toBe(expectedDocs.length);
              });
              
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    const words = value.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const results = [];
    
    words.forEach(word => {
      const wordLength = word.length;
      const out = {};
      out[wordLength] = 1;
      results.push(out);
    });
    
    return results;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  const dataset = [
    {'doc1': 'the quick brown fox jumps over the lazy dog'},
    {'doc2': 'a small test with short and long words'},
    {'doc3': 'programming distributed systems is challenging'}
  ];

  let counter = 0;
  dataset.forEach((doc) => {
    const key = Object.keys(doc)[0];
    const value = doc[key];
    distribution.test3group.store.put(value, key, (e, v) => {
      counter++;
      if (counter === dataset.length) {
        distribution.test3group.store.get(null, (e, keys) => {
          distribution.test3group.mr.exec({keys, map: mapper, reduce: reducer}, (e, results) => {
            try {
              const wordLengths = {};
              results.forEach(result => {
                const length = Object.keys(result)[0];
                wordLengths[length] = result[length];
              });
              
              expect(wordLengths['3']).toBeGreaterThanOrEqual(5);
              expect(wordLengths['5']).toBeGreaterThanOrEqual(5);
              expect(wordLengths['11']).toBe(3);
              
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'positive', 'like', 'love', 'best'];
    const negativeWords = ['bad', 'poor', 'terrible', 'sad', 'negative', 'dislike', 'hate', 'worst'];
    
    const words = value.toLowerCase().split(/\W+/).filter(w => w.length > 0);
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    let sentiment;
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }
    
    const result = {};
    result[sentiment] = key;
    return [result];
  };

  const reducer = (key, values) => {
    const result = {};
    result[key] = values;
    return result;
  };

  const dataset = [
    {'doc1': 'This is a great product, I love it! Best purchase ever.'},
    {'doc2': 'The service was terrible and I hate the quality.'},
    {'doc3': 'It was okay, not the best but not the worst either.'},
    {'doc4': 'Excellent experience, very happy with the results.'},
    {'doc5': 'Bad customer service, poor communication.'}
  ];

  const expectedPositiveDocs = ['doc1', 'doc4'];
  const expectedNegativeDocs = ['doc2', 'doc5'];
  
  let counter = 0;
  dataset.forEach((doc) => {
    const key = Object.keys(doc)[0];
    const value = doc[key];
    distribution.test4group.store.put(value, key, (e, v) => {
      counter++;
      if (counter === dataset.length) {
        distribution.test4group.store.get(null, (e, keys) => {
          distribution.test4group.mr.exec({keys, map: mapper, reduce: reducer}, (e, results) => {
            try {
              const positiveDocs = results.find(r => 'positive' in r)?.positive || [];
              const negativeDocs = results.find(r => 'negative' in r)?.negative || [];
              
              expect(positiveDocs.length).toBe(expectedPositiveDocs.length);
              expectedPositiveDocs.forEach(doc => {
                expect(positiveDocs).toContain(doc);
              });
              
              expect(negativeDocs.length).toBe(expectedNegativeDocs.length);
              expectedNegativeDocs.forEach(doc => {
                expect(negativeDocs).toContain(doc);
              });
              
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = value.match(emailRegex) || [];
    
    const domainMap = {};
    emails.forEach(email => {
      const domain = email.split('@')[1];
      if (!domainMap[domain]) {
        domainMap[domain] = [];
      }
      domainMap[domain].push(email);
    });
    
    const results = [];
    for (const domain in domainMap) {
      const out = {};
      out[domain] = domainMap[domain];
      results.push(out);
    }
    
    return results;
  };

  const reducer = (key, values) => {
    const allEmails = values.flat();
    const uniqueEmails = [...new Set(allEmails)];
    uniqueEmails.sort();
    
    const result = {};
    result[key] = uniqueEmails;
    return result;
  };

  const dataset = [
    {'text1': 'Please contact john.doe@example.com or support@example.com for help.'},
    {'text2': 'Our team: alice@company.org, bob@company.org, and charlie@personal.net'},
    {'text3': 'For more information: info@example.com, sales@example.com'},
    {'text4': 'No email addresses in this document.'},
    {'text5': 'Contact me at: john.doe@example.com or admin@company.org'}
  ];

  const expected = {
    'example.com': ['info@example.com', 'john.doe@example.com', 'sales@example.com', 'support@example.com'],
    'company.org': ['admin@company.org', 'alice@company.org', 'bob@company.org'],
    'personal.net': ['charlie@personal.net']
  };

  let counter = 0;
  dataset.forEach((doc) => {
    const key = Object.keys(doc)[0];
    const value = doc[key];
    distribution.test5group.store.put(value, key, (e, v) => {
      counter++;
      if (counter === dataset.length) {
        distribution.test5group.store.get(null, (e, keys) => {
          distribution.test5group.mr.exec({keys, map: mapper, reduce: reducer}, (e, results) => {
            try {
              const domainEmails = {};
              results.forEach(result => {
                const domain = Object.keys(result)[0];
                domainEmails[domain] = result[domain];
              });
              
              for (const domain in expected) {
                const expectedEmails = expected[domain];
                const actualEmails = domainEmails[domain];
                
                expect(actualEmails.length).toBe(expectedEmails.length);
                
                expectedEmails.forEach(email => {
                  expect(actualEmails).toContain(email);
                });
              }
              
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      }
    });
  });
});

beforeAll((done) => {
  test1Group[id.getSID(n1)] = n1;
  test1Group[id.getSID(n2)] = n2;
  test1Group[id.getSID(n3)] = n3;

  test2Group[id.getSID(n1)] = n1;
  test2Group[id.getSID(n2)] = n2;
  test2Group[id.getSID(n3)] = n3;

  test3Group[id.getSID(n1)] = n1;
  test3Group[id.getSID(n2)] = n2;
  test3Group[id.getSID(n3)] = n3;

  test4Group[id.getSID(n1)] = n1;
  test4Group[id.getSID(n2)] = n2;
  test4Group[id.getSID(n3)] = n3;

  test5Group[id.getSID(n1)] = n1;
  test5Group[id.getSID(n2)] = n2;
  test5Group[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const testConfig = {gid: 'test1group'};
    startNodes(() => {
      distribution.local.groups.put(testConfig, test1Group, (e, v) => {
        distribution.test1group.groups.put(testConfig, test1Group, (e, v) => {
          const testConfig = {gid: 'test2group'};
          distribution.local.groups.put(testConfig, test2Group, (e, v) => {
            distribution.test2group.groups.put(testConfig, test2Group, (e, v) => {
              const testConfig = {gid: 'test3group'};
              distribution.local.groups.put(testConfig, test3Group, (e, v) => {
                distribution.test3group.groups.put(testConfig, test3Group, (e, v) => {
                  const testConfig = {gid: 'test4group'};
                  distribution.local.groups.put(testConfig, test4Group, (e, v) => {
                    distribution.test4group.groups.put(testConfig, test4Group, (e, v) => {
                      const testConfig = {gid: 'test5group'};
                      distribution.local.groups.put(testConfig, test5Group, (e, v) => {
                        distribution.test5group.groups.put(testConfig, test5Group, (e, v) => {
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
