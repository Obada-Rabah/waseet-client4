import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { LanguageProvider } from './languageContext'; // Adjusted path
import 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import React from "react";
import socket from "./src/services/socket.js";
global.Buffer = global.Buffer || require('buffer').Buffer;



export default function App() {

    useEffect(() => {
      socket.on("connect", () => {
        console.log("Connected to backend via socket");
      });

      
  
      return () => {
        socket.disconnect();
      };
    }, []);

  return (
    <LanguageProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </LanguageProvider>
  );

}




