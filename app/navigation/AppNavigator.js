import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Remove health-related imports
// ... other imports ...

const Tab = createBottomTabNavigator();
const TaskStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
// Remove HealthStack

// Remove HealthStackScreen function

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
        <Tab.Screen name="More" component={MoreStackScreen} />
      </Tab.Navigator>
    // </NavigationContainer>
  );
}

// ... TaskStackScreen and MoreStackScreen functions ...

export default AppNavigator;
