import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import CarsScreen from '../screens/cars/CarsScreen';
import AddCarScreen from '../screens/cars/AddCarScreen';
import CarDetailScreen from '../screens/cars/CarDetailScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import React from 'react';

const Stack = createStackNavigator();

export default function CarsStack({ navigation, route }) {
  // Hide tab bar on specific screens
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'CarsList';

  React.useLayoutEffect(() => {
    if (routeName === 'Chat') {
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
    } else {
      navigation.setOptions({ tabBarStyle: undefined });
    }
  }, [navigation, routeName]);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CarsList"
        component={CarsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddCar"
        component={AddCarScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="CarDetail"
        component={CarDetailScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: false
        }}
      />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false
        }}
      />




    </Stack.Navigator>
  );
}





