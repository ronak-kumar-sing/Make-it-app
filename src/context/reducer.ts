// ============================================
// Reducer for StudyBuddy App
// Handles all state mutations
// ============================================

import { format } from 'date-fns';
import { AppAction, AppState, StudySession, Task } from '../types';
import { initialState } from './initialState';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ==================== State Setters ====================
    case 'SET_STATE':
      return { ...state, ...action.payload };
      
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
      
    case 'SET_SUBJECTS':
      return { ...state, subjects: action.payload };
      
    case 'SET_SCHEDULE':
      return { ...state, schedule: action.payload };
      
    case 'SET_EXAMS':
      return { ...state, exams: action.payload };
      
    case 'SET_RESOURCES':
      return { ...state, resources: action.payload };
      
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
      
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };
      
    case 'SET_STREAKS':
      return { ...state, streaks: action.payload };
      
    case 'SET_STATS':
      return { ...state, stats: action.payload };
      
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };
      
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
      
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
      
    case 'SET_STUDY_SESSIONS':
      return { ...state, studySessions: action.payload };

    // ==================== Task Actions ====================
    case 'ADD_TASK': {
      const newTask: Task = {
        ...action.payload,
        createdAt: action.payload.createdAt || new Date().toISOString(),
        progress: action.payload.progress || 0,
        priority: action.payload.priority || 'medium',
      };
      return {
        ...state,
        tasks: [...state.tasks, newTask],
        stats: {
          ...state.stats,
          tasksCreated: state.stats.tasksCreated + 1,
        },
      };
    }
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, lastModified: new Date().toISOString() }
            : task
        ),
      };
      
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
      
    case 'TOGGLE_TASK_COMPLETION': {
      const now = new Date().toISOString();
      const taskToToggle = state.tasks.find(t => t.id === action.payload);
      const wasCompleted = taskToToggle?.completed || false;
      
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? {
                ...task,
                completed: !task.completed,
                completedAt: !task.completed ? now : undefined,
                progress: !task.completed ? 100 : task.progress,
                lastModified: now,
              }
            : task
        ),
        stats: {
          ...state.stats,
          tasksCompleted: wasCompleted
            ? state.stats.tasksCompleted - 1
            : state.stats.tasksCompleted + 1,
          weeklyTasksCompleted: wasCompleted
            ? state.stats.weeklyTasksCompleted - 1
            : state.stats.weeklyTasksCompleted + 1,
        },
      };
    }
    
    case 'ARCHIVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, archived: true, lastModified: new Date().toISOString() }
            : task
        ),
      };

    // ==================== Subject Actions ====================
    case 'ADD_SUBJECT':
      return {
        ...state,
        subjects: [...state.subjects, action.payload],
      };
      
    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map(subject =>
          subject.id === action.payload.id
            ? { ...subject, ...action.payload.updates }
            : subject
        ),
      };
      
    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter(s => s.id !== action.payload),
        // Also remove subject references from tasks, schedule, etc.
        tasks: state.tasks.map(task =>
          task.subjectId === action.payload ? { ...task, subjectId: undefined } : task
        ),
      };

    // ==================== Schedule Actions ====================
    case 'ADD_CLASS_SESSION':
      return {
        ...state,
        schedule: [...state.schedule, action.payload],
      };
      
    case 'UPDATE_CLASS_SESSION':
      return {
        ...state,
        schedule: state.schedule.map(session =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.updates }
            : session
        ),
      };
      
    case 'DELETE_CLASS_SESSION':
      return {
        ...state,
        schedule: state.schedule.filter(s => s.id !== action.payload),
      };

    // ==================== Exam Actions ====================
    case 'ADD_EXAM':
      return {
        ...state,
        exams: [...state.exams, action.payload],
      };
      
    case 'UPDATE_EXAM':
      return {
        ...state,
        exams: state.exams.map(exam =>
          exam.id === action.payload.id
            ? { ...exam, ...action.payload.updates }
            : exam
        ),
      };
      
    case 'DELETE_EXAM':
      return {
        ...state,
        exams: state.exams.filter(e => e.id !== action.payload),
      };

    // ==================== Expense Actions ====================
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.payload],
      };
      
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id
            ? { ...expense, ...action.payload.updates }
            : expense
        ),
      };
      
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload),
      };
      
    case 'SET_BUDGET': {
      const existingBudgetIndex = state.budgets.findIndex(
        b => b.category === action.payload.category && b.month === action.payload.month
      );
      if (existingBudgetIndex >= 0) {
        const newBudgets = [...state.budgets];
        newBudgets[existingBudgetIndex] = action.payload;
        return { ...state, budgets: newBudgets };
      }
      return { ...state, budgets: [...state.budgets, action.payload] };
    }

    // ==================== Study Session Actions ====================
    case 'RECORD_STUDY_SESSION': {
      const session = action.payload;
      const today = format(new Date(), 'yyyy-MM-dd');
      const hour = format(new Date(session.timestamp), 'HH');
      const dayOfWeek = format(new Date(session.timestamp), 'EEEE').toLowerCase() as any;
      
      // Update streaks
      const newStudyDays = { ...state.streaks.studyDays };
      newStudyDays[today] = (newStudyDays[today] || 0) + session.duration;
      
      let newCurrentStreak = state.streaks.current;
      if (state.streaks.lastStudyDate !== today) {
        // Check if yesterday was a study day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        
        if (state.streaks.lastStudyDate === yesterdayStr) {
          newCurrentStreak = state.streaks.current + 1;
        } else if (state.streaks.lastStudyDate !== today) {
          newCurrentStreak = 1;
        }
      }
      
      return {
        ...state,
        studySessions: [session, ...state.studySessions].slice(0, 100), // Keep last 100
        streaks: {
          ...state.streaks,
          current: newCurrentStreak,
          longest: Math.max(state.streaks.longest, newCurrentStreak),
          lastStudyDate: today,
          studyDays: newStudyDays,
        },
        stats: {
          ...state.stats,
          totalStudyTime: state.stats.totalStudyTime + session.duration,
          todayStudyTime: state.streaks.lastStudyDate === today 
            ? state.stats.todayStudyTime + session.duration 
            : session.duration,
          weeklyStudyTime: state.stats.weeklyStudyTime + session.duration,
          sessionsCompleted: state.stats.sessionsCompleted + 1,
          pomodoroCompleted: session.type === 'pomodoro' 
            ? state.stats.pomodoroCompleted + 1 
            : state.stats.pomodoroCompleted,
          productivityByHour: {
            ...state.stats.productivityByHour,
            [hour]: (state.stats.productivityByHour[hour] || 0) + session.duration,
          },
          productivityByDay: {
            ...state.stats.productivityByDay,
            [dayOfWeek]: (state.stats.productivityByDay[dayOfWeek] || 0) + session.duration,
          },
          subjectDistribution: session.subjectId ? {
            ...state.stats.subjectDistribution,
            [session.subjectId]: (state.stats.subjectDistribution[session.subjectId] || 0) + session.duration,
          } : state.stats.subjectDistribution,
          dailySessionCount: {
            ...state.stats.dailySessionCount,
            [today]: (state.stats.dailySessionCount[today] || 0) + 1,
          },
          recentSessions: [session, ...state.stats.recentSessions].slice(0, 20),
        },
      };
    }
    
    case 'UPDATE_STUDY_SESSION':
      return {
        ...state,
        studySessions: state.studySessions.map(session =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.updates }
            : session
        ),
      };

    // ==================== Goal Actions ====================
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload],
      };
      
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id
            ? { ...goal, ...action.payload.updates }
            : goal
        ),
      };
      
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
      };

    // ==================== Resource Actions ====================
    case 'ADD_RESOURCE':
      return {
        ...state,
        resources: [...state.resources, action.payload],
      };
      
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map(resource =>
          resource.id === action.payload.id
            ? { ...resource, ...action.payload.updates }
            : resource
        ),
      };
      
    case 'DELETE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter(r => r.id !== action.payload),
      };

    // ==================== Settings ====================
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    // ==================== Meta Actions ====================
    case 'SET_ONBOARDING_COMPLETE':
      return {
        ...state,
        onboardingComplete: action.payload,
      };
      
    case 'SET_LAST_BACKUP':
      return {
        ...state,
        lastBackup: action.payload,
      };
      
    case 'ARCHIVE_OLD_TASKS': {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - action.payload);
      
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.completed && task.completedAt && !task.archived) {
            const completedDate = new Date(task.completedAt);
            if (completedDate < cutoffDate) {
              return { ...task, archived: true };
            }
          }
          return task;
        }),
      };
    }
    
    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}
