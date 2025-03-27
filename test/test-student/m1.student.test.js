/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const util = distribution.util;

test('(1 pts) student test', () => {
  const numbers = [
    Number.MAX_SAFE_INTEGER,  
    Number.MIN_SAFE_INTEGER,  
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY, 
    NaN                     
];

numbers.forEach(num => {
    const serialized = util.serialize(num);
    const deserialized = util.deserialize(serialized);
    
    if (Number.isNaN(num)) {
        expect(Number.isNaN(deserialized)).toBeTruthy();
    } else {
        expect(deserialized).toBe(num);
    }
});
});


test('(1 pts) student test', () => {
  const strings = [
    '',                     
    '\\',                   
    '\n\t\r',              
    '"quotes"\'singles\''
];

strings.forEach(str => {
    const serialized = util.serialize(str);
    const deserialized = util.deserialize(serialized);
    expect(deserialized).toBe(str);
});
});


test('(1 pts) student test', () => {
  const boolTests = [
    true,                           
    false,
    {flag1: true, flag2: false},        
    [true, false, true],                 
];

boolTests.forEach(test => {
    const serialized = util.serialize(test);
    const deserialized = util.deserialize(serialized);
    expect(deserialized).toEqual(test);
});
});

test('(1 pts) student test', () => {
  const nullTests = [
    null,                          
    {a: null, b: 42},              
    [null, 'test', null],         
    {nested: {a: null, b: 123}},
  ];

  nullTests.forEach(test => {
      const serialized = util.serialize(test);
      const deserialized = util.deserialize(serialized);
      expect(deserialized).toEqual(test);
  });
});

test('(1 pts) student test', () => {
  const undefinedTests = [
    undefined,                              
    {a: undefined, b: 42},                 
    [undefined, 'test', undefined],        
    {nested: {a: undefined, b: 123}},        
];

  undefinedTests.forEach(test => {
      const serialized = util.serialize(test);
      const deserialized = util.deserialize(serialized);
      expect(deserialized).toEqual(test);
  });
});
