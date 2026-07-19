const { importQuestionsAction } = require('./actions/question.actions');

async function test() {
  process.env.R2_BUCKET_NAME = 'thegpedge1234';
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL = 'https://pub-8d1b22e1b12b4e7eb683e8fa5a40bb8e.r2.dev';
  
  const testQuestion = {
    text: 'Test Question Stem ' + Date.now(),
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0,
    rationale: 'Test Rationale',
    topic: 'Cardiology',
    difficulty: 'Medium',
    examType: 'AKT',
    status: 'published',
    tags: ['TestTag']
  };

  console.log('Calling importQuestionsAction...');
  const res = await importQuestionsAction([testQuestion]);
  console.log('Result:', res);
}

test().catch(err => {
  console.error('Test failed with error:', err);
});
