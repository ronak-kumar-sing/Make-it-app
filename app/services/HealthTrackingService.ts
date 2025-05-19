/**
 * HealthTrackingService.ts
 *
 * Central service for tracking health and wellness metrics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for health tracking
export interface ActivityEntry {
  id: string;
  date: string; // ISO string format
  steps: number;
  activeMinutes: number;
  workoutType?: string;
  workoutDuration?: number; // in minutes
  workoutIntensity?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface SleepEntry {
  id: string;
  date: string; // ISO string format
  bedTime: string; // HH:MM format
  wakeTime: string; // HH:MM format
  duration: number; // in minutes
  quality: 1 | 2 | 3 | 4 | 5; // 1-5 rating
  notes?: string;
}

export interface MoodEntry {
  id: string;
  date: string; // ISO string format
  time: string; // HH:MM format
  mood: 'terrible' | 'bad' | 'neutral' | 'good' | 'excellent'; // 1-5 rating
  stressLevel: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  studyRelated: boolean;
}

export interface NutritionEntry {
  id: string;
  date: string; // ISO string format
  time: string; // HH:MM format
  foodItems: {
    foodId: string;
    servings: number;
  }[];
  waterIntake: number; // in mL
  caffeine?: number; // in mg
  notes?: string;
}

export interface HealthSummary {
  activityAverageSteps: number;
  sleepAverageDuration: number;
  sleepAverageQuality: number;
  hydrationAverage: number;
  moodAverage: string;
  stressAverage: number;
}

export interface HealthInsight {
  type: 'activity' | 'sleep' | 'mood' | 'nutrition';
  title: string;
  description: string;
  actionable: string;
  priority: 'low' | 'medium' | 'high';
}

// Storage keys
const STORAGE_KEYS = {
  ACTIVITY: 'health_activity',
  SLEEP: 'health_sleep',
  MOOD: 'health_mood',
  NUTRITION: 'health_nutrition',
  GOALS: 'health_goals'
};

// Default goals
export interface HealthGoals {
  dailySteps: number;
  weeklyActiveMinutes: number;
  sleepHours: number;
  waterIntake: number; // in mL
}

const DEFAULT_GOALS: HealthGoals = {
  dailySteps: 7500,
  weeklyActiveMinutes: 150,
  sleepHours: 7.5,
  waterIntake: 2500
};

/**
 * Get user health goals or create default ones
 */
export const getHealthGoals = async (): Promise<HealthGoals> => {
  try {
    const goals = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    if (goals) {
      return JSON.parse(goals) as HealthGoals;
    }
    // If no goals exist, set the defaults
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(DEFAULT_GOALS));
    return DEFAULT_GOALS;
  } catch (error) {
    console.error('Error getting health goals:', error);
    return DEFAULT_GOALS;
  }
};

/**
 * Update health goals
 */
export const updateHealthGoals = async (goals: HealthGoals): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error('Error updating health goals:', error);
    return false;
  }
};

/**
 * Activity Tracking
 */
export const addActivityEntry = async (entry: ActivityEntry): Promise<boolean> => {
  try {
    // Generate an ID if not provided
    if (!entry.id) {
      entry.id = `activity_${Date.now()}`;
    }

    // Get existing entries
    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY);
    const activities: ActivityEntry[] = existingData ? JSON.parse(existingData) : [];

    // Add new entry
    activities.push(entry);

    // Save updated list
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activities));
    return true;
  } catch (error) {
    console.error('Error adding activity entry:', error);
    return false;
  }
};

export const getActivityEntries = async (startDate?: string, endDate?: string): Promise<ActivityEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY);
    let activities: ActivityEntry[] = data ? JSON.parse(data) : [];

    // Filter by date range if provided
    if (startDate || endDate) {
      activities = activities.filter(entry => {
        const entryDate = new Date(entry.date).getTime();
        const isAfterStart = startDate ? entryDate >= new Date(startDate).getTime() : true;
        const isBeforeEnd = endDate ? entryDate <= new Date(endDate).getTime() : true;
        return isAfterStart && isBeforeEnd;
      });
    }

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting activity entries:', error);
    return [];
  }
};

export const updateActivityEntry = async (updatedEntry: ActivityEntry): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY);
    let activities: ActivityEntry[] = data ? JSON.parse(data) : [];

    // Find and update the entry
    const index = activities.findIndex(entry => entry.id === updatedEntry.id);
    if (index !== -1) {
      activities[index] = updatedEntry;
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activities));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating activity entry:', error);
    return false;
  }
};

