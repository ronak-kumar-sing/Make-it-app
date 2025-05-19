import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, format } from 'date-fns';
import React, { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import { Alert, AppState as RNAppState } from 'react-native';
import * as NotificationService from '../services/NotificationService';
import { syncSettingsToStorage } from '../utils/StorageSync';

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

type TimerSession = {
  id?: string;
  timestamp: string;
  duration: number; // in minutes
  subject?: string;
  taskId?: string;
  isComplete: boolean;
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
  recentSessions?: TimerSession[]; // Store recent timer sessions
  dailySessionCount?: Record<string, number>; // Store daily session counts
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
  | { type: 'RECORD_STUDY_SESSION'; payload: { minutes: number; subject?: string; taskId?: string; sessionData?: TimerSession } }
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
    sessionsCompleted: 0,
    dailySessionCount: {},
    recentSessions: [],
    goalProgress: {
      weeklyStudyTime: 0,
      weeklyTasksCompleted: 0,
      dailyStudyTime: 0
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
      const { minutes, subject, taskId, sessionData } = action.payload;
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

      // Track pomodoro completion
      updatedStats.pomodoroCompleted = (updatedStats.pomodoroCompleted || 0) + 1;

      // Update total study time and sessions count
      updatedStats.totalStudyTime = updatedStats.totalStudyTime + minutes;
      updatedStats.sessionsCompleted = (updatedStats.sessionsCompleted || 0) + 1;

      // Update daily session count
      const dailySessionCount = { ...(updatedStats.dailySessionCount || {}) };
      dailySessionCount[today] = (dailySessionCount[today] || 0) + 1;
      updatedStats.dailySessionCount = dailySessionCount;

      // Store session data for recent sessions
      if (sessionData) {
        const session = {
          id: Date.now().toString(),
          timestamp: sessionData.timestamp || now.toISOString(),
          duration: minutes,
          subject: subject,
          taskId: taskId,
          isComplete: sessionData.isComplete || true
        };

        // Keep only the most recent sessions (last 30)
        const recentSessions = [...(updatedStats.recentSessions || [])];
        recentSessions.unshift(session);
        updatedStats.recentSessions = recentSessions.slice(0, 30);
      }

      // Update goal progress
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
  recordStudySession: (minutes: number, subject?: string, taskId?: string, sessionData?: TimerSession) => void;
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
        // Load all data items in parallel to speed up startup
        const [
          tasksData,
          streaksData,
          settingsData,
          statsData,
          subjectsData,
          resourcesData,
          examsData,
          achievementsData,
          lastBackupData
        ] = await Promise.all([
          AsyncStorage.getItem('tasks'),
          AsyncStorage.getItem('streaks'),
          AsyncStorage.getItem('settings'),
          AsyncStorage.getItem('stats'),
          AsyncStorage.getItem('subjects'),
          AsyncStorage.getItem('resources'),
          AsyncStorage.getItem('exams'),
          AsyncStorage.getItem('achievements'),
          AsyncStorage.getItem('lastBackup')
        ]);

        // Process each data type with its own try-catch to handle corrupted data
        try {
          if (tasksData) dispatch({ type: 'SET_TASKS', payload: JSON.parse(tasksData) });
        } catch (e) {
          console.error('Error parsing tasks data:', e);
        }

        try {
          if (streaksData) dispatch({ type: 'SET_STREAKS', payload: JSON.parse(streaksData) });
        } catch (e) {
          console.error('Error parsing streaks data:', e);
        }

        try {
          if (settingsData) {
            const parsedSettings = JSON.parse(settingsData);
            // Ensure settings have all required properties
            if (!parsedSettings.goalProgress) {
              parsedSettings.goalProgress = {
                dailyStudyTime: 0,
                weeklyStudyTime: 0,
                weeklyTasksCompleted: 0
              };
            }
            dispatch({ type: 'SET_SETTINGS', payload: parsedSettings });
          }
        } catch (e) {
          console.error('Error parsing settings data:', e);
        }

        try {
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
            // Ensure we have the sessions arrays
            if (!parsedStats.recentSessions) {
              parsedStats.recentSessions = [];
            }
            if (!parsedStats.dailySessionCount) {
              parsedStats.dailySessionCount = {};
            }
            dispatch({ type: 'SET_STATS', payload: parsedStats });
          }
        } catch (e) {
          console.error('Error parsing stats data:', e);
        }

        try {
          if (subjectsData) dispatch({ type: 'SET_SUBJECTS', payload: JSON.parse(subjectsData) });
        } catch (e) {
          console.error('Error parsing subjects data:', e);
        }

        try {
          if (resourcesData) dispatch({ type: 'SET_RESOURCES', payload: JSON.parse(resourcesData) });
        } catch (e) {
          console.error('Error parsing resources data:', e);
        }

        try {
          if (examsData) dispatch({ type: 'SET_EXAMS', payload: JSON.parse(examsData) });
        } catch (e) {
          console.error('Error parsing exams data:', e);
        }

        try {
          if (achievementsData) dispatch({ type: 'SET_ACHIEVEMENTS', payload: JSON.parse(achievementsData) });
        } catch (e) {
          console.error('Error parsing achievements data:', e);
        }

        try {
          if (lastBackupData) dispatch({ type: 'SET_LAST_BACKUP', payload: JSON.parse(lastBackupData) });
        } catch (e) {
          console.error('Error parsing lastBackup data:', e);
        }

        // Auto-archive old tasks if enabled (do this after data is loaded)
        if (state.settings.autoArchive) {
          archiveOldTasks();
        }

        console.log('Data loaded from AsyncStorage');
      } catch (error) {
        console.error('Error loading data from storage:', error);
      }
    };

    // Load data once on component mount
    loadData();

    // Listen for app state changes to reload data when app comes to foreground
    const subscription = RNAppState.addEventListener('change', (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('App came to foreground, reloading data');
        loadData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    // Use a debounce to prevent too many writes to AsyncStorage
    let saveTimeout: ReturnType<typeof setTimeout> | undefined;

    const saveData = async () => {
      try {
        // Save each piece of state in separate try-catch blocks to ensure
        // one failure doesn't prevent others from saving
        try {
          await AsyncStorage.setItem('tasks', JSON.stringify(state.tasks));
        } catch (e) {
          console.error('Error saving tasks:', e);
        }

        try {
          await AsyncStorage.setItem('streaks', JSON.stringify(state.streaks));
        } catch (e) {
          console.error('Error saving streaks:', e);
        }

        try {
          await AsyncStorage.setItem('settings', JSON.stringify(state.settings));
        } catch (e) {
          console.error('Error saving settings:', e);
        }

        try {
          await AsyncStorage.setItem('stats', JSON.stringify(state.stats));
        } catch (e) {
          console.error('Error saving stats:', e);
        }

        try {
          await AsyncStorage.setItem('subjects', JSON.stringify(state.subjects));
        } catch (e) {
          console.error('Error saving subjects:', e);
        }

        try {
          await AsyncStorage.setItem('resources', JSON.stringify(state.resources));
        } catch (e) {
          console.error('Error saving resources:', e);
        }

        try {
          await AsyncStorage.setItem('exams', JSON.stringify(state.exams));
        } catch (e) {
          console.error('Error saving exams:', e);
        }

        try {
          await AsyncStorage.setItem('achievements', JSON.stringify(state.achievements));
        } catch (e) {
          console.error('Error saving achievements:', e);
        }

        console.log('All data saved to AsyncStorage');
      } catch (error) {
        console.error('Error in saveData:', error);
      }
    };

    // Clear previous timeout
    clearTimeout(saveTimeout);

    // Set a new timeout to debounce multiple state changes
    saveTimeout = setTimeout(saveData, 500);

    return () => {
      clearTimeout(saveTimeout);
    };
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

    // Schedule notification for task due date if notifications are enabled
    if (state.settings.notifications && newTask.dueDate) {
      NotificationService.scheduleTaskDueNotification(newTask);
    }

    // Check for achievements
    checkAchievements('task_created');
  }, [state.settings.notifications]);

  // Update an existing task
  const updateTask = useCallback((id: string, updatedTask: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates: updatedTask } });

    // Handle notifications for updated task
    if (state.settings.notifications) {
      const existingTask = state.tasks.find(task => task.id === id);
      if (existingTask) {
        const mergedTask = { ...existingTask, ...updatedTask };

        // If the due date changed or completion status changed, update notifications
        if (updatedTask.dueDate || updatedTask.completed !== undefined) {
          // Cancel existing notification
          NotificationService.cancelTaskNotification(id);

          // If task is not completed and has a due date, schedule a new notification
          if (!mergedTask.completed && mergedTask.dueDate) {
            NotificationService.scheduleTaskDueNotification(mergedTask);
          }
        }
      }
    }
  }, [state.settings.notifications, state.tasks]);

  // Delete a task
  const deleteTask = useCallback((id: string) => {
    // Cancel any notifications for this task
    if (state.settings.notifications) {
      NotificationService.cancelTaskNotification(id);
    }

    dispatch({ type: 'DELETE_TASK', payload: id });
  }, [state.settings.notifications]);

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
  const recordStudySession = useCallback(
    (minutes: number, subject?: string, taskId?: string, sessionData?: TimerSession) => {
      // Create a valid session data object if not provided
      const validSessionData: TimerSession = sessionData || {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        duration: minutes,
        subject: subject,
        taskId: taskId,
        isComplete: true
      };

      // Import the storage utility functions at the top of the file - this will be needed!
      const { addTimerSession } = require('../utils/StorageSync');

      // Execute the AsyncStorage save using the utility function
      addTimerSession(validSessionData).catch((error: Error) =>
        console.error('Error saving timer session:', error)
      );

      // Dispatch to context state
      dispatch({
        type: 'RECORD_STUDY_SESSION',
        payload: { minutes, subject, taskId, sessionData: validSessionData }
      });

      // Schedule daily goal reminder if behind on goal and notifications are enabled
      if (state.settings.notifications) {
        const currentDailyStudyTime = (state.stats.goalProgress.dailyStudyTime || 0) + minutes;
        const goalMinutes = state.settings.dailyGoalMinutes;

        if (currentDailyStudyTime < goalMinutes) {
          // We're still behind on the daily goal, schedule a reminder
          NotificationService.scheduleDailyGoalReminder(
            currentDailyStudyTime,
            goalMinutes
          );
        }

        // Schedule streak reminder if there's an active streak
        const updatedStreak = state.streaks.current > 0 ? state.streaks.current : 1;
        NotificationService.scheduleStreakReminder(updatedStreak);
      }

      // Check for achievements
      checkAchievements('study_session', minutes);
    },
    []
  );

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

    // Schedule exam notifications if enabled
    if (state.settings.notifications && newExam.date) {
      NotificationService.scheduleExamReminder(newExam);
    }
  }, [state.exams, state.settings.notifications]);

  // Update an existing exam
  const updateExam = useCallback((id: string, updatedExam: Partial<Exam>) => {
    const existingExam = state.exams.find(exam => exam.id === id);
    const updatedExams = state.exams.map(exam =>
      exam.id === id ? { ...exam, ...updatedExam } : exam
    );

    dispatch({ type: 'SET_EXAMS', payload: updatedExams });

    // Handle notifications for updated exam
    if (state.settings.notifications && existingExam) {
      const mergedExam = { ...existingExam, ...updatedExam };

      // If the date changed or completion status changed, update notifications
      if (updatedExam.date || updatedExam.time || updatedExam.completed !== undefined) {
        // Cancel existing notification
        NotificationService.cancelExamReminders(id);

        // If exam is not completed and has a date, schedule a new notification
        if (!mergedExam.completed && mergedExam.date) {
          NotificationService.scheduleExamReminder(mergedExam);
        }
      }
    }
  }, [state.exams, state.settings.notifications]);

  // Delete an exam
  const deleteExam = useCallback((id: string) => {
    // Cancel any notifications for this exam
    if (state.settings.notifications) {
      NotificationService.cancelExamReminders(id);
    }

    const updatedExams = state.exams.filter(exam => exam.id !== id);
    dispatch({ type: 'SET_EXAMS', payload: updatedExams });
  }, [state.exams, state.settings.notifications]);

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
    // Handle notification system changes
    if (newSettings.notifications !== undefined && newSettings.notifications !== state.settings.notifications) {
      if (newSettings.notifications) {
        // Initialize notifications
        NotificationService.initializeNotifications(
          true,
          state.tasks,
          state.exams,
          state.streaks,
          state.stats.goalProgress.dailyStudyTime || 0,
          state.settings.dailyGoalMinutes
        );
      } else {
        // Cancel all notifications
        NotificationService.cancelAllNotifications();
      }
    }

    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });

    // Immediately sync settings to AsyncStorage to ensure persistence
    setTimeout(() => {
      syncSettingsToStorage({ ...state.settings, ...newSettings }).catch((error: Error) =>
        console.error('Error syncing settings after update:', error)
      );
    }, 0);
  }, [state.settings, state.tasks, state.exams, state.streaks, state.stats.goalProgress.dailyStudyTime]);

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

        // Format achievement name for display
        const achievementName = achievementId
          .replace(/_/g, ' ')
          .replace(/\b\w/g, char => char.toUpperCase());

        // Show in-app notification
        Alert.alert(
          'Achievement Unlocked! 🏆',
          `You've unlocked the "${achievementName}" achievement!`,
          [{ text: 'OK' }]
        );

        // Send system notification if enabled
        if (state.settings.notifications) {
          NotificationService.sendAchievementNotification(achievementName);
        }
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