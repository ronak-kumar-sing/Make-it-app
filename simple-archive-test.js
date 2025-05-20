// Archive test - testing one day grace period before archiving

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

// Manual implementation of the archiving function
async function runArchiveTest() {
  const now = new Date();

  // Create test tasks
  const tasks = [
    // Task 1: Not completed - should not be archived
    {
      id: '1',
      title: 'Task 1 - Not Completed',
      completed: false,
      archived: false,
      createdAt: now.toISOString(),
      dueDate: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString()
    },

    // Task 2: Completed just now - should not be archived (less than 24h)
    {
      id: '2',
      title: 'Task 2 - Completed Now',
      completed: true,
      archived: false,
      createdAt: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
      completedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)).toISOString()
    },

    // Task 3: Completed 25 hours ago and past due - should be archived
    {
      id: '3',
      title: 'Task 3 - Completed >24hrs ago & Past Due',
      completed: true,
      archived: false,
      createdAt: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString(),
      completedAt: new Date(now.getTime() - (25 * 60 * 60 * 1000)).toISOString(),
      dueDate: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString()
    },

    // Task 4: Completed 25 hours ago but not due yet - should be archived because >24h
    {
      id: '4',
      title: 'Task 4 - Completed >24hrs ago but still not due',
      completed: true,
      archived: false,
      createdAt: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString(),
      completedAt: new Date(now.getTime() - (25 * 60 * 60 * 1000)).toISOString(),
      dueDate: new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString()
    },

    // Task 5: Completed 10 days ago - definitely should be archived
    {
      id: '5',
      title: 'Task 5 - Completed 10 days ago',
      completed: true,
      archived: false,
      createdAt: new Date(now.getTime() - (20 * 24 * 60 * 60 * 1000)).toISOString(),
      completedAt: new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString(),
      dueDate: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)).toISOString()
    }
  ];

  // Create settings
  const settings = {
    autoArchive: true,
    archiveDays: 7, // Archive after 7 days
    taskRetentionWeeks: 12
  };

  console.log('--- Test Setup ---');
  console.log('Created tasks with different completion times');
  console.log('Current time is:', now.toISOString());

  // Process tasks with our archiving algorithm
  console.log('\n--- Running Archive Process ---');

  const updatedTasks = tasks.map(task => {
    const taskDate = task.completedAt ? new Date(task.completedAt) : null;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isPastDue = dueDate && dueDate <= now;

    console.log(`\nProcessing task ${task.id}: ${task.title}`);
    console.log(`- Completed: ${task.completed}`);
    console.log(`- Completed at: ${task.completedAt || 'N/A'}`);
    console.log(`- Due date: ${task.dueDate}`);

    // Archive threshold (based on settings)
    const archiveThreshold = new Date();
    archiveThreshold.setDate(now.getDate() - settings.archiveDays);

    // One-day grace period threshold
    const oneDayThreshold = new Date();
    oneDayThreshold.setDate(now.getDate() - 1); // One day ago

    console.log(`- Is past due: ${isPastDue}`);
    console.log(`- Is completed more than 24 hours ago: ${taskDate && taskDate < oneDayThreshold}`);
    console.log(`- Is completed more than ${settings.archiveDays} days ago: ${taskDate && taskDate < archiveThreshold}`);

    let shouldArchive = false;

    // Only consider archiving if task is completed and not already archived
    if (task.completed && !task.archived && taskDate) {
      // First check if task has been completed for at least one day
      if (taskDate < oneDayThreshold) {
        // Then check if it meets archiving criteria:
        // Either it's older than archive threshold OR it's past due
        if (taskDate < archiveThreshold || isPastDue) {
          shouldArchive = true;
        }
      }
    }

    console.log(`=> Should archive: ${shouldArchive}`);

    if (shouldArchive) {
      return { ...task, archived: true };
    }
    return task;
  });

  console.log('\n--- Results ---');
  updatedTasks.forEach(task => {
    console.log(`Task ${task.id}: "${task.title}" - Archived: ${task.archived}`);
  });

  console.log('\n--- Verification ---');
  console.log(`Task 1: Should not be archived: ${!updatedTasks.find(t => t.id === '1').archived ? 'PASS' : 'FAIL'}`);
  console.log(`Task 2: Should not be archived (< 24hrs): ${!updatedTasks.find(t => t.id === '2').archived ? 'PASS' : 'FAIL'}`);
  console.log(`Task 3: Should be archived (>24hrs + past due): ${updatedTasks.find(t => t.id === '3').archived ? 'PASS' : 'FAIL'}`);
  console.log(`Task 4: Should be archived (>24hrs old completion): ${updatedTasks.find(t => t.id === '4').archived ? 'PASS' : 'FAIL'}`);
  console.log(`Task 5: Should be archived (10 days old): ${updatedTasks.find(t => t.id === '5').archived ? 'PASS' : 'FAIL'}`);
}

// Run the test
runArchiveTest().then(() => {
  console.log('\nTest completed!');
});
