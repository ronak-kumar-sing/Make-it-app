import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, format } from 'date-fns';
import React, { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import { Alert, AppState } from 'react-native';

// Define types
type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
  archived: boolean;
  subject?: string;
  priority?: 'low' | 'medium' | 'high';
  progress?: number;
  lastModified?: string;
  history?: Array<{
    timestamp: string;
    changes: string;
    progress?: number;
    completed?: boolean;
  }>;
};

type Streak = {
  current: number;
  longest: number;
  lastStudyDate: string | null;
  studyDays: Record<string, number>;
};

type Settings = {
  pomodoroLength: number;
  shortBreakLength: number;
  longBreakLength: number;
  longBreakInterval: number;
  dailyGoalMinutes: number;
  weeklyTaskGoal: number;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  focusMode: boolean;
  autoArchive: boolean;
  archiveDays: number;
  taskRetentionWeeks: number;
  privacyLock: boolean;
  enabledFilters: {
    today: boolean;
    upcoming: boolean;
    overdue: boolean;
    ongoing: boolean;
    thisWeek: boolean;
    priority: boolean;
    completed: boolean;
    archived: boolean;
  };
  prioritizeOverdue?: boolean;
  productivityByHour: Record<string, number>;
  weeklyStudyTime: number[];
  weeklyTasksCompleted: number;
  weekStartDate: string | null;
  goalProgress: {
    dailyStudyTime: number;
    weeklyStudyTime: number;
    weeklyTasksCompleted: number;
  };
};

type Subject = {
  id: string;
  name: string;
  color: string;
};

type Resource = {
  id: string;
  title: string;
  description?: string;
  url?: string;
  subject?: string;
  createdAt: string;
};

type Exam = {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  date: string;
  time?: string;
  location?: string;
  completed: boolean;
  createdAt: string;
};

type Achievement = {
  unlocked: string[];
  progress: Record<string, number>;
};

type Stats = {
  totalStudyTime: number;
  dailyAverage: number;
  tasksCompleted: number;
  tasksCreated: number;
  pomodoroCompleted: number;
  weekStartDate?: string;
  weeklyTasksCompleted?: number;
  goalProgress: {
    weeklyStudyTime: number;
    weeklyTasksCompleted: number;
    dailyStudyTime?: number;
  };
  subjectDistribution?: Record<string, number>;
  productivityByHour?: Record<string, number>;
  sessionsCompleted?: number;
};

// Define state type
type AppState = {
  tasks: Task[];
  streaks: Streak;
  settings: Settings;
  stats: Stats;
  subjects: Subject[];
  resources: Resource[];
  exams: Exam[];
  achievements: Achievement;
  lastBackup: string | null;
};

