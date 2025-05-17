import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, AppState } from 'react-native';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [streaks, setStreaks] = useState({
    current: 0,
    longest: 0,
    lastStudyDate: null,
    studyDays: {},
  });
  const [settings, setSettings] = useState({
    pomodoroLength: 25,
    shortBreakLength: 5,
    longBreakLength: 15,
    longBreakInterval: 4,
    dailyGoalMinutes: 120,
    theme: 'light',
    notifications: true,
    focusMode: false,
    autoArchive: true,
    archiveDays: 30,
    privacyLock: false,
  });
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    tasksCompleted: 0,
    sessionsCompleted: 0,
    subjectDistribution: {},
    productivityByHour: {},
    weeklyStudyTime: [0, 0, 0, 0, 0, 0, 0], // Sun-Sat
  });
  const [subjects, setSubjects] = useState([
    { id: '1', name: 'Math', color: '#FF5252' },
    { id: '2', name: 'Science', color: '#4CAF50' },
    { id: '3', name: 'History', color: '#FFC107' },
    { id: '4', name: 'English', color: '#2196F3' },
    { id: '5', name: 'Computer Science', color: '#9C27B0' },
    { id: '6', name: 'Other', color: '#607D8B' },
  ]);
  const [resources, setResources] = useState([]);
  const [exams, setExams] = useState([]);
  const [achievements, setAchievements] = useState({
    unlocked: [],
    progress: {}
  });
  const [appState, setAppState] = useState(AppState.currentState);
  const [lastBackup, setLastBackup] = useState(null);

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

        if (tasksData) setTasks(JSON.parse(tasksData));
        if (streaksData) setStreaks(JSON.parse(streaksData));
        if (settingsData) setSettings(JSON.parse(settingsData));
        if (statsData) setStats(JSON.parse(statsData));
        if (subjectsData) setSubjects(JSON.parse(subjectsData));
        if (resourcesData) setResources(JSON.parse(resourcesData));
        if (examsData) setExams(JSON.parse(examsData));
        if (achievementsData) setAchievements(JSON.parse(achievementsData));
        if (lastBackupData) setLastBackup(JSON.parse(lastBackupData));
        
        // Auto-archive old tasks if enabled
        if (settings.autoArchive) {
          archiveOldTasks();
        }
      } catch (error) {
        console.error('Error loading data from storage:', error);
      }
    };

    loadData();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        loadData();
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
        await AsyncStorage.setItem('streaks', JSON.stringify(streaks));
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
        await AsyncStorage.setItem('stats', JSON.stringify(stats));
        await AsyncStorage.setItem('subjects', JSON.stringify(subjects));
        await AsyncStorage.setItem('resources', JSON.stringify(resources));
        await AsyncStorage.setItem('exams', JSON.stringify(exams));
        await AsyncStorage.setItem('achievements', JSON.stringify(achievements));
      } catch (error) {
        console.error('Error saving data to storage:', error);
      }
    };

    saveData();
  }, [tasks, streaks, settings, stats, subjects, resources, exams, achievements]);

  // Archive old tasks
  const archiveOldTasks = () => {
    const now = new Date();
    const archiveThreshold = new Date();
    archiveThreshold.setDate(now.getDate() - settings.archiveDays);
    
    const activeAndArchivedTasks = tasks.map(task => {
      if (task.completed && new Date(task.completedAt) < archiveThreshold) {
        return { ...task, archived: true };
      }
      return task;
    });
    
    setTasks(activeAndArchivedTasks);
  };

  // Add a new task
  const addTask = (task) => {
    const newTask = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      archived: false,
      ...task,
    };
    setTasks([...tasks, newTask]);
    
    // Check for achievements
    checkAchievements('task_created');
  };

  // Update an existing task
  const updateTask = (id, updatedTask) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updatedTask } : task
    ));
  };

  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Toggle task completion
  const toggleTaskCompletion = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const isCompleting = !task.completed;
      updateTask(id, { 
        completed: isCompleting, 
        completedAt: isCompleting ? new Date().toISOString() : null 
      });
      
      if (isCompleting) {
        // Update stats
        setStats(prev => {
          const newStats = {
            ...prev,
            tasksCompleted: prev.tasksCompleted + 1
          };
          
          // Update subject distribution
          if (task.subject) {
            const subjectDistribution = { ...prev.subjectDistribution };
            subjectDistribution[task.subject] = (subjectDistribution[task.subject] || 0) + 1;
            newStats.subjectDistribution = subjectDistribution;
          }
          
          return newStats;
        });
        
        // Check for achievements
        checkAchievements('task_completed');
      } else {
        setStats(prev => {
          const newStats = {
            ...prev,
            tasksCompleted: Math.max(0, prev.tasksCompleted - 1)
          };
          
          // Update subject distribution
          if (task.subject) {
            const subjectDistribution = { ...prev.subjectDistribution };
            subjectDistribution[task.subject] = Math.max(0, (subjectDistribution[task.subject] || 0) - 1);
            newStats.subjectDistribution = subjectDistribution;
          }
          
          return newStats;
        });
      }
    }
  };

  // Record study session
  const recordStudySession = (minutes, subject = null) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hourOfDay = now.getHours();
    
    // Update stats
    setStats(prev => {
      // Update productivity by hour
      const productivityByHour = { ...prev.productivityByHour };
      productivityByHour[hourOfDay] = (productivityByHour[hourOfDay] || 0) + minutes;
      
      // Update weekly study time
      const weeklyStudyTime = [...prev.weeklyStudyTime];
      weeklyStudyTime[dayOfWeek] += minutes;
      
      // Update subject distribution if subject is provided
      const subjectDistribution = { ...prev.subjectDistribution };
      if (subject) {
        subjectDistribution[subject] = (subjectDistribution[subject] || 0) + minutes;
      }
      
      return {
        ...prev,
        totalStudyTime: prev.totalStudyTime + minutes,
        sessionsCompleted: prev.sessionsCompleted + 1,
        productivityByHour,
        weeklyStudyTime,
        subjectDistribution
      };
    });
    
    // Update streaks
    setStreaks(prev => {
      const studyDays = { ...prev.studyDays };
      studyDays[today] = (studyDays[today] || 0) + minutes;
      
      let current = prev.current;
      const lastDate = prev.lastStudyDate ? new Date(prev.lastStudyDate) : null;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if streak continues
      if (!lastDate || 
          format(lastDate, 'yyyy-MM-dd') === today || 
          format(lastDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        current += 1;
      } else {
        current = 1; // Reset streak
      }
      
      return {
        ...prev,
        current,
        longest: Math.max(current, prev.longest),
        lastStudyDate: new Date().toISOString(),
        studyDays
      };
    });
    
    // Check for achievements
    checkAchievements('session_completed', minutes);
  };

  // Add a new exam or assignment
  const addExam = (exam) => {
    const newExam = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
      ...exam,
    };
    setExams([...exams, newExam]);
  };

  // Update an existing exam
  const updateExam = (id, updatedExam) => {
    setExams(exams.map(exam => 
      exam.id === id ? { ...exam, ...updatedExam } : exam
    ));
  };

  // Delete an exam
  const deleteExam = (id) => {
    setExams(exams.filter(exam => exam.id !== id));
  };

  // Add a new study resource
  const addResource = (resource) => {
    const newResource = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...resource,
    };
    setResources([...resources, newResource]);
  };

  // Update an existing resource
  const updateResource = (id, updatedResource) => {
    setResources(resources.map(resource => 
      resource.id === id ? { ...resource, ...updatedResource } : resource
    ));
  };

  // Delete a resource
  const deleteResource = (id) => {
    setResources(resources.filter(resource => resource.id !== id));
  };

  // Add a new subject
  const addSubject = (subject) => {
    const newSubject = {
      id: Date.now().toString(),
      ...subject,
    };
    setSubjects([...subjects, newSubject]);
  };

  // Update an existing subject
  const updateSubject = (id, updatedSubject) => {
    setSubjects(subjects.map(subject => 
      subject.id === id ? { ...subject, ...updatedSubject } : subject
    ));
  };

  // Delete a subject
  const deleteSubject = (id) => {
    setSubjects(subjects.filter(subject => subject.id !== id));
  };

  // Update settings
  const updateSettings = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
  };

  // Check and update achievements
  const checkAchievements = (action, value = null) => {
    const newAchievements = { ...achievements };
    
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
    Object.keys(achievementCriteria).forEach(achievementId => {
      const criteria = achievementCriteria[achievementId];
      
      // Skip if already unlocked
      if (newAchievements.unlocked.includes(achievementId)) {
        return;
      }
      
      // Check if achievement should be unlocked
      let shouldUnlock = false;
      let progress = 0;
      
      switch (criteria.type) {
        case 'streak':
          if (action === 'session_completed') {
            progress = streaks.current;
            shouldUnlock = streaks.current >= criteria.threshold;
          }
          break;
        case 'study_time':
          progress = stats.totalStudyTime;
          shouldUnlock = stats.totalStudyTime >= criteria.threshold;
          break;
        case 'tasks_completed':
          if (action === 'task_completed') {
            progress = stats.tasksCompleted;
            shouldUnlock = stats.tasksCompleted >= criteria.threshold;
          }
          break;
        case 'sessions_completed':
          if (action === 'session_completed') {
            progress = stats.sessionsCompleted;
            shouldUnlock = stats.sessionsCompleted >= criteria.threshold;
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
    
    setAchievements(newAchievements);
  };

  // Export data as a backup file
  const exportData = async () => {
    try {
      const data = {
        tasks,
        streaks,
        settings,
        stats,
        subjects,
        resources,
        exams,
        achievements,
        exportDate: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(data);
      const fileUri = `${FileSystem.documentDirectory}studystreak_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        
        // Update last backup date
        const backupDate = new Date().toISOString();
        setLastBackup(backupDate);
        await AsyncStorage.setItem('lastBackup', JSON.stringify(backupDate));
        
        return true;
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
        return false;
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Failed', 'There was an error exporting your data.');
      return false;
    }
  };

  // Import data from a backup file
  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        const fileContents = await FileSystem.readAsStringAsync(result.uri);
        const data = JSON.parse(fileContents);
        
        // Validate the data structure
        if (!data.tasks || !data.settings || !data.streaks || !data.stats) {
          Alert.alert('Invalid Backup', 'The selected file is not a valid StudyStreak backup.');
          return false;
        }
        
        // Confirm import
        Alert.alert(
          'Import Data',
          'This will replace all your current data. Are you sure you want to continue?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {}
            },
            {
              text: 'Import',
              onPress: async () => {
                // Import the data
                setTasks(data.tasks || []);
                setStreaks(data.streaks || { current: 0, longest: 0, lastStudyDate: null, studyDays: {} });
                setSettings(data.settings || {});
                setStats(data.stats || { totalStudyTime: 0, tasksCompleted: 0, sessionsCompleted: 0 });
                setSubjects(data.subjects || []);
                setResources(data.resources || []);
                setExams(data.exams || []);
                setAchievements(data.achievements || { unlocked: [], progress: {} });
                
                // Save to AsyncStorage
                await AsyncStorage.setItem('tasks', JSON.stringify(data.tasks));
                await AsyncStorage.setItem('streaks', JSON.stringify(data.streaks));
                await AsyncStorage.setItem('settings', JSON.stringify(data.settings));
                await AsyncStorage.setItem('stats', JSON.stringify(data.stats));
                await AsyncStorage.setItem('subjects', JSON.stringify(data.subjects));
                await AsyncStorage.setItem('resources', JSON.stringify(data.resources));
                await AsyncStorage.setItem('exams', JSON.stringify(data.exams));
                await AsyncStorage.setItem('achievements', JSON.stringify(data.achievements));
                
                Alert.alert('Import Successful', 'Your data has been restored from the backup.');
              }
            }
          ]
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error importing data:', error);
      Alert.alert('Import Failed', 'There was an error importing your data.');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        streaks,
        settings,
        stats,
        subjects,
        resources,
        exams,
        achievements,
        lastBackup,
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
        archiveOldTasks
      }}
    >
      {children}
    </AppContext.Provider>
  );
};