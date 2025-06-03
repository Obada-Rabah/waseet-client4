import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_BASE_URL from '../../config'
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function CarDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params;
  const [car, setCar] = React.useState(null);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchCar = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${API_BASE_URL}/api/cars/car/${carId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const carData = await response.json();
        await setCar(carData);

        const userResponse = await fetch(`${API_BASE_URL}/api/auth/user/${carData.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userResponse.json();
        setUser(userData);

        if (!token || token === 'undefined') {
          return res.status(401).json({ message: 'لم يتم توفير رمز صالح' });
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchCar();
  }, [carId]);

  const navigateToUserProfile = () => {
    navigation.navigate('UserProfile', { userId: car.userId });
  };

  if (!car || !user) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>
          جاري التحميل...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Image
        source={{
          uri: car.image ? `${API_BASE_URL}${car.image}` : 'https://via.placeholder.com/400x300?text=No+Image'
        }}
        style={styles.carImage}
        resizeMode="cover"
      />
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{car.model}</Text>
        <Text style={styles.price}>{car.price} $</Text>

        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>السنة</Text>
            <Text style={styles.specValue}>{car.year}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>الحالة</Text>
            <Text style={styles.specValue}>{car.used ? 'مستعملة' : 'جديدة'}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الوصف</Text>
        </View>
        <Text style={styles.description}>{car.describtion}</Text>

        <View style={styles.specItem}>
          <Text style={styles.specLabel}>تم النشر في</Text>
          <Text style={styles.specValue}>
            {new Date(car.createdAt).toLocaleDateString('ar-EG')}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>المعلن</Text>
        </View>
        <TouchableOpacity style={styles.userContainer} onPress={navigateToUserProfile}>
          <Image source={{ uri: "" }} style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.userStats}>• عضو منذ {new Date(user.createdAt).getFullYear()}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133353',
  },
  carImage: {
    width: '100%',
    height: 280,
    borderBottomWidth: 3,
    borderBottomColor: '#e3711a',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#dddcd7',
    marginBottom: 5,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e3711a',
    marginBottom: 25,
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.3)',
  },
  specItem: {
    width: '48%',
    marginBottom: 15,
  },
  specLabel: {
    color: '#dddcd7',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 3,
  },
  specValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dddcd7',
  },
  sectionHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
    marginBottom: 15,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dddcd7',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
    color: '#dddcd7',
    opacity: 0.9,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.3)',
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dddcd7',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  userRating: {
    fontSize: 15,
    color: '#e3711a',
    marginRight: 10,
    fontWeight: '600',
  },
  userStats: {
    fontSize: 14,
    color: '#dddcd7',
    opacity: 0.8,
    marginRight: 10,
  },
});