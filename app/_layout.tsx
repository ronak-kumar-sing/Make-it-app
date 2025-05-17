import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import AchievementsScreen from './screens/AchievementsScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import DashboardScreen from './screens/DashboardScreen';
import ExamsScreen from './screens/ExamsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ResourcesScreen from './screens/ResourcesScreen';
import SettingsScreen from './screens/SettingsScreen';
import StreaksScreen from './screens/StreaksScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import TasksScreen from './screens/TasksScreen';
import TimerScreen from './screens/TimerScreen';

// Context
import { AppProvider } from './context';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TasksStack() {
  return (
    <Stack.Navigator>
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
  return (
    <Stack.Navigator>
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
    </Stack.Navigator>
  );
}

function MainTabs() {
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
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Tasks" component={TasksStack} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Streaks" component={StreaksScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('alreadyLaunched').then(value => {
      if (value === null) {
        AsyncStorage.setItem('alreadyLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);

  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="auto" />
          {isFirstLaunch ? (
            <Stack.Navigator>
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          ) : (
            <MainTabs />
          )}
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}