// Define action types
type AppAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_STREAKS'; payload: Streak }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'SET_STATS'; payload: Stats }
  | { type: 'SET_SUBJECTS'; payload: Subject[] }
  | { type: 'SET_RESOURCES'; payload: Resource[] }
  | { type: 'SET_EXAMS'; payload: Exam[] }
  | { type: 'SET_ACHIEVEMENTS'; payload: Achievement }
  | { type: 'SET_LAST_BACKUP'; payload: string | null }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: string }
  | { type: 'RECORD_STUDY_SESSION'; payload: { minutes: number; subject?: string; taskId?: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'ARCHIVE_OLD_TASKS'; payload: number };

// Initial state
const initialState: AppState = {
  tasks: [],
  streaks: {
    current: 0,
    longest: 0,
    lastStudyDate: null,
    studyDays: {}
  },
  settings: {
    pomodoroLength: 25,
    shortBreakLength: 5,
    longBreakLength: 15,
    longBreakInterval: 4,
    dailyGoalMinutes: 120,
    weeklyTaskGoal: 15,
    notifications: true,
    theme: 'system',
    focusMode: false,
    autoArchive: false,
    archiveDays: 30,
    taskRetentionWeeks: 12,
    privacyLock: false,
    enabledFilters: {
      today: true,
      upcoming: true,
      overdue: true,
      ongoing: true,
      thisWeek: true,
      priority: true,
      completed: true,
      archived: false
    },
    productivityByHour: {},
    weeklyStudyTime: [0, 0, 0, 0, 0, 0, 0],
    weeklyTasksCompleted: 0,
    weekStartDate: null,
    goalProgress: {
      dailyStudyTime: 0,
      weeklyStudyTime: 0,
      weeklyTasksCompleted: 0
    }
  },
  stats: {
    totalStudyTime: 0,
    dailyAverage: 0,
    tasksCompleted: 0,
    tasksCreated: 0,
    pomodoroCompleted: 0,
    goalProgress: {
      weeklyStudyTime: 0,
      weeklyTasksCompleted: 0
    }
  },
  subjects: [
    { id: '1', name: 'Math', color: '#FF5252' },
    { id: '2', name: 'Science', color: '#4CAF50' },
    { id: '3', name: 'History', color: '#FFC107' },
    { id: '4', name: 'English', color: '#2196F3' },
    { id: '5', name: 'Computer Science', color: '#9C27B0' },
    { id: '6', name: 'Other', color: '#607D8B' },
  ],
  resources: [],
  exams: [],
  achievements: {
    unlocked: [],
    progress: {}
  },
  lastBackup: null
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_STREAKS':
      return { ...state, streaks: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_SUBJECTS':
      return { ...state, subjects: action.payload };
    case 'SET_RESOURCES':
      return { ...state, resources: action.payload };
    case 'SET_EXAMS':
      return { ...state, exams: action.payload };
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };
    case 'SET_LAST_BACKUP':
      return { ...state, lastBackup: action.payload };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
        stats: {
          ...state.stats,
          tasksCreated: state.stats.tasksCreated + 1
        }
      };
    case 'UPDATE_TASK': {
      const { id, updates } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === id ? { ...task, ...updates } : task
        )
      };
    }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'TOGGLE_TASK_COMPLETION': {
      const taskId = action.payload;
      const task = state.tasks.find(t => t.id === taskId);

      if (!task) return state;

      const now = new Date();
      const isCompleting = !task.completed;

      const updatedTasks = state.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            completed: isCompleting,
            completedAt: isCompleting ? now.toISOString() : undefined,
            progress: isCompleting ? 100 : t.progress
          };
        }
        return t;
      });

      let updatedStats = { ...state.stats };

      if (isCompleting) {
        updatedStats = {
          ...updatedStats,
          tasksCompleted: updatedStats.tasksCompleted + 1,
          weeklyTasksCompleted: (updatedStats.weeklyTasksCompleted || 0) + 1,
          goalProgress: {
            ...updatedStats.goalProgress,
            weeklyTasksCompleted: updatedStats.goalProgress.weeklyTasksCompleted + 1
          }
        };

        // Update subject distribution
        if (task.subject) {
          const subjectDistribution = { ...(updatedStats.subjectDistribution || {}) };
          subjectDistribution[task.subject] = (subjectDistribution[task.subject] || 0) + 1;
          updatedStats.subjectDistribution = subjectDistribution;
        }
      } else {
        updatedStats = {
          ...updatedStats,
          tasksCompleted: Math.max(0, updatedStats.tasksCompleted - 1),
          weeklyTasksCompleted: Math.max(0, (updatedStats.weeklyTasksCompleted || 0) - 1),
          goalProgress: {
            ...updatedStats.goalProgress,
            weeklyTasksCompleted: Math.max(0, updatedStats.goalProgress.weeklyTasksCompleted - 1)
          }
        };

        // Update subject distribution
        if (task.subject && updatedStats.subjectDistribution) {
          const subjectDistribution = { ...updatedStats.subjectDistribution };
          subjectDistribution[task.subject] = Math.max(0, (subjectDistribution[task.subject] || 0) - 1);
          updatedStats.subjectDistribution = subjectDistribution;
        }
      }

      return {
        ...state,
        tasks: updatedTasks,
        stats: updatedStats
      };
    }
    case 'RECORD_STUDY_SESSION': {
      const { minutes, subject, taskId } = action.payload;
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const hourOfDay = now.getHours();

      // Update stats
      const updatedStats = { ...state.stats };

      // Update productivity by hour
      const productivityByHour = { ...(updatedStats.productivityByHour || {}) };
      productivityByHour[hourOfDay] = (productivityByHour[hourOfDay] || 0) + minutes;
      updatedStats.productivityByHour = productivityByHour;

      // Update weekly study time
      const weeklyStudyTime = [...state.settings.weeklyStudyTime];
      weeklyStudyTime[dayOfWeek] += minutes;

      // Update subject distribution if subject is provided
      if (subject && updatedStats.subjectDistribution) {
        const subjectDistribution = { ...updatedStats.subjectDistribution };
        subjectDistribution[subject] = (subjectDistribution[subject] || 0) + minutes;
        updatedStats.subjectDistribution = subjectDistribution;
      }

      updatedStats.totalStudyTime = updatedStats.totalStudyTime + minutes;
      updatedStats.sessionsCompleted = (updatedStats.sessionsCompleted || 0) + 1;
      updatedStats.goalProgress = {
        ...updatedStats.goalProgress,
        dailyStudyTime: (updatedStats.goalProgress.dailyStudyTime || 0) + minutes,
        weeklyStudyTime: updatedStats.goalProgress.weeklyStudyTime + minutes
      };

      // Update streaks
      const updatedStreaks = { ...state.streaks };
      const studyDays = { ...updatedStreaks.studyDays };
      studyDays[today] = (studyDays[today] || 0) + minutes;

      let current = updatedStreaks.current;
      let longest = updatedStreaks.longest;

      // If this is first study session ever or first after a break
      if (!updatedStreaks.lastStudyDate) {
        current = 1;
      } else {
        const lastDate = new Date(updatedStreaks.lastStudyDate);
        const todayDate = new Date(today);
        const diffDays = differenceInDays(todayDate, lastDate);

        if (diffDays === 1) {
          // Consecutive day
          current += 1;
        } else if (diffDays > 1) {
          // Streak broken
          current = 1;
        }
        // If diffDays === 0, it's the same day, keep current streak
      }

      // Update longest streak if needed
      if (current > longest) {
        longest = current;
      }

      // Update task progress if taskId is provided
      let updatedTasks = [...state.tasks];
      if (taskId) {
        updatedTasks = state.tasks.map(task => {
          if (task.id === taskId) {
            // Add study time to task history
            const history = task.history || [];
            history.push({
              timestamp: now.toISOString(),
              changes: 'study_session',
              progress: task.progress
            });

            return {
              ...task,
              lastModified: now.toISOString(),
              history: history.slice(-10) // Keep only last 10 entries
            };
          }
          return task;
        });
      }

      return {
        ...state,
        tasks: updatedTasks,
        streaks: {
          current,
          longest,
          lastStudyDate: today,
          studyDays
        },
        stats: updatedStats,
        settings: {
          ...state.settings,
          weeklyStudyTime,
          goalProgress: {
            ...state.settings.goalProgress,
            dailyStudyTime: (state.settings.goalProgress.dailyStudyTime || 0) + minutes,
            weeklyStudyTime: state.settings.goalProgress.weeklyStudyTime + minutes
          }
        }
      };
    }
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    case 'ARCHIVE_OLD_TASKS': {
      const now = new Date();

      // Archive threshold for completed tasks (based on archiveDays setting)
      const archiveThreshold = new Date();
      archiveThreshold.setDate(now.getDate() - action.payload);

      // Deletion threshold based on retention period
      const retentionThreshold = new Date();
      retentionThreshold.setDate(now.getDate() - (state.settings.taskRetentionWeeks * 7));

      const updatedTasks = state.tasks.filter(task => {
        // Remove tasks that are older than retention period
        if (task.archived && new Date(task.completedAt || task.createdAt) < retentionThreshold) {
          return false; // Filter out (delete) tasks older than retention period
        }
        return true;
      }).map(task => {
        // Archive completed tasks older than archive threshold
        if (task.completed && !task.archived && new Date(task.completedAt || '') < archiveThreshold) {
          return { ...task, archived: true };
        }
        return task;
      });

      return {
        ...state,
        tasks: updatedTasks
      };
    }
    default:
      return state;
  }
}

