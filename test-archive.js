// A simple test script to verify that task archiving works correctly
// Mock implementation for testing the logic directly

// Mock AsyncStorage
const AsyncStorage = {
  _store: {},
  setItem: async (key, value) => {
    AsyncStorage._store[key] = value;
  },
  getItem: async (key) => {
    return AsyncStorage._store[key] || null;
  }
};

// Create a set of test tasks with different completion dates and due dates
async function setupTestTasks() {
  const now = new Date();

  // Just created task (not completed)
  const task1 = {
    id: '1',
    title: 'Task 1 - Not Completed',
    completed: false,
    archived: false,
    createdAt: now.toISOString(),
    dueDate: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString() // Due in 2 days
  };

  // Task completed just now (less than 24 hours ago)
  const task2 = {
    id: '2',
    title: 'Task 2 - Completed Now (should not archive yet)',
    completed: true,
    archived: false,
    createdAt: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString(), // Created 2 days ago
    completedAt: now.toISOString(),
    dueDate: new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)).toISOString() // Due tomorrow
  };

  // Task completed 25 hours ago (more than 24 hours ago) and past due
  const task3 = {
    id: '3',
    title: 'Task 3 - Completed >24hrs ago & Past Due (should archive)',
    completed: true,
    archived: false,
    createdAt: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString(), // Created 5 days ago
    completedAt: new Date(now.getTime() - (25 * 60 * 60 * 1000)).toISOString(), // Completed 25 hours ago
    dueDate: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString() // Due date was yesterday
  };

  // Task completed 25 hours ago but not past due
  const task4 = {
    id: '4',
    title: 'Task 4 - Completed >24hrs ago but still not due (should archive)',
    completed: true,
    archived: false,
    createdAt: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString(), // Created 5 days ago
    completedAt: new Date(now.getTime() - (25 * 60 * 60 * 1000)).toISOString(), // Completed 25 hours ago
    dueDate: new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString() // Due in 5 days
  };

  // Task completed 10 days ago (should definitely archive)
  const task5 = {
    id: '5',
    title: 'Task 5 - Completed 10 days ago (should archive)',
    completed: true,
    archived: false,
    createdAt: new Date(now.getTime() - (20 * 24 * 60 * 60 * 1000)).toISOString(), // Created 20 days ago
    completedAt: new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString(), // Completed 10 days ago
    dueDate: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)).toISOString() // Was due 15 days ago
  };

  const tasks = [task1, task2, task3, task4, task5];

  // Set up default settings
  const settings = {
    autoArchive: true,
    archiveDays: 7, // Archive after 7 days
    taskRetentionWeeks: 12 // Keep archived tasks for 12 weeks
  };

  // Save to AsyncStorage
  await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
  await AsyncStorage.setItem('settings', JSON.stringify(settings));

  console.log('Test tasks created:');
  console.log(tasks);
  console.log('\nSettings created:');
  console.log(settings);

  return { tasks, settings };
}

// Run the test
async function runArchiveTest() {
  try {
    console.log('--- Setting up test data ---');
    await setupTestTasks();

    console.log('\n--- Running archive task ---');
    const result = await runArchiveTaskManually();
    console.log('Archive task completed with result:', result);

    console.log('\n--- Checking results ---');
    const tasksAfter = JSON.parse(await AsyncStorage.getItem('tasks'));

    console.log('\nTasks after archiving:');
    tasksAfter.forEach(task => {
      console.log(`Task ${task.id}: "${task.title}" - Completed: ${task.completed}, Archived: ${task.archived}`);
    });

    // Verify expectations
    const task1After = tasksAfter.find(t => t.id === '1');
    const task2After = tasksAfter.find(t => t.id === '2');
    const task3After = tasksAfter.find(t => t.id === '3');
    const task4After = tasksAfter.find(t => t.id === '4');
    const task5After = tasksAfter.find(t => t.id === '5');

    console.log('\n--- Verification ---');
    console.log(`Task 1: Should not be archived: ${!task1After.archived ? 'PASS' : 'FAIL'}`);
    console.log(`Task 2: Should not be archived (< 24hrs): ${!task2After.archived ? 'PASS' : 'FAIL'}`);
    console.log(`Task 3: Should be archived (>24hrs + past due): ${task3After.archived ? 'PASS' : 'FAIL'}`);
    console.log(`Task 4: Should be archived (>24hrs old completion): ${task4After.archived ? 'PASS' : 'FAIL'}`);
    console.log(`Task 5: Should be archived (10 days old): ${task5After.archived ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Execute the test
runArchiveTest().then(() => {
  console.log('\nTest completed!');
});
