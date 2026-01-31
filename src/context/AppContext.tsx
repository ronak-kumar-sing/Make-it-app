// ============================================
// Main App Context for StudyBuddy
// Provides global state management
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import { AppState as RNAppState } from 'react-native';
import {
    AppAction,
    AppState,
    ClassSession,
    Exam,
    Expense,
    Goal,
    Resource,
    Settings,
    StudySession,
    Subject,
    Task,
} from '../types';
import { initialState } from './initialState';
import { appReducer } from './reducer';

// Storage key
const STORAGE_KEY = '@studybuddy_state';

// Context type
interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  
  // Task helpers
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  completeTask: (id: string) => void;
  
  // Subject helpers
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  
  // Schedule helpers
  addClassSession: (session: Omit<ClassSession, 'id'>) => void;
  updateClassSession: (id: string, updates: Partial<ClassSession>) => void;
  deleteClassSession: (id: string) => void;
  
  // Exam helpers
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  
  // Expense helpers
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // Resource helpers
  addResource: (resource: Omit<Resource, 'id' | 'createdAt'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  
  // Goal helpers
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  
  // Study session helpers
  recordStudySession: (session: Omit<StudySession, 'id'>) => void;
  
  // Settings helpers
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Meta helpers
  completeOnboarding: () => void;
  
  // Utility helpers
  getSubjectById: (id: string) => Subject | undefined;
  getTasksBySubject: (subjectId: string) => Task[];
  getTodaysTasks: () => Task[];
  getUpcomingExams: (days?: number) => Exam[];
  getDailyStudyProgress: () => number;
  getWeeklyTaskProgress: () => number;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedState = JSON.parse(stored);
          // Merge with initial state to ensure all keys exist
          dispatch({
            type: 'SET_STATE',
            payload: { ...initialState, ...parsedState },
          });
        }
      } catch (error) {
        console.error('Failed to load app data:', error);
      }
    };
    loadData();
  }, []);

  // Save data to storage when state changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save app data:', error);
      }
    };

    // Debounce saves
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [state]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = RNAppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // Refresh data when app comes to foreground
      }
    });

    return () => subscription?.remove();
  }, []);

  // ==================== Task Helpers ====================
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
      completed: false,
      archived: false,
      progress: task.progress || 0,
      priority: task.priority || 'medium',
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  }, []);

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  }, []);

  const toggleTaskCompletion = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: id });
  }, []);

  const completeTask = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: id });
  }, []);

  // ==================== Subject Helpers ====================
  const addSubject = useCallback((subject: Omit<Subject, 'id'>) => {
    dispatch({
      type: 'ADD_SUBJECT',
      payload: { ...subject, id: generateId() },
    });
  }, []);

  const updateSubject = useCallback((id: string, updates: Partial<Subject>) => {
    dispatch({ type: 'UPDATE_SUBJECT', payload: { id, updates } });
  }, []);

  const deleteSubject = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SUBJECT', payload: id });
  }, []);

  // ==================== Schedule Helpers ====================
  const addClassSession = useCallback((session: Omit<ClassSession, 'id'>) => {
    dispatch({
      type: 'ADD_CLASS_SESSION',
      payload: { ...session, id: generateId() },
    });
  }, []);

  const updateClassSession = useCallback((id: string, updates: Partial<ClassSession>) => {
    dispatch({ type: 'UPDATE_CLASS_SESSION', payload: { id, updates } });
  }, []);

  const deleteClassSession = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CLASS_SESSION', payload: id });
  }, []);

  // ==================== Exam Helpers ====================
  const addExam = useCallback((exam: Omit<Exam, 'id' | 'createdAt'>) => {
    dispatch({
      type: 'ADD_EXAM',
      payload: {
        ...exam,
        id: generateId(),
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const updateExam = useCallback((id: string, updates: Partial<Exam>) => {
    dispatch({ type: 'UPDATE_EXAM', payload: { id, updates } });
  }, []);

  const deleteExam = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EXAM', payload: id });
  }, []);

  // ==================== Expense Helpers ====================
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    dispatch({
      type: 'ADD_EXPENSE',
      payload: {
        ...expense,
        id: generateId(),
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: { id, updates } });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
  }, []);

  // ==================== Resource Helpers ====================
  const addResource = useCallback((resource: Omit<Resource, 'id' | 'createdAt'>) => {
    dispatch({
      type: 'ADD_RESOURCE',
      payload: {
        ...resource,
        id: generateId(),
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const updateResource = useCallback((id: string, updates: Partial<Resource>) => {
    dispatch({ type: 'UPDATE_RESOURCE', payload: { id, updates } });
  }, []);

  const deleteResource = useCallback((id: string) => {
    dispatch({ type: 'DELETE_RESOURCE', payload: id });
  }, []);

  // ==================== Goal Helpers ====================
  const addGoal = useCallback((goal: Omit<Goal, 'id'>) => {
    dispatch({
      type: 'ADD_GOAL',
      payload: { ...goal, id: generateId() },
    });
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    dispatch({ type: 'UPDATE_GOAL', payload: { id, updates } });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: id });
  }, []);

  // ==================== Study Session Helpers ====================
  const recordStudySession = useCallback((session: Omit<StudySession, 'id'>) => {
    dispatch({
      type: 'RECORD_STUDY_SESSION',
      payload: { ...session, id: generateId() },
    });
  }, []);

  // ==================== Settings Helpers ====================
  const updateSettings = useCallback((settings: Partial<Settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  // ==================== Meta Helpers ====================
  const completeOnboarding = useCallback(() => {
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
  }, []);

  // ==================== Utility Helpers ====================
  const getSubjectById = useCallback(
    (id: string) => state.subjects.find((s) => s.id === id),
    [state.subjects]
  );

  const getTasksBySubject = useCallback(
    (subjectId: string) => state.tasks.filter((t) => t.subjectId === subjectId),
    [state.tasks]
  );

  const getTodaysTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return state.tasks.filter((task) => {
      if (!task.dueDate || task.archived) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow && !task.completed;
    });
  }, [state.tasks]);

  const getUpcomingExams = useCallback(
    (days = 7) => {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);

      return state.exams
        .filter((exam) => {
          const examDate = new Date(exam.date);
          return examDate >= now && examDate <= future && !exam.completed;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    [state.exams]
  );

  const getDailyStudyProgress = useCallback(() => {
    if (state.settings.dailyGoalMinutes === 0) return 0;
    return Math.min(
      (state.stats.todayStudyTime / state.settings.dailyGoalMinutes) * 100,
      100
    );
  }, [state.stats.todayStudyTime, state.settings.dailyGoalMinutes]);

  const getWeeklyTaskProgress = useCallback(() => {
    if (state.settings.weeklyTaskGoal === 0) return 0;
    return Math.min(
      (state.stats.weeklyTasksCompleted / state.settings.weeklyTaskGoal) * 100,
      100
    );
  }, [state.stats.weeklyTasksCompleted, state.settings.weeklyTaskGoal]);

  // Memoized context value
  const value = useMemo<AppContextType>(
    () => ({
      ...state,
      dispatch,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      completeTask,
      addSubject,
      updateSubject,
      deleteSubject,
      addClassSession,
      updateClassSession,
      deleteClassSession,
      addExam,
      updateExam,
      deleteExam,
      addExpense,
      updateExpense,
      deleteExpense,
      addResource,
      updateResource,
      deleteResource,
      addGoal,
      updateGoal,
      deleteGoal,
      recordStudySession,
      updateSettings,
      completeOnboarding,
      getSubjectById,
      getTasksBySubject,
      getTodaysTasks,
      getUpcomingExams,
      getDailyStudyProgress,
      getWeeklyTaskProgress,
    }),
    [
      state,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      completeTask,
      addSubject,
      updateSubject,
      deleteSubject,
      addClassSession,
      updateClassSession,
      deleteClassSession,
      addExam,
      updateExam,
      deleteExam,
      addExpense,
      updateExpense,
      deleteExpense,
      addResource,
      updateResource,
      deleteResource,
      addGoal,
      updateGoal,
      deleteGoal,
      recordStudySession,
      updateSettings,
      completeOnboarding,
      getSubjectById,
      getTasksBySubject,
      getTodaysTasks,
      getUpcomingExams,
      getDailyStudyProgress,
      getWeeklyTaskProgress,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Export context for direct access if needed
export { AppContext };
