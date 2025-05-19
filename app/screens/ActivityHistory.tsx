/**
 * ActivityHistory.tsx
 *
 * Screen to display comprehensive history of health tracking data
 * with separate tabs for Activity, Sleep, Mood, and Nutrition data
 */

import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import * as CorrelationService from '../services/CorrelationService';
import * as HealthTrackingService from '../services/HealthTrackingService';

// Screen dimensions
const screenWidth = Dimensions.get('window').width - 32; // Account for padding

const tabs = ['Activity', 'Sleep', 'Mood', 'Nutrition', 'Insights'];

// Define navigation types
type RootStackParamList = {
  ActivityHistory: { tab?: string };
  ActivityTracker: undefined;
  SleepTracker: undefined;
  MoodTracker: undefined;
  NutritionTracker: undefined;
  HealthDashboardScreen: undefined;
};

type ActivityHistoryRouteProp = RouteProp<RootStackParamList, 'ActivityHistory'>;
type ActivityHistoryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ActivityHistory'>;

interface ActivityHistoryProps {
  route: ActivityHistoryRouteProp;
  navigation: ActivityHistoryNavigationProp;
}

export default function ActivityHistory({ route, navigation }: ActivityHistoryProps) {
  const { theme } = useTheme();
  const { stats } = useContext(AppContext);
  const initialTab = route.params?.tab || 'Activity';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Filter states
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [loading, setLoading] = useState(true);

  // Data states
  const [activityData, setActivityData] = useState<HealthTrackingService.ActivityEntry[]>([]);
  const [sleepData, setSleepData] = useState<HealthTrackingService.SleepEntry[]>([]);
  const [moodData, setMoodData] = useState<HealthTrackingService.MoodEntry[]>([]);
  const [nutritionData, setNutritionData] = useState<HealthTrackingService.NutritionEntry[]>([]);

  // Correlation states
  const [correlations, setCorrelations] = useState<CorrelationService.CorrelationResult[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Load data in parallel
    try {
      const [activities, sleep, moods, nutrition] = await Promise.all([
        HealthTrackingService.getActivityEntries(startDateStr, endDateStr),
        HealthTrackingService.getSleepEntries(startDateStr, endDateStr),
        HealthTrackingService.getMoodEntries(startDateStr, endDateStr),
        HealthTrackingService.getNutritionEntries(startDateStr, endDateStr)
      ]);

      setActivityData(activities);
      setSleepData(sleep);
      setMoodData(moods);
      setNutritionData(nutrition);

      // If insights tab is active, load correlations
      if (activeTab === 'Insights') {
        loadCorrelations(startDateStr, endDateStr);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCorrelations = async (startDate: string, endDate: string) => {
    setLoadingInsights(true);

    try {
      // Create empty study metrics array for now
      // In a real implementation, we would extract daily study data from stats
      const studyMetrics: CorrelationService.StudyMetric[] = [];

      // Sample data for development purposes
      // This would normally come from the stats.dailyStats object
      const sampleDates = [];
      const currentDate = new Date(startDate);
      const endDateTime = new Date(endDate);

      while (currentDate <= endDateTime) {
        sampleDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate sample study metrics
      sampleDates.forEach(date => {
        studyMetrics.push({
          date,
          studyMinutes: Math.floor(Math.random() * 180) + 30, // 30-210 min
          focusPercentage: Math.floor(Math.random() * 40) + 60, // 60-100%
          tasksCompleted: Math.floor(Math.random() * 5) + 1, // 1-5 tasks
          studyEfficiency: Math.floor(Math.random() * 50) + 50 // 50-100%
        });
      });

      if (studyMetrics.length > 3) {
        const correlationResults = await CorrelationService.getAllCorrelations(
          studyMetrics,
          startDate,
          endDate
        );

        setCorrelations(correlationResults);

        // Generate recommendations based on correlations
        const healthRecommendations = CorrelationService.getHealthRecommendations(correlationResults);
        setRecommendations(healthRecommendations);
      } else {
        setCorrelations([]);
        setRecommendations([
          'We need more data to provide accurate insights. Please continue tracking both your health metrics and study sessions.',
          'Try to log at least 5 days of health and study data to see personalized correlations.'
        ]);
      }
    } catch (error) {
      console.error('Error loading correlations:', error);
      setCorrelations([]);
      setRecommendations([
        'There was an error analyzing your health and study data.',
        'Please try again later or contact support if the issue persists.'
      ]);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'Insights' && correlations.length === 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365));
      loadCorrelations(startDate.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
    }
  };

  const renderActivityHistory = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (activityData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="walk-outline" size={60} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No activity data available</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('ActivityTracker')}
          >
            <Text style={styles.addButtonText}>Track Activity</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        {activityData.map((activity, index) => (
          <View key={index} style={[styles.historyItem, { backgroundColor: theme.card }]}>
            <View style={styles.historyItemHeader}>
              <Text style={[styles.historyItemDate, { color: theme.text }]}>
                {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <View style={styles.historyItemBadges}>
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="footsteps" size={12} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary }]}>{activity.steps}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="time-outline" size={12} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary }]}>{activity.activeMinutes} min</Text>
                </View>
              </View>
            </View>

            {activity.workoutType && (
              <View style={styles.workoutInfo}>
                <Ionicons name="fitness-outline" size={16} color={theme.primary} />
                <Text style={[styles.workoutText, { color: theme.text }]}>
                  {activity.workoutType} ({activity.workoutDuration} min, {activity.workoutIntensity} intensity)
                </Text>
              </View>
            )}

            {activity.notes && (
              <Text style={[styles.notesText, { color: theme.textSecondary }]}>{activity.notes}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderSleepHistory = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (sleepData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="moon-outline" size={60} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No sleep data available</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('SleepTracker')}
          >
            <Text style={styles.addButtonText}>Track Sleep</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        {sleepData.map((sleep, index) => (
          <View key={index} style={[styles.historyItem, { backgroundColor: theme.card }]}>
            <View style={styles.historyItemHeader}>
              <Text style={[styles.historyItemDate, { color: theme.text }]}>
                {new Date(sleep.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <View style={styles.historyItemBadges}>
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="time-outline" size={12} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary }]}>
                    {Math.floor(sleep.duration / 60)}h {sleep.duration % 60}m
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="star-outline" size={12} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary }]}>Quality: {sleep.quality}/5</Text>
                </View>
              </View>
            </View>

            <View style={styles.sleepTimesContainer}>
              <View style={styles.sleepTimeItem}>
                <Ionicons name="bed-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.sleepTimeText, { color: theme.textSecondary }]}>Bedtime: {sleep.bedTime}</Text>
              </View>
              <View style={styles.sleepTimeItem}>
                <Ionicons name="sunny-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.sleepTimeText, { color: theme.textSecondary }]}>Wake: {sleep.wakeTime}</Text>
              </View>
            </View>

            {sleep.notes && (
              <Text style={[styles.notesText, { color: theme.textSecondary }]}>{sleep.notes}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderMoodHistory = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (moodData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="happy-outline" size={60} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No mood data available</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('MoodTracker')}
          >
            <Text style={styles.addButtonText}>Track Mood</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const getMoodIcon = (mood: string): any => {
      switch (mood) {
        case 'terrible': return 'sad-outline';
        case 'bad': return 'sad-outline';
        case 'neutral': return 'happy-outline';
        case 'good': return 'happy-outline';
        case 'excellent': return 'heart-outline';
        default: return 'happy-outline';
      }
    };

    return (
      <View style={styles.historyContainer}>
        {moodData.map((mood, index) => (
          <View key={index} style={[styles.historyItem, { backgroundColor: theme.card }]}>
            <View style={styles.historyItemHeader}>
              <View style={styles.moodDateTimeContainer}>
                <Text style={[styles.historyItemDate, { color: theme.text }]}>
                  {new Date(mood.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.moodTime, { color: theme.textSecondary }]}>at {mood.time}</Text>
              </View>
              <View style={styles.historyItemBadges}>
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name={getMoodIcon(mood.mood)} size={12} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary }]}>
                    {mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="pulse-outline" size={12} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary }]}>Stress: {mood.stressLevel}/5</Text>
                </View>
              </View>
            </View>

            {mood.studyRelated && (
              <View style={styles.studyRelatedBadge}>
                <Ionicons name="school-outline" size={14} color={theme.primary} />
                <Text style={[styles.studyRelatedText, { color: theme.primary }]}>Study Related</Text>
              </View>
            )}

            {mood.notes && (
              <Text style={[styles.notesText, { color: theme.textSecondary }]}>{mood.notes}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderNutritionHistory = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (nutritionData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="nutrition-outline" size={60} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No nutrition data available</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('NutritionTracker')}
          >
            <Text style={styles.addButtonText}>Track Nutrition</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        {nutritionData.map((nutrition, index) => (
          <View key={index} style={[styles.historyItem, { backgroundColor: theme.card }]}>
            <View style={styles.historyItemHeader}>
              <View style={styles.moodDateTimeContainer}>
                <Text style={[styles.historyItemDate, { color: theme.text }]}>
                  {new Date(nutrition.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.moodTime, { color: theme.textSecondary }]}>at {nutrition.time}</Text>
              </View>
            </View>

            <View style={styles.waterContainer}>
              <Ionicons name="water-outline" size={16} color={theme.primary} />
              <Text style={[styles.waterText, { color: theme.text }]}>
                {nutrition.waterIntake} mL water
              </Text>
            </View>

            {nutrition.foodItems && nutrition.foodItems.length > 0 && (
              <View style={styles.foodItems}>
                <Text style={[styles.foodItemsTitle, { color: theme.text }]}>Food Items:</Text>
                <Text style={[styles.foodItemsList, { color: theme.textSecondary }]}>
                  {nutrition.foodItems.map(item => `${item.servings} × ${item.foodId}`).join(', ')}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCorrelationInsights = () => {
    if (loadingInsights) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Analyzing your health and study data...</Text>
        </View>
      );
    }

    return (
      <View style={styles.insightsContainer}>
        <View style={[styles.insightsCard, { backgroundColor: theme.card }]}>
          <View style={styles.insightsCardHeader}>
            <Ionicons name="analytics-outline" size={22} color={theme.primary} />
            <Text style={[styles.insightsTitle, { color: theme.text }]}>Health & Study Correlations</Text>
          </View>

          {correlations.length > 0 ? (
            correlations.map((correlation, index) => (
              <View key={index} style={styles.correlationItem}>
                <View style={styles.correlationHeader}>
                  <Text style={[styles.correlationMetric, { color: theme.text }]}>
                    {correlation.metric.charAt(0).toUpperCase() + correlation.metric.slice(1)}
                  </Text>
                  <View style={[
                    styles.significanceBadge,
                    {
                      backgroundColor:
                        correlation.significance === 'high' ? theme.success + '40' :
                          correlation.significance === 'medium' ? theme.warning + '40' :
                            theme.border + '40'
                    }
                  ]}>
                    <Text style={[
                      styles.significanceText,
                      {
                        color:
                          correlation.significance === 'high' ? theme.success :
                            correlation.significance === 'medium' ? theme.warning :
                              theme.textSecondary
                      }
                    ]}>
                      {correlation.significance.charAt(0).toUpperCase() + correlation.significance.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.correlationDescription, { color: theme.textSecondary }]}>
                  {correlation.description}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              Not enough data to analyze correlations yet. Track both health metrics and study sessions regularly to see insights.
            </Text>
          )}
        </View>

        <View style={[styles.insightsCard, { backgroundColor: theme.card }]}>
          <View style={styles.insightsCardHeader}>
            <Ionicons name="bulb-outline" size={22} color={theme.primary} />
            <Text style={[styles.insightsTitle, { color: theme.text }]}>Personalized Recommendations</Text>
          </View>

          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={18} color={theme.primary} style={styles.recommendationIcon} />
              <Text style={[styles.recommendationText, { color: theme.text }]}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Activity':
        return renderActivityHistory();
      case 'Sleep':
        return renderSleepHistory();
      case 'Mood':
        return renderMoodHistory();
      case 'Nutrition':
        return renderNutritionHistory();
      case 'Insights':
        return renderCorrelationInsights();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Health History</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && [styles.activeTab, { borderColor: theme.primary }]
            ]}
            onPress={() => handleTabChange(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.primary : theme.textSecondary }
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.filterContainer}>
        <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Time Range:</Text>
        <View style={styles.filterOptions}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              timeRange === 'week' && [styles.activeFilterOption, { backgroundColor: theme.primaryLight }]
            ]}
            onPress={() => setTimeRange('week')}
          >
            <Text
              style={[
                styles.filterOptionText,
                { color: timeRange === 'week' ? theme.primary : theme.textSecondary }
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              timeRange === 'month' && [styles.activeFilterOption, { backgroundColor: theme.primaryLight }]
            ]}
            onPress={() => setTimeRange('month')}
          >
            <Text
              style={[
                styles.filterOptionText,
                { color: timeRange === 'month' ? theme.primary : theme.textSecondary }
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterOption,
              timeRange === 'year' && [styles.activeFilterOption, { backgroundColor: theme.primaryLight }]
            ]}
            onPress={() => setTimeRange('year')}
          >
            <Text
              style={[
                styles.filterOptionText,
                { color: timeRange === 'year' ? theme.primary : theme.textSecondary }
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
  },
  activeFilterOption: {
    borderRadius: 16,
  },
  filterOptionText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  historyContainer: {
    flex: 1,
  },
  historyItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyItemBadges: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutText: {
    fontSize: 14,
    marginLeft: 8,
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  sleepTimesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sleepTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepTimeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  moodDateTimeContainer: {
    flexDirection: 'column',
  },
  moodTime: {
    fontSize: 12,
  },
  studyRelatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studyRelatedText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  waterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  waterText: {
    fontSize: 14,
    marginLeft: 8,
  },
  foodItems: {
    marginTop: 4,
  },
  foodItemsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  foodItemsList: {
    fontSize: 14,
  },
  insightsContainer: {
    flex: 1,
  },
  insightsCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  insightsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  correlationItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  correlationMetric: {
    fontSize: 16,
    fontWeight: '500',
  },
  significanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  significanceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  correlationDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recommendationIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
