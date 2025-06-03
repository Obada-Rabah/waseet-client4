import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../config';
import eventBus from '../../utils/eventBus';

// Constants
const FALLBACK_AVATAR = 'https://.me/api/portraits/men/1.jpg';

const ChatListScreen = () => {
  const navigation = useNavigation();
  const [state, setState] = useState({
    chats: [],
    loading: true,
    error: null,
    refreshing: false
  });

  const fetchChats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, refreshing: true }));
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${API_BASE_URL}/api/chat/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const text = await response.text();

      if (text.startsWith('<!DOCTYPE html>') || text.startsWith('<html')) {
        throw new Error('خطأ في الخادم - تم استلام صفحة HTML');
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.message || 'فشل في جلب المحادثات');
      }

      const formattedChats = data.data.map(chat => ({
        id: chat.chatId.toString(),
        userId: chat.userId,
        name: `${chat.firstName} ${chat.lastName}`,
        lastMessage: chat.lastMessage,
        time: formatTime(chat.lastMessageTime),
        avatar: chat.image || FALLBACK_AVATAR,
        unread: chat.unreadCount || 0
      }));

      setState({
        chats: formattedChats,
        loading: false,
        error: null,
        refreshing: false
      });

      const totalUnread = formattedChats.reduce((sum, chat) => sum + chat.unread, 0);
      await AsyncStorage.setItem('unreadMessages', totalUnread.toString());

      if (totalUnread === 0) {
        eventBus.emit('all-messages-read');
      }

    } catch (err) {
      console.error('Fetch error:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'فشل في تحميل المحادثات',
        loading: false,
        refreshing: false
      }));
    }
  }, []);

  const formatTime = useCallback((isoString) => {
    if (!isoString) return '';

    const date = new Date(isoString);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    }

    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  }, []);

  const navigateToChat = useCallback((chat) => {
    navigation.navigate('Chat', {
      recipientId: chat.userId,
      recipientName: chat.name
    });
  }, [navigation]);

  useEffect(() => { fetchChats(); }, [fetchChats]);
  const onRefresh = useCallback(() => fetchChats(), [fetchChats]);

  const renderItem = useCallback(({ item }) => (
    <ChatListItem
      item={item}
      onPress={navigateToChat}
    />
  ), [navigateToChat]);

  const renderSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  if (state.loading && !state.refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#e3711a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الرسائل</Text>
        <TouchableOpacity>
          <Ionicons name="search-outline" size={24} color="#dddcd7" />
        </TouchableOpacity>
      </View>

      {state.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{state.error}</Text>
          <TouchableOpacity onPress={fetchChats}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={state.chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            colors={['#e3711a']}
            tintColor="#e3711a"
          />
        }
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
      />
    </SafeAreaView>
  );
};

// ✅ Arabic Version of ChatListItem
const ChatListItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.chatItem}
    onPress={() => onPress(item)}
    activeOpacity={0.8}
  >
    <Image
      source={{ uri: item.avatar }}
      style={styles.avatar}
    />

    <View style={styles.chatContent}>
      <View style={styles.chatHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      <View style={styles.chatFooter}>
        <Text
          style={[
            styles.lastMessage,
            item.unread > 0 && styles.unreadMessage
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.lastMessage}
        </Text>

        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
));


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133353',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
    backgroundColor: '#133353',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dddcd7',
  },
  listContainer: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#133353',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.2)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontWeight: '600',
    fontSize: 17,
    color: '#dddcd7',
  },
  time: {
    fontSize: 13,
    color: '#dddcd7aa',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    color: '#dddcd7aa',
    fontSize: 15,
    marginRight: 10,
  },
  unreadMessage: {
    color: '#dddcd7',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#e3711a',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#133353',
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    marginHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
  retryText: {
    color: '#e3711a',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 10,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#133353',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 10,
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: '#133353',
  },
  unreadBadge: {
    backgroundColor: '#e3711a',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 80,
  },
});

export default ChatListScreen;