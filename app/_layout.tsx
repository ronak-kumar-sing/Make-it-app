import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeAndroidNotifications } from './services/AndroidNotificationFixes';
import { verifyDataIntegrity } from './utils/DataIntegrity';

// Screens
import AchievementsScreen from './screens/AchievementsScreen';
import ActivityHistory from './screens/ActivityHistory';
import ActivityTracker from './screens/ActivityTracker';
import AddTaskScreen from './screens/AddTaskScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import DashboardScreen from './screens/DashboardScreen';
import ExamsScreen from './screens/ExamsScreen';
import HealthDashboardScreen from './screens/HealthDashboardScreen';
import MoodTracker from './screens/MoodTracker';
import NutritionTracker from './screens/NutritionTracker';
import OnboardingScreen from './screens/OnboardingScreen';
import PermissionsTestScreen from './screens/PermissionsTestScreen';
import ResourcesScreen from './screens/ResourcesScreen';
import SettingsScreen from './screens/SettingsScreen';
import SleepTracker from './screens/SleepTracker';
import StreaksScreen from './screens/StreaksScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import TasksScreen from './screens/TasksScreen';
import TimerScreen from './screens/TimerScreen';

// Context
import DataSyncProvider from './components/DataSyncProvider';
import NotificationInitializer from './components/NotificationInitializer';
import PermissionsInitializer from './components/PermissionsInitializer';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TasksStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="TasksList"
        component={TasksScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={{ title: 'Add New Task' }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Exams"
        component={ExamsScreen}
        options={{ headerShown: true, title: 'Exams & Assignments' }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ headerShown: true, title: 'Analytics' }}
      />
      <Stack.Screen
        name="Resources"
        component={ResourcesScreen}
        options={{ headerShown: true, title: 'Resources' }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ headerShown: true, title: 'Achievements' }}
      />
      <Stack.Screen
        name="Health"
        component={HealthDashboardScreen}
        options={{ headerShown: true, title: 'Health & Wellness' }}
      />
      <Stack.Screen
        name="ActivityTracker"
        component={ActivityTracker}
        options={{ headerShown: true, title: 'Activity Tracker' }}
      />
      <Stack.Screen
        name="SleepTracker"
        component={SleepTracker}
        options={{ headerShown: true, title: 'Sleep Tracker' }}
      />
      <Stack.Screen
        name="MoodTracker"
        component={MoodTracker}
        options={{ headerShown: true, title: 'Mood Tracker' }}
      />
      <Stack.Screen
        name="NutritionTracker"
        component={NutritionTracker}
        options={{ headerShown: true, title: 'Nutrition Tracker' }}
      />
      <Stack.Screen
        name="ActivityHistory"
        component={ActivityHistory}
        options={{ headerShown: true, title: 'Health History' }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PermissionsTest"
        component={PermissionsTestScreen}
        options={{ headerShown: true, title: 'App Permissions' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Timer') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'Streaks') {
            iconName = focused ? 'flame' : 'flame-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Tasks" component={TasksStack} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Streaks" component={StreaksScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if this is the first launch and also verify data integrity
    async function initApp() {
      try {
        // First check if this is the first launch
        const value = await AsyncStorage.getItem('alreadyLaunched');
        if (value === null) {
          await AsyncStorage.setItem('alreadyLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }

        // Then verify and fix any data integrity issues
        await verifyDataIntegrity();

        // Set up Android notification channels if on Android
        if (Platform.OS === 'android') {
          await initializeAndroidNotifications();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsFirstLaunch(false); // Default to false if there's an error
      }
    }

    initApp();
  }, []);

  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppThemeWrapper>
          <SafeAreaProvider>
            <AppProvider>
              <DataSyncProvider>
                {/* Add NotificationInitializer to initialize and handle notifications */}
                <NotificationInitializer />
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  {isFirstLaunch ? (
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                  ) : null}
                  <Stack.Screen name="Main" component={MainTabs} />
                </Stack.Navigator>

                {/* Initialize all permissions when the app starts */}
                <PermissionsInitializer
                  onPermissionsInitialized={(statuses) => {
                    console.log('Permissions initialized:', statuses);
                    // You can handle specific permission states here if needed
                    if (!statuses.notifications && Platform.OS === 'android') {
                      // Maybe show a custom message for Android users about notifications
                    }
                  }}
                />

                {/* Keep notification initializer for backward compatibility */}
                <NotificationInitializer />
              </DataSyncProvider>
            </AppProvider>
          </SafeAreaProvider>
        </AppThemeWrapper>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// Wrapper component to apply theme
function AppThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  // Apply theme via context instead of wrapping in NavigationContainer
  // Expo Router already provides a NavigationContainer
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}