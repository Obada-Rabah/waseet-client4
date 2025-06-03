import { createStackNavigator } from '@react-navigation/stack';
import ProvidersScreen from '../screens/providers/ProvidersScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import ProviderScreen from '../screens/providers/ProviderScreen';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import React, {useEffect} from 'react';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Stack = createStackNavigator();

export default function ProviderStack({ navigation, route }) {
  useEffect(() => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProvidersScreen';

    if (['Chat', 'ProviderDetail'].includes(routeName)) {
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
    } else {
      navigation.setOptions({ tabBarStyle: { display: 'flex' } });
    }
  }, [navigation, route]);
  
  React.useLayoutEffect(() => {
    const routeName = getFocusedRouteNameFromRoute(route);

    if (routeName === 'ProviderDetail' || routeName === 'Chat') {
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
    } else {
      navigation.setOptions({ tabBarStyle: { display: 'flex' } });
    }
  }, [navigation, route]);

  // Common header options for screens that need back navigation
  const screenOptions = {
    headerStyle: {
      backgroundColor: '#133353',
    },
    headerTintColor: '#dddcd7',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerBackTitleVisible: false,
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ProvidersScreen"
        component={ProvidersScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ProviderDetail"
        component={ProviderScreen}
        options={({ navigation }) => ({
          title: 'Provider Details',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 15 }}
              hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
            >
              <Ionicons name="arrow-back" size={24} color="#dddcd7" />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ navigation, route }) => ({
          headerShown: false
        })}
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
    </Stack.Navigator>
  );
}