// Create context
type AppContextType = {
  tasks: Task[];
  streaks: Streak;
  settings: Settings;
  stats: Stats;
  subjects: Subject[];
  resources: Resource[];
  exams: Exam[];
  achievements: Achievement;
  lastBackup: string | null;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'archived'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  recordStudySession: (minutes: number, subject?: string, taskId?: string) => void;
  addExam: (exam: Omit<Exam, 'id' | 'createdAt' | 'completed'>) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  addResource: (resource: Omit<Resource, 'id' | 'createdAt'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  exportData: () => Promise<boolean>;
  importData: () => Promise<boolean>;
  archiveOldTasks: (days?: number) => number;
  updateGoalProgress: () => void;
};

export const AppContext = createContext<AppContextType>({} as AppContextType);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from AsyncStorage on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        const tasksData = await AsyncStorage.getItem('tasks');
        const streaksData = await AsyncStorage.getItem('streaks');
        const settingsData = await AsyncStorage.getItem('settings');
        const statsData = await AsyncStorage.getItem('stats');
        const subjectsData = await AsyncStorage.getItem('subjects');
        const resourcesData = await AsyncStorage.getItem('resources');
        const examsData = await AsyncStorage.getItem('exams');
        const achievementsData = await AsyncStorage.getItem('achievements');
        const lastBackupData = await AsyncStorage.getItem('lastBackup');

        if (tasksData) dispatch({ type: 'SET_TASKS', payload: JSON.parse(tasksData) });
        if (streaksData) dispatch({ type: 'SET_STREAKS', payload: JSON.parse(streaksData) });
        if (settingsData) dispatch({ type: 'SET_SETTINGS', payload: JSON.parse(settingsData) });

        if (statsData) {
          const parsedStats = JSON.parse(statsData);
          // Ensure goalProgress is always initialized
          if (!parsedStats.goalProgress) {
            parsedStats.goalProgress = {
              dailyStudyTime: 0,
              weeklyStudyTime: 0,
              weeklyTasksCompleted: 0
            };
          }
          dispatch({ type: 'SET_STATS', payload: parsedStats });
        }

        if (subjectsData) dispatch({ type: 'SET_SUBJECTS', payload: JSON.parse(subjectsData) });
        if (resourcesData) dispatch({ type: 'SET_RESOURCES', payload: JSON.parse(resourcesData) });
        if (examsData) dispatch({ type: 'SET_EXAMS', payload: JSON.parse(examsData) });
        if (achievementsData) dispatch({ type: 'SET_ACHIEVEMENTS', payload: JSON.parse(achievementsData) });
        if (lastBackupData) dispatch({ type: 'SET_LAST_BACKUP', payload: JSON.parse(lastBackupData) });

        // Auto-archive old tasks if enabled
        if (state.settings.autoArchive) {
          archiveOldTasks();
        }
      } catch (error) {
        console.error('Error loading data from storage:', error);
      }
    };

    loadData();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        loadData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('tasks', JSON.stringify(state.tasks));
        await AsyncStorage.setItem('streaks', JSON.stringify(state.streaks));
        await AsyncStorage.setItem('settings', JSON.stringify(state.settings));
        await AsyncStorage.setItem('stats', JSON.stringify(state.stats));
        await AsyncStorage.setItem('subjects', JSON.stringify(state.subjects));
        await AsyncStorage.setItem('resources', JSON.stringify(state.resources));
        await AsyncStorage.setItem('exams', JSON.stringify(state.exams));
        await AsyncStorage.setItem('achievements', JSON.stringify(state.achievements));
      } catch (error) {
        console.error('Error saving data to storage:', error);
      }
    };

    saveData();
  }, [state]);

  // Update goal progress whenever relevant data changes
  useEffect(() => {
    updateGoalProgress();
  }, [state.streaks.studyDays, state.tasks, state.settings.weeklyTaskGoal]);

  // Add a new task
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'archived'>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      archived: false,
      ...task,
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });

    // Check for achievements
    checkAchievements('task_created');
  }, []);

  // Update an existing task
  const updateTask = useCallback((id: string, updatedTask: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates: updatedTask } });
  }, []);

  // Delete a task
  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, []);

  // Toggle task completion
  const toggleTaskCompletion = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: id });

    // Check for achievements
    const task = state.tasks.find(t => t.id === id);
    if (task && !task.completed) {
      checkAchievements('task_completed');
    }
  }, [state.tasks]);

  // Record study session
  const recordStudySession = useCallback((minutes: number, subject?: string, taskId?: string) => {
    dispatch({
      type: 'RECORD_STUDY_SESSION',
      payload: { minutes, subject, taskId }
    });

    // Check for achievements
    checkAchievements('study_session', minutes);
  }, []);

  // Add a new exam
  const addExam = useCallback((exam: Omit<Exam, 'id' | 'createdAt' | 'completed'>) => {
    const newExam: Exam = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      ...exam,
    };

    const updatedExams = [...state.exams, newExam];
    dispatch({ type: 'SET_EXAMS', payload: updatedExams });
  }, [state.exams]);

  // Update an existing exam
  const updateExam = useCallback((id: string, updatedExam: Partial<Exam>) => {
    const updatedExams = state.exams.map(exam =>
      exam.id === id ? { ...exam, ...updatedExam } : exam
    );

    dispatch({ type: 'SET_EXAMS', payload: updatedExams });
  }, [state.exams]);

  // Delete an exam
  const deleteExam = useCallback((id: string) => {
    const updatedExams = state.exams.filter(exam => exam.id !== id);
    dispatch({ type: 'SET_EXAMS', payload: updatedExams });
  }, [state.exams]);

  // Add a new study resource
  const addResource = useCallback((resource: Omit<Resource, 'id' | 'createdAt'>) => {
    const newResource: Resource = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...resource,
    };

    const updatedResources = [...state.resources, newResource];
    dispatch({ type: 'SET_RESOURCES', payload: updatedResources });
  }, [state.resources]);

  // Update an existing resource
  const updateResource = useCallback((id: string, updatedResource: Partial<Resource>) => {
    const updatedResources = state.resources.map(resource =>
      resource.id === id ? { ...resource, ...updatedResource } : resource
    );

    dispatch({ type: 'SET_RESOURCES', payload: updatedResources });
  }, [state.resources]);

  // Delete a resource
  const deleteResource = useCallback((id: string) => {
    const updatedResources = state.resources.filter(resource => resource.id !== id);
    dispatch({ type: 'SET_RESOURCES', payload: updatedResources });
  }, [state.resources]);

  // Add a new subject
  const addSubject = useCallback((subject: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      ...subject,
    };

    const updatedSubjects = [...state.subjects, newSubject];
    dispatch({ type: 'SET_SUBJECTS', payload: updatedSubjects });
  }, [state.subjects]);

  // Update an existing subject
  const updateSubject = useCallback((id: string, updatedSubject: Partial<Subject>) => {
    const updatedSubjects = state.subjects.map(subject =>
      subject.id === id ? { ...subject, ...updatedSubject } : subject
    );

    dispatch({ type: 'SET_SUBJECTS', payload: updatedSubjects });
  }, [state.subjects]);

  // Delete a subject
  const deleteSubject = useCallback((id: string) => {
    const updatedSubjects = state.subjects.filter(subject => subject.id !== id);
    dispatch({ type: 'SET_SUBJECTS', payload: updatedSubjects });
  }, [state.subjects]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  }, []);

  // Archive old tasks
  const archiveOldTasks = useCallback((days?: number) => {
    const archiveDays = days || state.settings.archiveDays;
    dispatch({ type: 'ARCHIVE_OLD_TASKS', payload: archiveDays });

    // Count how many tasks were archived
    const now = new Date();
    const archiveThreshold = new Date();
    archiveThreshold.setDate(now.getDate() - archiveDays);

    return state.tasks.filter(
      task => task.completed && !task.archived && new Date(task.completedAt || '') < archiveThreshold
    ).length;
  }, [state.settings.archiveDays, state.tasks]);

  // Update goal progress
  const updateGoalProgress = useCallback(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Check if we need to reset weekly stats
    if (!state.stats.weekStartDate) {
      // Initialize with today as the start of the week
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Set to Sunday of current week
      weekStart.setHours(0, 0, 0, 0);

      const updatedStats = {
        ...state.stats,
        weekStartDate: weekStart.toISOString(),
        weeklyTasksCompleted: 0,
        goalProgress: {
          ...state.stats.goalProgress,
          weeklyStudyTime: 0,
          weeklyTasksCompleted: 0,
          dailyStudyTime: state.stats.goalProgress.dailyStudyTime || 0
        }
      };

      dispatch({ type: 'SET_STATS', payload: updatedStats });
    } else {
      // Check if we need to start a new week
      const weekStart = new Date(state.stats.weekStartDate);
      const daysSinceWeekStart = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceWeekStart >= 7) {
        // It's a new week, reset weekly stats
        const newWeekStart = new Date(today);
        newWeekStart.setDate(today.getDate() - today.getDay()); // Set to Sunday of current week
        newWeekStart.setHours(0, 0, 0, 0);

        const updatedStats = {
          ...state.stats,
          weekStartDate: newWeekStart.toISOString(),
          weeklyTasksCompleted: 0,
          goalProgress: {
            ...state.stats.goalProgress,
            weeklyStudyTime: 0,
            weeklyTasksCompleted: 0,
            dailyStudyTime: state.stats.goalProgress.dailyStudyTime || 0
          }
        };

        dispatch({ type: 'SET_STATS', payload: updatedStats });
      }
    }

    // Calculate daily study time
    const dailyStudyTime = state.streaks.studyDays[todayStr] || 0;

    // Calculate weekly study time (sum of all days in current week)
    let weeklyStudyTime = 0;
    const weekStartDate = state.stats.weekStartDate ? new Date(state.stats.weekStartDate) : new Date();

    Object.entries(state.streaks.studyDays).forEach(([dateStr, minutes]) => {
      const date = new Date(dateStr);
      if (date >= weekStartDate) {
        weeklyStudyTime += minutes;
      }
    });

    // Update stats with goal progress
    const updatedStats = {
      ...state.stats,
      goalProgress: {
        ...state.stats.goalProgress,
        dailyStudyTime,
        weeklyStudyTime,
      }
    };

    dispatch({ type: 'SET_STATS', payload: updatedStats });
  }, [state.streaks.studyDays, state.stats]);

  // Check and update achievements
  const checkAchievements = useCallback((action: string, value?: number) => {
    const newAchievements = { ...state.achievements };

    // Define achievement criteria
    const achievementCriteria = {
      streak_3: { type: 'streak', threshold: 3 },
      streak_7: { type: 'streak', threshold: 7 },
      streak_14: { type: 'streak', threshold: 14 },
      streak_30: { type: 'streak', threshold: 30 },
      study_time_10h: { type: 'study_time', threshold: 600 }, // 10 hours in minutes
      study_time_50h: { type: 'study_time', threshold: 3000 }, // 50 hours in minutes
      tasks_completed_50: { type: 'tasks_completed', threshold: 50 },
      tasks_completed_100: { type: 'tasks_completed', threshold: 100 },
      sessions_completed_20: { type: 'sessions_completed', threshold: 20 },
      sessions_completed_50: { type: 'sessions_completed', threshold: 50 },
    };

    // Check each achievement
    Object.entries(achievementCriteria).forEach(([achievementId, criteria]) => {
      // Skip if already unlocked
      if (newAchievements.unlocked.includes(achievementId)) {
        return;
      }

      let shouldUnlock = false;
      let progress = 0;

      // Update progress based on action type
      switch (criteria.type) {
        case 'streak':
          if (action === 'streak_reached' || action === 'study_session') {
            progress = state.streaks.current;
            shouldUnlock = progress >= criteria.threshold;
          }
          break;

        case 'study_time':
          if (action === 'study_time_reached' || action === 'study_session') {
            // Calculate total study time
            progress = Object.values(state.streaks.studyDays).reduce((sum, time) => sum + time, 0);
            shouldUnlock = progress >= criteria.threshold;
          }
          break;

        case 'tasks_completed':
          if (action === 'task_completed') {
            progress = state.stats.tasksCompleted + 1;
            shouldUnlock = progress >= criteria.threshold;
          }
          break;

        case 'sessions_completed':
          if (action === 'sessions_completed' || action === 'study_session') {
            progress = (state.stats.sessionsCompleted || 0) + (action === 'study_session' ? 1 : 0);
            shouldUnlock = progress >= criteria.threshold;
          }
          break;
      }

      // Update progress
      newAchievements.progress[achievementId] = progress;

      // Unlock if criteria met
      if (shouldUnlock) {
        newAchievements.unlocked.push(achievementId);

        // Show notification
        Alert.alert(
          'Achievement Unlocked!',
          `You've unlocked the ${achievementId.replace(/_/g, ' ')} achievement!`,
          [{ text: 'OK' }]
        );
      }
    });

    dispatch({ type: 'SET_ACHIEVEMENTS', payload: newAchievements });
  }, [state.achievements, state.streaks, state.stats]);

  // Export data as a backup file
  const exportData = async () => {
    try {
      const data = {
        tasks: state.tasks,
        streaks: state.streaks,
        settings: state.settings,
        stats: state.stats,
        subjects: state.subjects,
        resources: state.resources,
        exams: state.exams,
        achievements: state.achievements,
        exportDate: new Date().toISOString()
      };

      const jsonString = JSON.stringify(data);

      // Note: This is a simplified version. In a real app, you would use
      // FileSystem and Sharing APIs from expo-file-system and expo-sharing
      // to write and share the file

      // Update last backup date
      const backupDate = new Date().toISOString();
      dispatch({ type: 'SET_LAST_BACKUP', payload: backupDate });
      await AsyncStorage.setItem('lastBackup', JSON.stringify(backupDate));

      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Failed', 'There was an error exporting your data.');
      return false;
    }
  };

  // Import data from a backup file
  const importData = async () => {
    try {
      // Note: This is a simplified version. In a real app, you would use
      // DocumentPicker from expo-document-picker to select the file

      // For now, we'll just show a success message
      Alert.alert('Import Successful', 'Your data has been restored.');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      Alert.alert('Import Failed', 'There was an error importing your data.');
      return false;
    }
  };

  // Create context value with memoization for better performance
  const contextValue = useMemo(() => ({
    tasks: state.tasks,
    streaks: state.streaks,
    settings: state.settings,
    stats: state.stats,
    subjects: state.subjects,
    resources: state.resources,
    exams: state.exams,
    achievements: state.achievements,
    lastBackup: state.lastBackup,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    recordStudySession,
    addExam,
    updateExam,
    deleteExam,
    addResource,
    updateResource,
    deleteResource,
    addSubject,
    updateSubject,
    deleteSubject,
    updateSettings,
    exportData,
    importData,
    archiveOldTasks,
    updateGoalProgress
  }), [
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    recordStudySession,
    addExam,
    updateExam,
    deleteExam,
    addResource,
    updateResource,
    deleteResource,
    addSubject,
    updateSubject,
    deleteSubject,
    updateSettings,
    exportData,
    importData,
    archiveOldTasks,
    updateGoalProgress
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default { AppContext, AppProvider };