export const deleteActivityEntry = async (id: string): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY);
    let activities: ActivityEntry[] = data ? JSON.parse(data) : [];

    activities = activities.filter(entry => entry.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activities));
    return true;
  } catch (error) {
    console.error('Error deleting activity entry:', error);
    return false;
  }
};

/**
 * Sleep Tracking
 */
export const addSleepEntry = async (entry: SleepEntry): Promise<boolean> => {
  try {
    // Generate an ID if not provided
    if (!entry.id) {
      entry.id = `sleep_${Date.now()}`;
    }

    // Get existing entries
    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP);
    const sleepEntries: SleepEntry[] = existingData ? JSON.parse(existingData) : [];

    // Add new entry
    sleepEntries.push(entry);

    // Save updated list
    await AsyncStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(sleepEntries));
    return true;
  } catch (error) {
    console.error('Error adding sleep entry:', error);
    return false;
  }
};

export const getSleepEntries = async (startDate?: string, endDate?: string): Promise<SleepEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP);
    let sleepEntries: SleepEntry[] = data ? JSON.parse(data) : [];

    // Filter by date range if provided
    if (startDate || endDate) {
      sleepEntries = sleepEntries.filter(entry => {
        const entryDate = new Date(entry.date).getTime();
        const isAfterStart = startDate ? entryDate >= new Date(startDate).getTime() : true;
        const isBeforeEnd = endDate ? entryDate <= new Date(endDate).getTime() : true;
        return isAfterStart && isBeforeEnd;
      });
    }

    return sleepEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting sleep entries:', error);
    return [];
  }
};

export const updateSleepEntry = async (updatedEntry: SleepEntry): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP);
    let sleepEntries: SleepEntry[] = data ? JSON.parse(data) : [];

    // Find and update the entry
    const index = sleepEntries.findIndex(entry => entry.id === updatedEntry.id);
    if (index !== -1) {
      sleepEntries[index] = updatedEntry;
      await AsyncStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(sleepEntries));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating sleep entry:', error);
    return false;
  }
};

export const deleteSleepEntry = async (id: string): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP);
    let sleepEntries: SleepEntry[] = data ? JSON.parse(data) : [];

    sleepEntries = sleepEntries.filter(entry => entry.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(sleepEntries));
    return true;
  } catch (error) {
    console.error('Error deleting sleep entry:', error);
    return false;
  }
};

/**
 * Mood Tracking
 */
export const addMoodEntry = async (entry: MoodEntry): Promise<boolean> => {
  try {
    // Generate an ID if not provided
    if (!entry.id) {
      entry.id = `mood_${Date.now()}`;
    }

    // Get existing entries
    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.MOOD);
    const moodEntries: MoodEntry[] = existingData ? JSON.parse(existingData) : [];

    // Add new entry
    moodEntries.push(entry);

    // Save updated list
    await AsyncStorage.setItem(STORAGE_KEYS.MOOD, JSON.stringify(moodEntries));
    return true;
  } catch (error) {
    console.error('Error adding mood entry:', error);
    return false;
  }
};

export const getMoodEntries = async (startDate?: string, endDate?: string): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MOOD);
    let moodEntries: MoodEntry[] = data ? JSON.parse(data) : [];

    // Filter by date range if provided
    if (startDate || endDate) {
      moodEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.date).getTime();
        const isAfterStart = startDate ? entryDate >= new Date(startDate).getTime() : true;
        const isBeforeEnd = endDate ? entryDate <= new Date(endDate).getTime() : true;
        return isAfterStart && isBeforeEnd;
      });
    }

    return moodEntries.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting mood entries:', error);
    return [];
  }
};

export const getMoodEntriesByStudyRelation = async (studyRelated: boolean): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MOOD);
    const moodEntries: MoodEntry[] = data ? JSON.parse(data) : [];
    return moodEntries.filter(entry => entry.studyRelated === studyRelated);
  } catch (error) {
    console.error('Error getting mood entries by study relation:', error);
    return [];
  }
};

export const updateMoodEntry = async (updatedEntry: MoodEntry): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MOOD);
    let moodEntries: MoodEntry[] = data ? JSON.parse(data) : [];

    // Find and update the entry
    const index = moodEntries.findIndex(entry => entry.id === updatedEntry.id);
    if (index !== -1) {
      moodEntries[index] = updatedEntry;
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD, JSON.stringify(moodEntries));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating mood entry:', error);
    return false;
  }
};

export const deleteMoodEntry = async (id: string): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MOOD);
    let moodEntries: MoodEntry[] = data ? JSON.parse(data) : [];

    moodEntries = moodEntries.filter(entry => entry.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.MOOD, JSON.stringify(moodEntries));
    return true;
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    return false;
  }
};

