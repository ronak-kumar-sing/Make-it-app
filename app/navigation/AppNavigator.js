import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivityHistory from '../screens/ActivityHistory';
import ActivityTracker from '../screens/ActivityTracker';
import HealthDashboardScreen from '../screens/HealthDashboardScreen';
import HydrationTracker from '../screens/HydrationTracker';
import MoodTracker from '../screens/MoodTracker';
import NutritionTracker from '../screens/NutritionTracker';
import SleepTracker from '../screens/SleepTracker';
// ... other imports ...

const Tab = createBottomTabNavigator();
const TaskStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
const HealthStack = createNativeStackNavigator();

function HealthStackScreen() {
  return (
    <HealthStack.Navigator>
      <HealthStack.Screen
        name="HealthDashboard"
        component={HealthDashboardScreen}
        options={{ headerTitle: "Health & Wellness" }}
      />
      <HealthStack.Screen
        name="ActivityTracker"
        component={ActivityTracker}
        options={{ headerTitle: "Activity Tracker" }}
      />
      <HealthStack.Screen
        name="SleepTracker"
        component={SleepTracker}
        options={{ headerTitle: "Sleep Tracker" }}
      />
      <HealthStack.Screen
        name="MoodTracker"
        component={MoodTracker}
        options={{ headerTitle: "Mood Tracker" }}
      />
      <HealthStack.Screen
        name="NutritionTracker"
        component={NutritionTracker}
        options={{ headerTitle: "Nutrition Tracker" }}
      />
      <HealthStack.Screen
        name="HydrationTracker"
        component={HydrationTracker}
        options={{ headerTitle: "Hydration Tracker" }}
      />
      <HealthStack.Screen
        name="ActivityHistory"
        component={ActivityHistory}
        options={{ headerTitle: "Health History" }}
      />
    </HealthStack.Navigator>
  );
}

function AppNavigator() {
  // Fixed light theme
  const theme = {
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    primary: '#6C63FF',
    primaryLight: '#F0EEFF',
    border: '#EEEEEE',
    icon: '#757575'
  };

  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Tasks') {
              iconName = focused ? 'checkbox' : 'checkbox-outline';
            } else if (route.name === 'Timer') {
              iconName = focused ? 'timer' : 'timer-outline';
            } else if (route.name === 'Health') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'More') {
              iconName = focused ? 'menu' : 'menu-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.icon,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
          headerStyle: {
            backgroundColor: theme.card,
          },
          headerTintColor: theme.text,
        })}
      >
        <Tab.Screen name="Tasks" component={TaskStackScreen} />
        <Tab.Screen name="Health" component={HealthStackScreen} />
        <Tab.Screen name="More" component={MoreStackScreen} />
      </Tab.Navigator>
    // </NavigationContainer>
  );
}

// ... TaskStackScreen and MoreStackScreen functions ...

export default AppNavigator;
