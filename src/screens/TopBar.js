import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';
import * as jwtDecode from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import eventBus from '../utils/eventBus';
import { useRef } from 'react';

const AppHeader = () => {
  const navigation = useNavigation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const socketRef = useRef(null);
  const [isPrivacyVisible, setIsPrivacyVisible] = useState(false);


  const getUserId = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.id;
  };

  const fetchUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      const count = result?.data?.unreadCount || 0;
      console.log('📦 Fetched unread count from server:', count);
      setHasUnreadMessages(count > 0);
    } catch (error) {
      console.error('❌ Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    console.log('📡 TopBar mounted');

    const initSocket = async () => {
      const userId = await getUserId();
      if (!userId) {
        console.warn('No userId from token');
        return;
      }

      const socket = io(API_BASE_URL.replace('/api', ''), {
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        socket.emit('join', `user_${userId}`);
        console.log(`✅ Joined room: user_${userId}`);
      });

      socket.on('newMessage', (message) => {
        getUserId().then((id) => {
          if (message.receiverId === id) {
            console.log('🔥 Real-time: newMessage for me');
            setHasUnreadMessages(true);
          }
        });
      });

      socket.on('notification', (data) => {
        console.log('🔔 Real-time notification:', data);
        setNotifications(prev => [
          {
            id: Date.now().toString(),
            title: 'إشعار',
            text: data.message,
            time: 'منذ لحظات',
          },
          ...prev,
        ]);
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err);
      });
    };

    initSocket();
    fetchUnreadCount(); // Fetch on mount

    const unsubscribe = navigation.addListener('focus', fetchUnreadCount);

    // EventBus listeners
    eventBus.on('new-unread-message', () => {
      console.log('🔥 EventBus: new-unread-message');
      setHasUnreadMessages(true);
    });

    eventBus.on('all-messages-read', () => {
      console.log('✅ EventBus: all-messages-read');
      setHasUnreadMessages(false);
    });

    return () => {
      const socket = socketRef.current;
      if (socket) {
        socket.off('notification');
        socket.off('connect');
        socket.off('connect_error');
        socket.off('newMessage');
      }

      unsubscribe();
      eventBus.off('new-unread-message');
      eventBus.off('all-messages-read');
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/orders/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      const normalized = (result.notifications || []).map((n) => ({
        id: n.id.toString(),
        title: 'Notification',
        text: n.message,
        time: new Date(n.createdAt).toLocaleString(),
      }));

      setNotifications(normalized);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) loadNotifications();
  };

  const handleClearAll = () => {
    setShowNotifications(false);
  };

  return (
    <View style={styles.headerContainer}>
      {/* Logo */}
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Icons */}
      <View style={styles.iconsContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleNotifications}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={28} color="#dddcd7" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notifications.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('ChatList')}
          activeOpacity={0.8}
        >
          <View>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#dddcd7" />
            {hasUnreadMessages && (
              <View style={styles.dot} />
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setIsPrivacyVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="help-circle-outline" size={28} color="#dddcd7" />
        </TouchableOpacity>

      </View>

      {/* Notification Popup */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={toggleNotifications}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={toggleNotifications}
        >
          <View style={styles.notificationPopup}>
            {/* Popup Header with Close Button */}
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>الإشعارات</Text>
              <TouchableOpacity
                onPress={toggleNotifications}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="close" size={24} color="#dddcd7" />
              </TouchableOpacity>
            </View>

            {/* Notification List */}
            <ScrollView
              style={styles.notificationList}
              contentContainerStyle={styles.notificationListContent}
            >
              {notifications.map(notification => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.notificationItem}
                  onPress={() => {
                    setShowNotifications(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationText}>{notification.text}</Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Clear All Button */}
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAll}
              activeOpacity={0.8}
            >
              <Text style={styles.clearAllText}>مسح جميع الإشعارات</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={isPrivacyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPrivacyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.privacyModalContainer}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>سياسة الخصوصية</Text>
              <TouchableOpacity
                onPress={() => setIsPrivacyVisible(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Ionicons name="close" size={24} color="#dddcd7" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 15 }}>
              <Text style={styles.sectionTitle}>سياسة الخصوصية لتطبيق "وسيط"</Text>
              <Text style={styles.sectionText}>📅 آخر تحديث: 3 يونيو 2025</Text>

              <Text style={styles.sectionTitle}>1. المعلومات التي نقوم بجمعها</Text>
              <Text style={styles.listItem}>- الاسم الكامل</Text>
              <Text style={styles.listItem}>- رقم الهاتف</Text>
              <Text style={styles.listItem}>- الموقع الجغرافي (اختياري)</Text>
              <Text style={styles.listItem}>- بيانات السيارة (لأصحاب السيارات)</Text>
              <Text style={styles.listItem}>- بيانات الخدمات (لمقدمي الخدمات)</Text>
              <Text style={styles.listItem}>- تفاصيل المواعيد والطلبات</Text>
              <Text style={styles.listItem}>- الصور التي يقوم المستخدم برفعها</Text>

              <Text style={styles.sectionTitle}>2. استخدام المعلومات</Text>
              <Text style={styles.listItem}>- ربط أصحاب السيارات بمقدمي الخدمات</Text>
              <Text style={styles.listItem}>- تنظيم المواعيد والتواصل بين الطرفين</Text>
              <Text style={styles.listItem}>- إرسال الإشعارات المتعلقة بالطلبات</Text>
              <Text style={styles.listItem}>- ضمان بيئة آمنة وموثوقة من خلال مراقبة سلوك المستخدمين</Text>

              <Text style={styles.sectionTitle}>3. قواعد السلوك داخل التطبيق</Text>
              <Text style={styles.listItem}>- في حال عدم التزام أحد الطرفين بالحضور أو التأخر لأكثر من 30 دقيقة دون إشعار، يتم حظره مؤقتًا أو دائمًا.</Text>
              <Text style={styles.listItem}>- في حالة تقديم معلومات غير دقيقة أو مضللة في قسم بيع وشراء السيارات، تحتفظ الإدارة بحق الحظر.</Text>

              <Text style={styles.sectionTitle}>4. مشاركة المعلومات</Text>
              <Text style={styles.listItem}>- لا نقوم ببيع أو تأجير بيانات المستخدمين لأي طرف ثالث.</Text>
              <Text style={styles.listItem}>- قد نشارك بعض البيانات عند الحاجة لتنفيذ الطلبات أو بأمر قانوني.</Text>

              <Text style={styles.sectionTitle}>5. حماية البيانات</Text>
              <Text style={styles.listItem}>- نستخدم تقنيات وإجراءات حديثة لحماية بياناتك من الوصول غير المصرح به أو الفقدان.</Text>

              <Text style={styles.sectionTitle}>6. حقوق المستخدم</Text>
              <Text style={styles.listItem}>- يمكنك تعديل بياناتك الشخصية في أي وقت.</Text>
              <Text style={styles.listItem}>- يمكنك طلب حذف حسابك وبياناتك.</Text>
              <Text style={styles.listItem}>- يمكنك الإبلاغ عن أي استخدام غير مناسب.</Text>

              <Text style={styles.sectionTitle}>7. التحديثات على السياسة</Text>
              <Text style={styles.sectionText}>قد نقوم بتعديل هذه السياسة وسيتم إعلامك بالتغييرات عبر التطبيق.</Text>

              <Text style={styles.sectionTitle}>8. للتواصل معنا</Text>
              <Text style={styles.sectionText}>للاستفسارات، راسلنا على: info@waseetsyria.com</Text>
            </ScrollView>

          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#133353',
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
    height: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  logo: {
    width: 150,
    height: 50,
    tintColor: '#dddcd7', // Optional: if you want the logo to match the theme
  },
  spacer: {
    flex: 1,
  },
  iconsContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 25,
    marginBottom: 5,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    left: -3,
    backgroundColor: '#e3711a',
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#133353',
  },
  badgeText: {
    color: '#133353',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 51, 83, 0.9)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  notificationPopup: {
    backgroundColor: '#133353',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: '70%',
    borderWidth: 2,
    borderColor: '#e3711a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221, 220, 215, 0.2)',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dddcd7',
  },
  notificationList: {
    paddingHorizontal: 15,
  },
  notificationItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221, 220, 215, 0.1)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 3,
    color: '#dddcd7',
  },
  notificationText: {
    color: '#dddcd7aa',
    marginBottom: 3,
  },
  notificationTime: {
    fontSize: 12,
    color: '#dddcd777',
  },
  clearAllButton: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(221, 220, 215, 0.2)',
  },
  clearAllText: {
    color: '#e3711a',
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 10,
    height: 10,
    backgroundColor: '#e3711a',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#133353',
  },
  privacyModalContainer: {
    backgroundColor: '#133353',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: '75%',
    borderWidth: 2,
    borderColor: '#e3711a',
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  privacyText: {
    fontSize: 15,
    color: '#dddcd7',
    lineHeight: 24,
    textAlign: 'right',
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#e3711a',
    marginTop: 20,
    textAlign: 'right',
  },
  
  sectionText: {
    fontSize: 15,
    color: '#dddcd7',
    lineHeight: 26,
    marginTop: 8,
    textAlign: 'right',
  },
  
  listItem: {
    fontSize: 15,
    color: '#dddcd7',
    lineHeight: 26,
    marginRight: 10,
    marginTop: 5,
    textAlign: 'right',
  },
  
});

export default AppHeader;