/**
 * Nutrition Tracking
 */
export const addNutritionEntry = async (entry: NutritionEntry): Promise<boolean> => {
  try {
    // Generate an ID if not provided
    if (!entry.id) {
      entry.id = `nutrition_${Date.now()}`;
    }

    // Get existing entries
    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.NUTRITION);
    const nutritionEntries: NutritionEntry[] = existingData ? JSON.parse(existingData) : [];

    // Add new entry
    nutritionEntries.push(entry);

    // Save updated list
    await AsyncStorage.setItem(STORAGE_KEYS.NUTRITION, JSON.stringify(nutritionEntries));
    return true;
  } catch (error) {
    console.error('Error adding nutrition entry:', error);
    return false;
  }
};

export const getNutritionEntries = async (startDate?: string, endDate?: string): Promise<NutritionEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NUTRITION);
    let nutritionEntries: NutritionEntry[] = data ? JSON.parse(data) : [];

    // Filter by date range if provided
    if (startDate || endDate) {
      nutritionEntries = nutritionEntries.filter(entry => {
        const entryDate = new Date(entry.date).getTime();
        const isAfterStart = startDate ? entryDate >= new Date(startDate).getTime() : true;
        const isBeforeEnd = endDate ? entryDate <= new Date(endDate).getTime() : true;
        return isAfterStart && isBeforeEnd;
      });
    }

    return nutritionEntries.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting nutrition entries:', error);
    return [];
  }
};

export const updateNutritionEntry = async (updatedEntry: NutritionEntry): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NUTRITION);
    let nutritionEntries: NutritionEntry[] = data ? JSON.parse(data) : [];

    // Find and update the entry
    const index = nutritionEntries.findIndex(entry => entry.id === updatedEntry.id);
    if (index !== -1) {
      nutritionEntries[index] = updatedEntry;
      await AsyncStorage.setItem(STORAGE_KEYS.NUTRITION, JSON.stringify(nutritionEntries));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating nutrition entry:', error);
    return false;
  }
};

export const deleteNutritionEntry = async (id: string): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NUTRITION);
    let nutritionEntries: NutritionEntry[] = data ? JSON.parse(data) : [];

    nutritionEntries = nutritionEntries.filter(entry => entry.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.NUTRITION, JSON.stringify(nutritionEntries));
    return true;
  } catch (error) {
    console.error('Error deleting nutrition entry:', error);
    return false;
  }
};

/**
 * Health Analytics & Insights
 */
export const getWaterIntakeByDate = async (date: string): Promise<number> => {
  try {
    const entries = await getNutritionEntries(date, date);
    return entries.reduce((total, entry) => total + entry.waterIntake, 0);
  } catch (error) {
    console.error('Error calculating water intake:', error);
    return 0;
  }
};

export const getCaffeineIntakeByDate = async (date: string): Promise<number> => {
  try {
    const entries = await getNutritionEntries(date, date);
    return entries.reduce((total, entry) => total + (entry.caffeine || 0), 0);
  } catch (error) {
    console.error('Error calculating caffeine intake:', error);
    return 0;
  }
};

export const getWaterIntakeTrend = async (days: number): Promise<{ date: string, waterIntake: number }[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await getNutritionEntries(startDate.toISOString(), endDate.toISOString());

    // Group by date and sum water intake
    const waterByDate: Record<string, number> = {};
    entries.forEach(entry => {
      if (!waterByDate[entry.date]) {
        waterByDate[entry.date] = 0;
      }
      waterByDate[entry.date] += entry.waterIntake;
    });

    // Convert to array format
    const result = Object.keys(waterByDate).map(date => ({
      date,
      waterIntake: waterByDate[date]
    }));

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error calculating water intake trend:', error);
    return [];
  }
};

export const getStepsTrend = async (days: number): Promise<{ date: string, steps: number }[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await getActivityEntries(startDate.toISOString(), endDate.toISOString());

    // Group by date and sum steps
    const stepsByDate: Record<string, number> = {};
    entries.forEach(entry => {
      if (!stepsByDate[entry.date]) {
        stepsByDate[entry.date] = 0;
      }
      stepsByDate[entry.date] += entry.steps;
    });

    // Convert to array format
    const result = Object.keys(stepsByDate).map(date => ({
      date,
      steps: stepsByDate[date]
    }));

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error calculating steps trend:', error);
    return [];
  }
};

