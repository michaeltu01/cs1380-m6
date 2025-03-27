const distribution = require('../../config.js');
const util = distribution.util;
const { performance } = require('perf_hooks');

function measureAverageLatency(fn, iterations = 1000) {
    const times = [];
    for (let i = 0; i < iterations; i++) {
        const startMark = performance.now();
        fn();
        const endMark = performance.now();
        times.push(endMark - startMark);
    }
    return times.reduce((a, b) => a + b, 0) / times.length;
}

const testObjects = {
    // T2
    number: 42.5,
    string: "hello world!",
    boolean: true,
    null: null,
    undefined: undefined,
    
    // T3
    simpleFunction: function(x) { return x * 2; },
    arrowFunction: (x) => x * 3,
    
    // T4
    array: [1, 2, [3, 4, [5, 6]]],
    object: { a: 1, b: { c: 2, d: { e: 3 } } },
    error: new Error("test error"),
    date: new Date(),

    deeplyNested: {
        level1: {
            level2: {
                level3: {
                    level4: {
                        level5: {
                            data: [1, 2, 3],
                            date: new Date(),
                            error: new Error("deep error")
                        }
                    }
                }
            }
        }
    },

    mixedTypes: {
        numbers: [1, 2, 3, 4, 5],
        strings: ["a", "b", "c"],
        dates: [new Date(), new Date(2025, 1, 1)],
        errors: [new Error("error 1"), new Error("error 2")],
        functions: [
            function() { return 1; },
            (x) => x * 2,
            function named() { return 3; }
        ],
        nested: {
            mixed: [1, "two", false, null, undefined, new Date()],
            deep: {
                array: [[1, 2], [3, 4], [5, 6]],
                object: { x: 1, y: { z: new Date() } }
            }
        }
    },

    largeArray: Array(1000).fill().map((_, i) => ({
        id: i,
        value: `Item ${i}`,
        timestamp: new Date(),
        data: {
            even: i % 2 === 0,
            squared: i * i,
            nested: {
                info: `nested info for ${i}`
            }
        }
    })),

    complexObject: {
        metadata: {
            created: new Date(),
            modified: new Date(),
            version: "1.0.0"
        },
        data: Array(100).fill().map((_, i) => ({
            id: i,
            type: i % 2 === 0 ? "even" : "odd",
            values: Array(10).fill().map((_, j) => ({
                index: j,
                timestamp: new Date(),
                metadata: {
                    iteration: i * j,
                    valid: true,
                    nested: {
                        depth: "deep",
                        array: [1, [2, [3, [4]]]]
                    }
                }
            }))
        })),
        functions: {
            process: function(x) { return x * 2; },
            validate: (x) => Boolean(x),
            transform: function named(x) { return x.toString(); }
        },
        errors: [
            new Error("primary error"),
            new Error("secondary error"),
            { nested: new Error("nested Eerror") }
        ]
    }
};

console.log("=== Latency Measurements (in milliseconds) ===\n");
console.log("Type\t\t\tSerialization\tDeserialization\tCombined");
console.log("----------------------------------------------------------------");

for (const [type, value] of Object.entries(testObjects)) {
    const serializeTime = measureAverageLatency(() => util.serialize(value));
    
    const serialized = util.serialize(value);
    const deserializeTime = measureAverageLatency(() => util.deserialize(serialized));
    
    const combinedTime = measureAverageLatency(() => {
        const s = util.serialize(value);
        util.deserialize(s);
    });
    
    const paddedType = (type + "\t\t\t").substring(0, 24);
    console.log(`${paddedType}${serializeTime.toFixed(3)}\t\t${deserializeTime.toFixed(3)}\t\t${combinedTime.toFixed(3)}`);
}