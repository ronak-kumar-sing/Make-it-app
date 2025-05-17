import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import TasksScreen from './screens/TasksScreen';
import TimerScreen from './screens/TimerScreen';
import StreaksScreen from './screens/StreaksScreen';
import SettingsScreen from './screens/SettingsScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ResourcesScreen from './screens/ResourcesScreen';
import ExamsScreen from './screens/ExamsScreen';
import AchievementsScreen from './screens/AchievementsScreen';

// Context
import { AppProvider } from './context/AppContext';

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
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TasksStack} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MoreMenu" 
        component={MoreScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Streaks" 
        component={StreaksScreen} 
        options={{ title: 'Study Streaks' }} 
      />
      <Stack.Screen 
        name="Resources" 
        component={ResourcesScreen} 
        options={{ title: 'Study Resources' }} 
      />
      <Stack.Screen 
        name="Exams" 
        component={ExamsScreen} 
        options={{ title: 'Exams & Assignments' }} 
      />
      <Stack.Screen 
        name="Achievements" 
        component={AchievementsScreen} 
        options={{ title: 'Achievements' }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />
    </Stack.Navigator>
  );
}

function MoreScreen({ navigation }) {
  const menuItems = [
    { 
      id: 'streaks', 
      title: 'Study Streaks', 
      icon: 'flame-outline', 
      screen: 'Streaks' 
    },
    { 
      id: 'resources', 
      title: 'Study Resources', 
      icon: 'book-outline', 
      screen: 'Resources' 
    },
    { 
      id: 'exams', 
      title: 'Exams & Assignments', 
      icon: 'calendar-outline', 
      screen: 'Exams' 
    },
    { 
      id: 'achievements', 
      title: 'Achievements', 
      icon: 'trophy-outline', 
      screen: 'Achievements' 
    },
    { 
      id: 'settings', 
      title: 'Settings', 
      icon: 'settings-outline', 
      screen: 'Settings' 
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
          More
        </Text>
        
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              padding: 16,
              marginBottom: 8,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={24} color="#6C63FF" />
            <Text style={{ fontSize: 16, color: '#333', marginLeft: 16 }}>
              {item.title}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#999"
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        ))}
        
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: 24,
          padding: 16,
          backgroundColor: '#F0EEFF',
          borderRadius: 8,
        }}>
          <Ionicons name="lock-closed-outline" size={20} color="#6C63FF" />
          <Text style={{ fontSize: 14, color: '#6C63FF', marginLeft: 8 }}>
            All your data is stored locally on your device
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  
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
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
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
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}