export const getSleepQualityTrend = async (days: number): Promise<{ date: string, quality: number }[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await getSleepEntries(startDate.toISOString(), endDate.toISOString());

    // Convert to array format
    const result = entries.map(entry => ({
      date: entry.date,
      quality: entry.quality
    }));

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error calculating sleep quality trend:', error);
    return [];
  }
};

export const getMoodTrend = async (days: number): Promise<{ date: string, mood: string, stressLevel: number }[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await getMoodEntries(startDate.toISOString(), endDate.toISOString());

    // Convert to array format, grouping by date and averaging
    const moodsByDate: Record<string, { moods: string[], stressLevels: number[] }> = {};
    entries.forEach(entry => {
      if (!moodsByDate[entry.date]) {
        moodsByDate[entry.date] = { moods: [], stressLevels: [] };
      }
      moodsByDate[entry.date].moods.push(entry.mood);
      moodsByDate[entry.date].stressLevels.push(entry.stressLevel);
    });

    // Find most common mood and average stress level
    const result = Object.keys(moodsByDate).map(date => {
      const moodCounts: Record<string, number> = {};
      moodsByDate[date].moods.forEach(mood => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });

      // Find most common mood
      let mostCommonMood = moodsByDate[date].moods[0];
      let highestCount = 0;

      Object.keys(moodCounts).forEach(mood => {
        if (moodCounts[mood] > highestCount) {
          highestCount = moodCounts[mood];
          mostCommonMood = mood;
        }
      });

      // Calculate average stress level
      const averageStress = moodsByDate[date].stressLevels.reduce((sum, level) => sum + level, 0) /
        moodsByDate[date].stressLevels.length;

      return {
        date,
        mood: mostCommonMood,
        stressLevel: Math.round(averageStress * 10) / 10
      };
    });

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error calculating mood trend:', error);
    return [];
  }
};

export const getHealthInsights = async (): Promise<HealthInsight[]> => {
  try {
    const insights: HealthInsight[] = [];
    const goals = await getHealthGoals();

    // Get recent data
    const recentActivities = await getActivityEntries(getDateString(-7), getDateString(0));
    const recentSleep = await getSleepEntries(getDateString(-7), getDateString(0));
    const recentMood = await getMoodEntries(getDateString(-7), getDateString(0));
    const recentNutrition = await getNutritionEntries(getDateString(-7), getDateString(0));

    // Activity insights
    const avgSteps = calculateAverageSteps(recentActivities);
    if (avgSteps < goals.dailySteps * 0.5) {
      insights.push({
        type: 'activity',
        title: 'Low physical activity detected',
        description: `Your average steps (${avgSteps.toFixed(0)}) are well below your goal of ${goals.dailySteps}.`,
        actionable: 'Try taking short walks between study sessions to boost your step count.',
        priority: 'high'
      });
    }

    // Sleep insights
    const avgSleepHours = calculateAverageSleepHours(recentSleep);
    if (avgSleepHours < goals.sleepHours - 1) {
      insights.push({
        type: 'sleep',
        title: 'Sleep deficiency detected',
        description: `You're averaging ${avgSleepHours.toFixed(1)} hours of sleep, below your target of ${goals.sleepHours} hours.`,
        actionable: 'Try to maintain a consistent sleep schedule, even on weekends.',
        priority: 'high'
      });
    }

    // Water intake insights
    const avgWaterIntake = calculateAverageWaterIntake(recentNutrition);
    if (avgWaterIntake < goals.waterIntake * 0.7) {
      insights.push({
        type: 'nutrition',
        title: 'Hydration needs improvement',
        description: `You're only consuming about ${Math.round(avgWaterIntake)}mL of water daily.`,
        actionable: 'Set water break reminders during your study sessions.',
        priority: 'medium'
      });
    }

    // Stress insights
    const avgStress = calculateAverageStressLevel(recentMood);
    if (avgStress > 3.5) {
      insights.push({
        type: 'mood',
        title: 'Elevated stress levels detected',
        description: 'Your stress levels have been high this week.',
        actionable: 'Consider adding mindfulness breaks between study sessions.',
        priority: 'medium'
      });
    }

    // Study-related mood insights
    const studyMoods = await getMoodEntriesByStudyRelation(true);
    if (studyMoods.length > 0 && calculateNegativeMoodPercentage(studyMoods) > 60) {
      insights.push({
        type: 'mood',
        title: 'Study sessions affecting mood',
        description: 'Your mood seems to decline during or after studying.',
        actionable: 'Try different study environments or techniques to improve your experience.',
        priority: 'medium'
      });
    }

    return insights;
  } catch (error) {
    console.error('Error generating health insights:', error);
    return [];
  }
};

