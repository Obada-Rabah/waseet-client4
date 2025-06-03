import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RegisterScreen from '../screens/auth/registerScreen';
import LoginScreen from '../screens/auth/loginScreen';
import MainTabNavigator from '../screens/MainTapNavigator';
import LanguageToggle from '../components/LanguageToggle';
import ChatScreen from '../screens/Chat/ChatScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import SplashScreen from './SplashScreen';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash">

      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerRight: () => <LanguageToggle />, headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerRight: () => <LanguageToggle />, headerShown: false }}
      />

      {/* Main app with tabs */}
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />

      {/* Chat screen outside of tabs */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          headerShown: true, // Enable header
          headerStyle: {
            backgroundColor: '#133353',
          },
          headerLeft: () => {
            const navigation = useNavigation(); // Use useNavigation hook
            return (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 15 }}>
                <Ionicons name="arrow-back" size={24} color="#dddcd7" />
              </TouchableOpacity>
            );
          },
          headerTitle: () => null, // Optional: Hide the default title
        }}
      />

      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
}
