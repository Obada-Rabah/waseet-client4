import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../config';

export default function UserProfileScreen() {
  const route = useRoute();
  const { userId } = route.params;
  const navigation = useNavigation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('user');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error('No token found');

        const res = await fetch(`${API_BASE_URL}/api/auth/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        Alert.alert('خطأ', 'فشل في تحميل صفحة المستخدم');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleChatPress = () => {
    navigation.navigate('Chat', {
      recipientId: user.id,
    });
  };

  const handleReport = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const res = await fetch(`${API_BASE_URL}/api/report/add/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          reason,
          description,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || 'Report failed');
      Alert.alert('تم الإبلاغ عن المستخدم بنجاح');
      setIsReportModalVisible(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error reporting user:', error);
      Alert.alert('خطأ', 'فشل في عملية الإبلاغ');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e3711a" />
      </View>
    );
  }

  if (!user) {
    return (
      <Text style={{ color: 'white', textAlign: 'center' }}>
        لم يتم العثور على المستخدم
      </Text>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={styles.scrollContainer}>
      <View style={styles.container}>
        <Image
          source={{
            uri:
              user.avatar ||
              'https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3383.jpg',
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleChatPress}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#133353" />
          <Text style={styles.chatButtonText}>
            تواصل مع {user.firstName}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => setIsReportModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="alert-circle" size={20} color="white" />
          <Text style={styles.reportButtonText}>الإبلاغ عن المستخدم</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>السيارات المعروضة</Text>

        <FlatList
          data={user.cars}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
              style={styles.carItem}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri: item.image ? `${API_BASE_URL}${item.image}` : 'https://via.placeholder.com/400x300?text=No+Image'
                }} style={styles.carImage}
              />
              <View style={styles.carInfo}>
                <Text style={styles.carTitle}>{item.model}</Text>
                <Text style={styles.carDetails}>{item.year} • ${item.price.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carListContainer}
        />

        {/* Report Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isReportModalVisible}
          onRequestClose={() => setIsReportModalVisible(false)}
        >
          <View style={styles.reportModalContainer}>
            <Text style={styles.modalTitle}>الإبلاغ عن المستخدم</Text>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={reportType}
                onValueChange={(itemValue) => setReportType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="المستخدم" value="user" />
                <Picker.Item label="سيارة المستخدم" value="car" />
              </Picker>
            </View>

            <TextInput
              placeholder="السبب"
              placeholderTextColor="#999"
              value={reason}
              onChangeText={setReason}
              style={styles.input}
            />
            <TextInput
              placeholder="التفاصيل (اختياري)"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 80 }]}
              multiline
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleReport}>
              <Text style={styles.submitButtonText}>تأكيد الإبلاغ</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsReportModalVisible(false)}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
          </View>

        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#133353',
  },
  container: {
    padding: 25,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    margin: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.3)',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#e3711a',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#dddcd7',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#dddcd7',
    marginVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
    paddingBottom: 5,
  },
  carListContainer: {
    paddingVertical: 10,
  },
  carItem: {
    width: 220,
    marginRight: 15,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.2)',
  },
  carImage: {
    width: '100%',
    height: 140,
  },
  carInfo: {
    padding: 12,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dddcd7',
    marginBottom: 3,
  },
  carDetails: {
    fontSize: 15,
    color: '#dddcd7aa',
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#e3711a',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    alignSelf: 'center',
    width: '80%',
    elevation: 3,
  },
  chatButtonText: {
    color: '#133353',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  },
  reportButton: {
    flexDirection: 'row',
    backgroundColor: '#cc0000',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '80%',
    elevation: 3,
    marginBottom: 15,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  },
  reportModalContainer: {
    backgroundColor: '#0f2a47',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    borderColor: '#e3711a',
    borderWidth: 1,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e3711a',
    textAlign: 'center',
    marginBottom: 15,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#e3711a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#cc0000',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 15,
  },
  
});
