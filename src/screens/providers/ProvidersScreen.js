import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, Platform, ActivityIndicator } from 'react-native';
import API_BASE_URL from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install this package


export default function ProviderScreen({ navigation }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  

  useEffect(() => {


    const fetchProviders = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_BASE_URL}/api/providers/providers`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 403) {
          // Show alert for forbidden access
          if (Platform.OS === 'web') {
            window.alert("أنت مزوّد خدمة, لا تستطيع الإطّلاع على باقي مزوّدين الخدمات");
          } else {
            Alert.alert(
              'الوصول محظور',
              "أنت مزوّد خدمة, لا تستطيع الإطّلاع على باقي مزوّدين الخدمات"
            );
          }

          return;
        }

        if (!response.ok) throw new Error('Failed to fetch providers');

        const data = await response.json();
        setProviders(data);
      } catch (error) {
        console.error('Error fetching providers:', error);
        Alert.alert('خطأ', error.message || 'حدث خطأ ما');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);


  const renderProviderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.providerCard}
      onPress={() => navigation.navigate('ProviderDetail', { providerId: item.id })}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS5JKkEsOUjRTx488XWzep59wkmMOohNrLKQ&s' }}
        style={styles.providerImage}
      />
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.providerLocation}>
          📍 {item.location || 'Location not specified'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جار تحميل مزوّدين الخدمات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>مزوّدين الخدمات</Text>
      <FlatList
        data={providers}
        renderItem={renderProviderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133353',
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 15,
    color: '#dddcd7',
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#dddcd7',
  },
  listContainer: {
    paddingBottom: 20,
  },
  providerCard: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.2)',
  },
  providerImage: {
    width: 100,
    height: 100,
    borderRightWidth: 1,
    borderRightColor: 'rgba(227, 113, 26, 0.2)',
  },
  providerInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dddcd7',
    marginBottom: 5,
  },
  providerLocation: {
    fontSize: 14,
    color: '#e3711a',
  },
  popupContainer: {
    backgroundColor: '#e3711a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  popupTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  popupText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  popupButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#fff',
  },
  popupButtonText: {
    color: '#e3711a',
    fontWeight: '600',
  },
});