export const getHealthSummary = async (days: number = 7): Promise<HealthSummary> => {
  try {
    const startDate = getDateString(-days);
    const endDate = getDateString(0);

    const activities = await getActivityEntries(startDate, endDate);
    const sleepEntries = await getSleepEntries(startDate, endDate);
    const moodEntries = await getMoodEntries(startDate, endDate);
    const nutritionEntries = await getNutritionEntries(startDate, endDate);

    const avgSteps = calculateAverageSteps(activities);
    const avgSleepDuration = calculateAverageSleepMinutes(sleepEntries);
    const avgSleepQuality = calculateAverageSleepQuality(sleepEntries);
    const avgHydration = calculateAverageWaterIntake(nutritionEntries);
    const moodData = calculateMoodSummary(moodEntries);
    const avgStress = calculateAverageStressLevel(moodEntries);

    return {
      activityAverageSteps: avgSteps,
      sleepAverageDuration: avgSleepDuration,
      sleepAverageQuality: avgSleepQuality,
      hydrationAverage: avgHydration,
      moodAverage: moodData,
      stressAverage: avgStress
    };
  } catch (error) {
    console.error('Error generating health summary:', error);
    return {
      activityAverageSteps: 0,
      sleepAverageDuration: 0,
      sleepAverageQuality: 0,
      hydrationAverage: 0,
      moodAverage: 'neutral',
      stressAverage: 0
    };
  }
};

// Helper functions
const getDateString = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

const calculateAverageSteps = (activities: ActivityEntry[]): number => {
  if (activities.length === 0) return 0;
  const totalSteps = activities.reduce((sum, activity) => sum + activity.steps, 0);
  return totalSteps / activities.length;
};

const calculateAverageSleepHours = (sleepEntries: SleepEntry[]): number => {
  if (sleepEntries.length === 0) return 0;
  const totalMinutes = sleepEntries.reduce((sum, entry) => sum + entry.duration, 0);
  return totalMinutes / 60 / sleepEntries.length;
};

const calculateAverageSleepMinutes = (sleepEntries: SleepEntry[]): number => {
  if (sleepEntries.length === 0) return 0;
  const totalMinutes = sleepEntries.reduce((sum, entry) => sum + entry.duration, 0);
  return totalMinutes / sleepEntries.length;
};

const calculateAverageSleepQuality = (sleepEntries: SleepEntry[]): number => {
  if (sleepEntries.length === 0) return 0;
  const totalQuality = sleepEntries.reduce((sum, entry) => sum + entry.quality, 0);
  return totalQuality / sleepEntries.length;
};

const calculateAverageWaterIntake = (nutritionEntries: NutritionEntry[]): number => {
  if (nutritionEntries.length === 0) return 0;

  // Group by date to get daily total
  const waterByDate: Record<string, number> = {};
  nutritionEntries.forEach(entry => {
    if (!waterByDate[entry.date]) {
      waterByDate[entry.date] = 0;
    }
    waterByDate[entry.date] += entry.waterIntake;
  });

  // Calculate average daily intake
  const dailyTotals = Object.values(waterByDate);
  return dailyTotals.reduce((sum, intake) => sum + intake, 0) / dailyTotals.length;
};

const calculateMoodSummary = (moodEntries: MoodEntry[]): string => {
  if (moodEntries.length === 0) return 'neutral';

  const moodCounts: Record<string, number> = {
    terrible: 0,
    bad: 0,
    neutral: 0,
    good: 0,
    excellent: 0
  };

  moodEntries.forEach(entry => {
    moodCounts[entry.mood]++;
  });

  // Find most common mood
  let mostCommonMood = 'neutral';
  let highestCount = 0;

  Object.keys(moodCounts).forEach(mood => {
    if (moodCounts[mood] > highestCount) {
      highestCount = moodCounts[mood];
      mostCommonMood = mood;
    }
  });

  return mostCommonMood;
};

const calculateAverageStressLevel = (moodEntries: MoodEntry[]): number => {
  if (moodEntries.length === 0) return 0;
  const totalStress = moodEntries.reduce((sum, entry) => sum + entry.stressLevel, 0);
  return totalStress / moodEntries.length;
};

const calculateNegativeMoodPercentage = (moodEntries: MoodEntry[]): number => {
  if (moodEntries.length === 0) return 0;

  const negativeCount = moodEntries.filter(entry =>
    entry.mood === 'terrible' || entry.mood === 'bad').length;

  return (negativeCount / moodEntries.length) * 100;
};