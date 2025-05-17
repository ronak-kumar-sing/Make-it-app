import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// ... other imports ...

const Tab = createBottomTabNavigator();
const TaskStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

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

            // ... existing icon logic ...

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
        {/* ... tab screens ... */}
      </Tab.Navigator>
    // </NavigationContainer>
  );
}

// ... TaskStackScreen and MoreStackScreen functions ...

export default AppNavigator;
