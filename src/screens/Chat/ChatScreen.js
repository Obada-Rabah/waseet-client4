import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import API_BASE_URL from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import eventBus from '../../utils/eventBus';
import { Buffer } from 'buffer';
global.Buffer = Buffer;


const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { recipientId, recipientName } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
  const scrollRef = useRef(null);
  const [userId, setUserId] = useState(null);

  const socketRef = useRef(null);
  const screenHeight = Dimensions.get('window').height;

  // ⬅️ Put it HERE, outside useEffect
  const markMessagesAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_BASE_URL}/api/chat/mark-read/${recipientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      eventBus.emit('all-messages-read');

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    console.log('👀 useEffect fired with recipientId:', recipientId);
    const setupChat = async () => {
      console.log('setupChat started');
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error('Token not found');

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        const loggedInUserId = decoded.id;
        setUserId(loggedInUserId);

        console.log('📡 Fetching chat and marking as read...');
        const [messagesResponse, _] = await Promise.all([
          fetch(`${API_BASE_URL}/api/chat/${recipientId}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        console.log('📬 messagesResponse.status:', messagesResponse.status);


        const data = await messagesResponse.json();
        if (data.success) {
          const formattedMessages = data.data.map((message) => ({
            id: message.id.toString(),
            text: message.content,
            sender: message.senderId === recipientId ? recipientId : 'me',
            time: new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isRead: message.isRead,
          }));
          setMessages(formattedMessages);
        }

        const socket = io(API_BASE_URL.replace('/api', ''), {
          transports: ['websocket'],
          withCredentials: true,
        });

        socketRef.current = socket;
        socket.emit('join', `user_${loggedInUserId}`);

        socket.on('newMessage', async (incomingMessage) => {
          if (
            (incomingMessage.senderId === recipientId && incomingMessage.receiverId === loggedInUserId) ||
            (incomingMessage.senderId === loggedInUserId && incomingMessage.receiverId === recipientId)
          ) {
            const formatted = {
              id: incomingMessage.id.toString(),
              text: incomingMessage.content,
              sender: incomingMessage.senderId === recipientId ? recipientId : 'me',
              time: new Date(incomingMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              isRead: incomingMessage.isRead,
            };
            setMessages((prev) => [...prev, formatted]);

            // Emit unread only if it's a message from the other user
            if (incomingMessage.senderId !== loggedInUserId) {
              eventBus.emit('new-unread-message');
            }


            // If it's our own message, scroll to bottom
            if (incomingMessage.senderId === loggedInUserId) {
              setTimeout(() => {
                if (Platform.OS === 'web') scrollRef.current?.scrollToEnd({ animated: true });
                else flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }
        });

        socket.on('messagesRead', ({ senderId, count }) => {
          if (senderId === recipientId && count > 0) {
            setMessages(prev => prev.map(msg =>
              msg.sender === 'me' ? { ...msg, isRead: true } : msg
            ));
          }
        });
      } catch (err) {
        console.error('setupChat error:', err);
        setError(err.message || 'حدث خطأ ما');
      } finally {
        setIsLoading(false);
      }
    };

    setupChat();


    // Also mark as read when user scrolls to bottom (messages are viewed)
    const handleScroll = () => {
      markMessagesAsRead();
    };


    const scrollView = scrollRef.current;
    const flatList = flatListRef.current;

    if (Platform.OS === 'web' && scrollView) {
      scrollView.addEventListener('scroll', handleScroll);
      return () => scrollView.removeEventListener('scroll', handleScroll);
    } else if (flatList) {
      flatList.addEventListener('scroll', handleScroll);
      return () => flatList.removeEventListener('scroll', handleScroll);
    }
  }, [recipientId]);


  useFocusEffect(
    React.useCallback(() => {
      markMessagesAsRead();
      return () => { }; // cleanup if needed later
    }, [])
  );

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    const tempId = Date.now().toString();
    const newMsg = {
      id: tempId,
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false, // Initially false
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: recipientId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                id: data.data.id.toString(),
                text: data.data.content,
                sender: 'me',
                time: new Date(data.data.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                isRead: data.data.isRead,
              }
              : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }

    setTimeout(() => {
      if (Platform.OS === 'web') scrollRef.current?.scrollToEnd({ animated: true });
      else flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessages = () =>
    messages.map((item) => (
      <View
        key={item.id}
        style={[
          styles.messageBubble,
          item.sender === 'me' ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={item.sender === 'me' ? styles.myMessageText : styles.messageText}>
          {item.text}
        </Text>
        <Text style={item.sender === 'me' ? styles.myMessageTime : styles.messageTime}>
          {item.time}
        </Text>
      </View>
    ));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#e3711a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ height: screenHeight, backgroundColor: '#133353' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#dddcd7" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.userInfoContainer}>
            <Image
              source={{ uri: 'https://.com/200/200' }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{recipientName}</Text>
              <Text style={styles.userStatus}>Online</Text>
            </View>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'web' ? (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.messageBubble,
                  item.sender === 'me' ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Text style={item.sender === 'me' ? styles.myMessageText : styles.messageText}>
                  {item.text}
                </Text>
                <View style={styles.messageFooter}>
                  <Text style={item.sender === 'me' ? styles.myMessageTime : styles.messageTime}>
                    {item.time}
                  </Text>
                  {item.sender === 'me' && (
                    <Ionicons
                      name={item.isRead ? "checkmark-done" : "checkmark"}
                      size={16}
                      color={item.isRead ? "#4CAF50" : "#dddcd7"}
                      style={styles.readIcon}
                    />
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.sender === 'me' ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Text style={item.sender === 'me' ? styles.myMessageText : styles.messageText}>
                  {item.text}
                </Text>
                <View style={styles.messageFooter}>
                  <Text style={item.sender === 'me' ? styles.myMessageTime : styles.messageTime}>
                    {item.time}
                  </Text>
                  {item.sender === 'me' && (
                    <Ionicons
                      name={item.isRead ? "checkmark-done" : "checkmark"}
                      size={16}
                      color={item.isRead ? "#4CAF50" : "#dddcd7"}
                      style={styles.readIcon}
                    />
                  )}
                </View>
              </View>
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={Platform.OS === 'web' ? styles.webInputWrapper : styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="اكتب رسالة ..."
              placeholderTextColor="#dddcd7aa"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons
                name="send"
                size={24}
                color={newMessage.trim() ? '#e3711a' : '#dddcd755'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133353',
    height: '100vh',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
    backgroundColor: '#133353',
  },
  backButton: { padding: 5, marginRight: 10 },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#e3711a',
    marginRight: 15,
  },
  userInfo: { flex: 1 },
  userName: { fontWeight: '600', fontSize: 18, color: '#dddcd7' },
  userStatus: { fontSize: 13, color: '#dddcd7aa' },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messagesList: {
    padding: 20,
    paddingBottom: 120,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3711a',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(221, 220, 215, 0.2)',
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 16, color: '#dddcd7', lineHeight: 22 },
  myMessageText: { color: '#133353' },
  messageTime: {
    fontSize: 11,
    color: '#dddcd7aa',
    marginTop: 6,
    textAlign: 'right',
  },
  myMessageTime: { color: '#133353aa' },
  inputWrapper: {
    backgroundColor: '#133353',
    borderTopWidth: 2,
    borderTopColor: '#e3711a',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  webInputWrapper: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#133353',
    borderTopWidth: 2,
    borderTopColor: '#e3711a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 24,
    color: '#dddcd7',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e3711a55',
  },
  sendButton: {
    marginLeft: 10,
    padding: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  readIcon: {
    marginLeft: 4,
  },
});

export default ChatScreen;
