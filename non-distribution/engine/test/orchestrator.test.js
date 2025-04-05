let orchestrator = require('../orchestrator');

test('mapper on sandbox website',  async () => {
    const indexResult = await orchestrator.createOrchestrator();
    console.log(indexResult);
});