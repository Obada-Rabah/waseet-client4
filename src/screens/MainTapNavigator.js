import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ImageBackground, Platform } from 'react-native';
import CarsStack from '../navigation/CarStack';
import ProvidersScreen from './providers/ProvidersScreen';
import ProfileScreen from './profile/ProfileScreen';
import { I18nManager } from 'react-native';
import AppHeader from './TopBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProviderStack from '../navigation/ProviderStack';
import ProfileStack from '../navigation/ProfileStack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';


// Force RTL layout
I18nManager.forceRTL(true);

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const routeName = getFocusedRouteNameFromRoute(route) ?? '';
  const shouldShowHeader = !['Chat', 'ProviderDetail'].includes(routeName);


  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/logo.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <AppHeader />
          <View style={styles.contentContainer}>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName;

                  if (route.name === 'Cars') {
                    iconName = focused ? 'car-sport' : 'car-sport-outline';
                  } else if (route.name === 'Providers') {
                    iconName = focused ? 'build' : 'build-outline';
                  } else if (route.name === 'Profile') {
                    iconName = focused ? 'person' : 'person-outline';
                  }

                  return (
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={iconName}
                        size={26}
                        color={color}
                        style={styles.icon}
                      />
                      {focused && <View style={styles.activeIndicator} />}
                    </View>
                  );
                },
                tabBarActiveTintColor: '#e3711a',
                tabBarInactiveTintColor: '#dddcd7aa',
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarItemStyle: styles.tabBarItem,
                headerShown: false,
              })}
            >
              <Tab.Screen
                name="Providers"
                component={ProviderStack}
                options={({ route }) => {
                  const routeName = getFocusedRouteNameFromRoute(route) ?? '';
                  const hideTab = ['Chat', 'ProviderDetail'].includes(routeName);

                  return {
                    title: ' ',
                    tabBarStyle: hideTab ? { display: 'none' } : styles.tabBar,
                  };
                }}
              />
              <Tab.Screen name="Cars" component={CarsStack} options={{ title: ' ' }} />
              <Tab.Screen name="Profile" component={ProfileStack} options={{ title: ' ' }} />
            </Tab.Navigator>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133353',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 51, 83, 0.9)',
  },
  contentContainer: {
    flex: 1,
    marginTop: 80, // Header height
  },
  tabBar: {
    backgroundColor: 'rgba(19, 51, 83, 0.95)',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.2)',
  },
  tabBarItem: {
    paddingVertical: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Platform.OS === 'ios' ? 0 : 5,
    writingDirection: 'rtl',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    marginBottom: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e3711a',
  },
});