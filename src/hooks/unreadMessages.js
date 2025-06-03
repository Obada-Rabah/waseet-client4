// import { useEffect, useState, useRef } from 'react';
// import { io } from 'socket.io-client';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import API_BASE_URL from '../config';
// import { Buffer } from 'buffer';  // Ensure proper Buffer import

// global.Buffer = Buffer;  // Make Buffer global for React Native

// export const useUnreadMessages = () => {
//   const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
//   const socketRef = useRef(null);
//   const currentChatUserId = useRef(null); // Who we're chatting with

//   const setActiveChat = (userId) => {
//     currentChatUserId.current = userId;
//   };

//   const clearUnread = () => setHasUnreadMessages(false);

//   useEffect(() => {
//     const setupSocket = async () => {
//       try {
//         const token = await AsyncStorage.getItem('userToken');
//         console.log("Token:", token); // Log the token
//         if (!token) {
//           console.error("Token is missing.");
//           return;
//         }

//         const parts = token.split('.');
//         console.log("Token parts:", parts); // Log token parts
//         if (parts.length !== 3) {
//           console.error("Invalid JWT format. Parts:", parts);
//           return;
//         }

//         const base64Url = parts[1];
//         console.log("Base64 URL part:", base64Url);  // Log base64Url to verify
//         if (!base64Url) {
//           console.error("Base64Url is missing.");
//           return;
//         }

//         // Decode Base64 (ensure URL-safe Base64 format)
//         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');  // URL-safe decoding
//         const decodedString = Buffer.from(base64, 'base64').toString('utf-8');
//         console.log("Decoded string:", decodedString);  // Log decoded string
//         const decoded = JSON.parse(decodedString);

//         const userId = decoded?.id;
//         if (!userId) {
//           console.error("User ID not found in token.");
//           return;
//         }

//         if (!API_BASE_URL || typeof API_BASE_URL !== 'string') {
//           console.error("API_BASE_URL is missing or invalid.");
//           return;
//         }

//         console.log("API_BASE_URL:", API_BASE_URL);

//         // Proceed with socket connection
//         const socket = io(API_BASE_URL.replace('/api', ''), {
//           transports: ['websocket'],
//           auth: { token }, // Optional: Send token for validation
//         });

//         socketRef.current = socket;
//         socket.emit('join', `user_${userId}`);

//         socket.on('newMessage', (message) => {
//           if (!message || !message.senderId) {
//             console.warn("Invalid message received:", message);
//             return;
//           }

//           if (message.senderId !== currentChatUserId.current) {
//             setHasUnreadMessages(true);
//           }
//         });
//       } catch (error) {
//         console.error("Socket setup error:", error);
//       }
//     };

//     setupSocket();

//     // Clean up socket connection on component unmount
//     return () => {
//       if (socketRef.current) socketRef.current.disconnect();
//     };
//   }, []);

//   return { hasUnreadMessages, clearUnread, setActiveChat, setHasUnreadMessages };
// };
