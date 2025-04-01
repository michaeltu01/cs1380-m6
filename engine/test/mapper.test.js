import mapperFunction from '../mapper';

test('mapper on sandbox website', (done) => {
    let url = 'https://cs.brown.edu/courses/csci1380/sandbox/1';

    console.log(mapperFunction(url, null));

    done();
});