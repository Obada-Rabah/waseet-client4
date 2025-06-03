import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../config';
import { FloatingAction } from "react-native-floating-action";
import { Platform } from 'react-native';
import ConfirmDialog from '../../components/ConfirmDialog';


export default function ProfileScreen({ navigation }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCars, setUserCars] = useState([]);
  const [userServices, setUserServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('cars');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isEditServiceModalVisible, setIsEditServiceModalVisible] = useState(false);
  const [editedService, setEditedService] = useState(null);
  const [otherParty, setOtherParty] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddServiceModalVisible, setIsAddServiceModalVisible] = useState(false);
  const [isClosingAddServiceModal, setIsClosingAddServiceModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [isCarModalVisible, setIsCarModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState({});
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [appointmentInput, setAppointmentInput] = useState('');
  const [isAppointmentModalVisible, setIsAppointmentModalVisible] = useState(false);
  const [appointmentText, setAppointmentText] = useState('');
  const [pendingAcceptId, setPendingAcceptId] = useState(null);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclineModalVisible, setIsDeclineModalVisible] = useState(false);



  const fetchUserData = async () => {
    try {
      setLoading(true);
      setIsReady(false)

      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        console.log("No token found");
        navigation.navigate('Login');
        return;
      }


      // Fetch user data with included cars
      const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userRes.ok) {
        throw new Error(`تعذر تحميل بيانات المستخدم: ${userRes.status}`);
      }

      const response = await userRes.json();
      console.log("Full API response:", response); // Debug log

      if (!response.user) {
        throw new Error('User data is empty');
      }

      // Set user data and cars from the included relationship
      setUser(response.user);
      setUserCars(response.user.cars || []);

      // Fetch services if provider
      // In your fetch logic:
      // In your fetch logic:
      if (response.user.isprovider) {
        try {
          const servicesRes = await fetch(`${API_BASE_URL}/api/providers/mine`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (servicesRes.ok) {
            const servicesData = await servicesRes.json();
            console.log("Raw services data:", servicesData);

            // Extract services from the nested structure
            const servicesArray = servicesData.MyServices?.services || [];

            console.log("Processed services array:", servicesArray);
            setUserServices(servicesArray);
          }
        } catch (servicesError) {
          console.error("Error fetching services:", servicesError);
        }
      }

      // Fetch orders
      try {
        const ordersUrl = response.user.isprovider
          ? `${API_BASE_URL}/api/orders/provider/MyOrders`
          : `${API_BASE_URL}/api/orders/MyOrders`;

        const ordersRes = await fetch(ordersUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          // Handle both direct array and { orders: [] } responses
          const ordersArray = ordersData.orders || ordersData.data || ordersData;
          setOrders(Array.isArray(ordersArray) ? ordersArray : []);
        }
        setLoading(false);
        setIsReady(true);
      } catch (ordersError) {
        console.error("Error fetching orders:", ordersError);
      }

    } catch (error) {
      console.error("Error in fetchUserData:", error);
      Alert.alert("خطأ", "فشل في تحميل بيانات المستخدم, الرجاء المحاولة مرة أخرى");
    } finally {
      setLoading(false);
      setLoading(false);
      setIsReady(true);
    }
  };

  useEffect(() => {
    fetchUserData(); // initial fetch

    const interval = setInterval(() => {
      fetchUserData(); // repeat every 60 seconds
    }, 60000); // 60,000 ms = 60 sec

    return () => clearInterval(interval); // cleanup on unmount
  }, [navigation]);


  const handleDeleteOrder = async () => {
    try {
      if (!deleteReason.trim()) {
        Alert.alert('Error', 'أدخل سبب الإلغاء من فضلك');
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE_URL}/api/orders/delete/${selectedOrderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: deleteReason
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في حذف الطلب');
      }

      // Remove the order from local state
      setOrders(prev => prev.filter(order => order.id !== selectedOrderId));

      // Reset and close
      setDeleteReason('');
      setIsDeleteModalVisible(false);
      setSuccessMessage('تم إلغاء الطلب بنجاح');
      setIsSuccessModalVisible(true);

      setTimeout(() => setIsSuccessModalVisible(false), 2000);
    } catch (error) {
      console.error('Error deleting order:', error);
      Alert.alert('خطأ', error.message || 'فشل حذف الطلب');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      navigation.navigate('Login');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const performOrderAction = async () => {
    const { orderId, action, appointment, reason } = pendingAction;
    setConfirmVisible(false);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${API_BASE_URL}/api/orders/${action === 'accepted' ? 'accept' : 'decline'}/${orderId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          action === 'accepted'
            ? { appointment }
            : { reason: reason || 'No reason provided' }
        ),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} order`);
      }

      const updatedOrder = await response.json();

      setOrders(prev =>
        prev.map(order => order.id === orderId ? updatedOrder.order : order)
      );

      setSuccessMessage(`تمت العملية بنجاح`);
      setIsSuccessModalVisible(true);
      setTimeout(() => setIsSuccessModalVisible(false), 2000);
      setDeclineReason('');
    } catch (error) {
      console.error(`Error ${action} order:`, error);
      alert(`Failed to ${action} order. Please try again.`);
    }
  };




  const handleOrderAction = (orderId, action) => {
    if (action === 'accepted') {
      setPendingAcceptId(orderId);
      setIsAppointmentModalVisible(true);
    } else {
      setPendingAction({ orderId, action });
      setIsDeclineModalVisible(true);  // show new modal instead of confirm directly
    }
  };




  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString(); // Date part
    const formattedTime = date.toLocaleTimeString(); // Time part
    return `${formattedDate} ${formattedTime}`;
  };


  const handleOrderPress = (customerId) => {
    navigation.navigate('UserProfile', { userId: customerId });
  };

  const handleCarPress = (car) => {
    setSelectedCar(car);
    setIsCarModalVisible(true);
  };

  const handleAddCar = () => {
    navigation.navigate('AddCar');
  };

  const handleAddService = () => {
    // Reset form when opening
    setNewService({
      name: '',
      price: '',
      description: '',
      image: null
    });
    setIsAddServiceModalVisible(true); // New modal state
  };;

  const handleDeleteCar = (carId) => {
    console.log('handleDeleteCar called with:', carId);

    const confirmDelete = async () => {
      try {
        setIsReady(false);

        const token = await AsyncStorage.getItem('userToken');
        if (!token) throw new Error('No token found');

        const response = await fetch(`${API_BASE_URL}/api/cars/delete/${carId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'فشل في حذف السيارة');
        }

        setUserCars(prevCars => prevCars.filter(car => car.id !== carId));
        setIsCarModalVisible(false);
        Alert.alert('تمت العملية بنجاح');
      } catch (error) {
        console.error('Error deleting car:', error);
        Alert.alert('خطأ', error.message || 'فشل في حذف السيارة, الرجاء المحاولة مجدداً');
      } finally {
        setIsReady(true);
      }
    };

    // Use Alert.alert on mobile, window.confirm on web
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('هل أنت متأكد من حذف هذه السيارة؟');
      if (confirmed) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'تأكيد الحذف',
        'هل أنت متأكد من حذف هذه السيارة؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'حذف', style: 'destructive', onPress: confirmDelete },
        ],
        { cancelable: true }
      );
    }
  };





  const handleServicePress = (service) => {
    setSelectedService(service);
    setIsServiceModalVisible(true);
  };

  const handleEditServicePress = (service) => {
    setEditedService({ ...service });
    setIsEditServiceModalVisible(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchUserData(); // Reuse the same fetch function
  };

  const handleSaveService = async () => {
    try {
      setIsReady(false)
      const token = await AsyncStorage.getItem('userToken');

      // Call API to update the service using the provider-specific endpoint
      const response = await fetch(`${API_BASE_URL}/api/providers/service/${editedService.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editedService.name,
          price: editedService.price,
          description: editedService.description
          // Include any other fields that need to be updated
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update service');
      }

      // Update local state
      setUserServices(userServices.map(s =>
        s.id === editedService.id ? editedService : s
      ));

      // Close modals and show success message
      setIsEditServiceModalVisible(false);
      setIsServiceModalVisible(false);
      setSuccessMessage('تم تعديل الخدمة بنجاح');
      setIsSuccessModalVisible(true);
      setTimeout(() => setIsSuccessModalVisible(false), 2000);
    } catch (error) {
      console.error("Error updating service:", error);
      Alert.alert("خطأ", error.message || "فشل في تعديل الخدمة, الرجاء المحاولة مرة أخرى");
    } finally {
      setIsReady(true)
    }
  };

  const handleSaveNewService = async () => {
    try {
      setIsDeleting(true);
      setIsReady(false)
      const token = await AsyncStorage.getItem('userToken');

      // Validate inputs
      if (!newService.name.trim()) throw new Error('اسم الخدمة مطلوب');
      const priceValue = parseFloat(newService.price.replace(/[^0-9.]/g, ''));
      if (isNaN(priceValue)) throw new Error('الرجاء إدخال سعر صحيح');

      // API call
      const response = await fetch(`${API_BASE_URL}/api/providers/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newService.name,
          price: priceValue,
          description: newService.description,
        })
      });

      if (!response.ok) throw new Error('فشل في إنشاء الخدمة');

      // Update state and close modal
      const result = await response.json();
      setUserServices(prev => [...prev, {
        id: result.id,
        name: newService.name,
        price: String(priceValue),
        description: newService.description,
        createdAt: result.createdAt || new Date().toISOString()
      }]);

      // Immediately close modal and reset form
      setIsAddServiceModalVisible(false);  // Immediately close modal
      setNewService({ name: '', price: '', description: '' });  // Reset form

      const servicesRes = await fetch(`${API_BASE_URL}/api/providers/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const servicesData = await servicesRes.json();
      setUserServices(servicesData.MyServices?.services || []);


    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsDeleting(false);
      setIsReady(true)
    }
  };

  const handleDeleteService = async (serviceId) => {
    setIsReady(false)
    setIsDeleting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const url = `${API_BASE_URL}/api/providers/service/delete/${serviceId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();

      // ✅ Update UI
      setUserServices(prev => prev.filter(service => service.id !== serviceId));
      setIsServiceModalVisible(false); // ✅ Close the modal after deletion
      Alert.alert('تم حذف الخدمة بنجاح'); // ✅ Show success after success
    } catch (error) {
      Alert.alert('خطأ', error.message);
    } finally {
      setIsDeleting(false);
      setIsReady(true)
    }
  };



  // Show loading state
  if (loading || !isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#e3711a" />
        <Text style={styles.loadingText}>جار التحميل...</Text>
      </View>
    );
  }

  // If no user data after loading (API might have failed)
  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>تعذر تحميل بيانات المستخدم</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.replace('Profile')}
        >
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.retryButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSuccessModalVisible}
        onRequestClose={() => setIsSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#e3711a" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Delete Order Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.serviceModalContainer}>
            <Text style={styles.modalTitle}>إلغاء الطلب</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>سبب الإلغاء</Text>
              <TextInput
                style={styles.textArea}
                placeholder="أدخل السبب ..."
                placeholderTextColor="#dddcd7aa"
                value={deleteReason}
                onChangeText={setDeleteReason}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleDeleteOrder}
              >
                <Text style={styles.modalButtonText}>تأكيد الإلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/*Decline Modal*/}
      <Modal
        transparent={true}
        visible={isDeclineModalVisible}
        onRequestClose={() => setIsDeclineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editServiceModalContainer}>
            <Text style={styles.modalTitle}>سبب رفض الطلب</Text>
            <TextInput
              style={styles.textArea}
              placeholder="أدخل سبب الرفض ..."
              placeholderTextColor="#aaa"
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDeclineModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  if (!declineReason.trim()) {
                    Alert.alert('Error', 'Please enter a reason.');
                    return;
                  }
                  setPendingAction(prev => ({
                    ...prev,
                    reason: declineReason
                  }));
                  setIsDeclineModalVisible(false);
                  setConfirmVisible(true);
                }}
              >
                <Text style={styles.modalButtonText}>متابعة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Service Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isServiceModalVisible}
        onRequestClose={() => setIsServiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.serviceModalContainer}>
            {selectedService && (
              <>
                <Text style={styles.serviceModalTitle}>{selectedService.name}</Text>
                <Text style={styles.serviceModalPrice}>${selectedService.price}</Text>

                <View style={styles.serviceDetailRow}>
                  <Ionicons name="time-outline" size={20} color="#dddcd7" />
                  <Text style={styles.serviceDetailText}>
                    تاريخ النشر: {selectedService.createdAt
                      ? new Date(selectedService.createdAt).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>

                <Text style={styles.serviceModalDescription}>{selectedService.description}</Text>

                <View style={styles.serviceModalActions}>
                  <TouchableOpacity
                    style={[styles.serviceModalButton, styles.editButton]}
                    onPress={() => handleEditServicePress(selectedService)}
                  >
                    <Ionicons name="create-outline" size={20} color="#133353" />
                    <Text style={styles.serviceModalButtonText}>تعديل</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={isDeleting}
                    onPress={() => handleDeleteService(selectedService.id)}
                    style={styles.deleteServiceButton}
                  >
                    {isDeleting ? (
                      <ActivityIndicator color="#133353" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={20} color="#133353" />
                        <Text style={styles.serviceModalButtonText}>حذف</Text>
                      </>
                    )}
                  </TouchableOpacity>

                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsServiceModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditServiceModalVisible}
        onRequestClose={() => setIsEditServiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editServiceModalContainer}>
            {editedService && (
              <>
                <Text style={styles.modalTitle}>تعديل الخدمة</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>اسم الخدمة</Text>
                  <TextInput
                    style={styles.input}
                    value={editedService.name}
                    onChangeText={(text) => setEditedService({ ...editedService, name: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>السعر ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(editedService.price)}
                    onChangeText={(text) => setEditedService({ ...editedService, price: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>التفاصيل</Text>
                  <TextInput
                    style={styles.textArea}
                    value={editedService.description}
                    onChangeText={(text) => setEditedService({ ...editedService, description: text })}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setIsEditServiceModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>إلغاء</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveService}
                  >
                    <Text style={styles.modalButtonText}>حفظ</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCarModalVisible}
        onRequestClose={() => setIsCarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.serviceModalContainer}>
            {selectedCar && (
              <>
                <Text style={styles.serviceModalTitle}>الموديل : {selectedCar.model || 'Unknown Model'}</Text>

                <Image
                  source={{
                    uri: selectedCar.image ? `${API_BASE_URL}${selectedCar.image}` : 'https://via.placeholder.com/400x300?text=No+Image'
                  }} style={[styles.itemImage, { width: '100%', height: 150, marginBottom: 10 }]}
                />

                <Text style={styles.serviceModalPrice}>
                  ${selectedCar.price?.toLocaleString() || 'N/A'}
                </Text>

                {/* Year */}
                <View style={styles.serviceDetailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#dddcd7" />
                  <Text style={styles.serviceDetailText}>السنة: {selectedCar.year || 'N/A'}</Text>
                </View>

                {/* Status */}
                <View style={styles.serviceDetailRow}>
                  <Ionicons name="car-outline" size={20} color="#dddcd7" />
                  <Text style={styles.serviceDetailText}>
                    الحالة: {selectedCar.used === true ? 'مستعمل' : 'جديد'}
                  </Text>
                </View>

                {/* Description (separate section for better spacing) */}
                <View style={[styles.serviceDetailRow, { marginTop: 10 }]}>
                  <Ionicons name="document-text-outline" size={20} color="#dddcd7" />
                  <Text style={[styles.serviceDetailText, { flex: 1 }]}>
                    {selectedCar.describtion || 'لا يوجد وصف'}
                  </Text>
                </View>
                <View style={styles.serviceDetailRow}>
                  <Ionicons name="time-outline" size={20} color="#dddcd7" />
                  <Text style={styles.serviceDetailText}>
                    تاريخ النشر: {selectedCar.createdAt
                      ? new Date(selectedCar.createdAt).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteCarButton}
                  onPress={(e) => {
                    handleDeleteCar(selectedCar.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#e3711a" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsCarModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>


      {/* Add Service Modal */}
      <Modal
        transparent={true}
        visible={isAddServiceModalVisible}
        onRequestClose={() => setIsAddServiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editServiceModalContainer}>
            <Text style={styles.modalTitle}>إضافة خدمة جديدة</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم الخدمة</Text>
              <TextInput
                style={styles.input}
                value={newService.name}
                onChangeText={(text) => setNewService(prev => ({ ...prev, name: text }))}
                placeholder="مثال: تغيير زيت"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>السعر</Text>
              <TextInput
                style={styles.input}
                value={newService.price}
                onChangeText={(text) => setNewService(prev => ({ ...prev, price: text }))}
                keyboardType="decimal-pad"
                placeholder="$"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>التفاصيل</Text>
              <TextInput
                style={styles.textArea}
                value={newService.description}
                onChangeText={(text) => setNewService(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                placeholder="تفاصيل الخدمة ..."
              />
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAddServiceModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveNewService}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>إضافة خدمة</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={isAppointmentModalVisible}
        onRequestClose={() => setIsAppointmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editServiceModalContainer}>
            <Text style={styles.modalTitle}>وقت وتاريخ الموعد</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: 14/4/2025 الساعة: 5:30"
              placeholderTextColor="#aaa"
              value={appointmentText}
              onChangeText={setAppointmentText}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAppointmentModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  if (!appointmentText.trim()) {
                    Alert.alert('خطأ', 'أدخل الموعد من فضلك');
                    return;
                  }
                  setPendingAction({
                    orderId: pendingAcceptId,
                    action: 'تم القبول',
                    appointment: appointmentText.trim()
                  });
                  setIsAppointmentModalVisible(false);
                  setConfirmVisible(true);
                }}
              >
                <Text style={styles.modalButtonText}>متابعة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      <View style={styles.profileHeader}>
        <Image
          source={
            user.vip
              ? { uri: 'https://cdn-icons-png.flaticon.com/512/6701/6701712.png' }
              : user.isprovider
                ? { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS5JKkEsOUjRTx488XWzep59wkmMOohNrLKQ&s' } // <- provider image
                : { uri: user.avatar || 'https://openclipart.org/image/2000px/247319' }
          }
          style={styles.profileImage}
        />

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{`${user.firstName} ${user.lastName}` || 'User'}</Text>
          <Text style={styles.userPhone}>{user.phoneNumber || 'لا يوجد رقم هاتف'}</Text>
        </View>
      </View>


      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'cars' && styles.activeTab]}
          onPress={() => setActiveTab('cars')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'cars' && styles.activeTabText]}>
            سياراتي ({userCars.length})
          </Text>
        </TouchableOpacity>
        {user.isprovider && (
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
              خدماتي  ({userServices.length})
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            الطلبات ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'cars' ? (
        <View style={styles.contentContainer}>
          {userCars && userCars.length > 0 ? (
            userCars.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={styles.itemCard}
                onPress={() => handleCarPress(car)}
              >
                <Image
                  source={{
                    uri: car.image ? `${API_BASE_URL}${car.image}` : 'https://via.placeholder.com/400x300?text=No+Image'
                  }} style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle}>{car.model || 'Unknown Model'}</Text>
                  <Text style={styles.itemSubtitle}>
                    {car.year || 'N/A'} • ${car.price ? car.price.toLocaleString() : 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={50} color="#dddcd7" />
              <Text style={styles.emptyText}>لا يوجد سيارات</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddCar}>
                <Text style={styles.addButtonText}>إضافة سيارة</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : activeTab === 'services' ? (
        <View style={styles.contentContainer}>
          {userServices && userServices.length > 0 ? (
            userServices.map((service) => {
              // Add proper null checks
              if (!service) return null;

              const price = service.price
                ? service.price.toString().replace(/\$/g, '').trim()
                : '0';

              return (
                <TouchableOpacity
                  key={service.id || Math.random().toString()}
                  style={styles.serviceCard}
                  onPress={() => service.id && handleServicePress(service)}
                  activeOpacity={0.8}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>
                      {service.name || 'Unnamed Service'}
                    </Text>
                    <Text style={styles.servicePrice}>
                      ${price}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={50} color="#dddcd7" />
              <Text style={styles.emptyText}>لا يوجد خدمات</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
                <Text style={styles.addButtonText}>أضف خدمتك الأولى</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {orders && orders.length > 0 ? (
            orders.filter(order => typeof order === 'object' && order !== null)
              .map((order, index) => {
                if (!order || typeof order !== 'object') return null;
                return (

                  <TouchableOpacity
                    key={order.id || index}
                    style={[
                      styles.orderCard,
                      order.status === 'accepted' && styles.orderAccepted,
                      order.status === 'declined' && styles.orderDeclined,
                      order.status === 'completed' && styles.orderCompleted
                    ]}
                    onPress={() => handleOrderPress(order.customer.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderTitle}>
                        {user.isprovider
                          ? (order.customer
                            ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`
                            : 'Customer')
                          : (order.provider
                            ? `${order.provider.firstName || ''} ${order.provider.lastName || ''}`
                            : 'Provider')}
                      </Text>
                      <Text style={[
                        styles.orderStatus,
                        order.status === 'accepted' && styles.statusAccepted,
                        order.status === 'declined' && styles.statusDeclined,
                        order.status === 'pending' && styles.statusPending
                      ]}>
                        {order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : 'Unknown'}
                      </Text>
                    </View>
                    <Text style={styles.orderService}>
                      {order.service ? order.service.name : 'Service'}
                    </Text>
                    <Text style={styles.orderDetails}>{order.CarModel || 'Unknown Car'}</Text>
                    {order.status === 'declined' && order.declineReason && (
                      <Text style={styles.orderDetails}>
                        ❌ السبب: {order.declineReason}
                      </Text>
                    )}
                    {order.service && order.service.price && (
                      <>
                        <Text style={styles.orderDetails}>
                          ${order.service.price} • {formatDate(order.date || order.createdAt) || 'Recent'}
                        </Text>
                        {order.appointment && (
                          <Text style={styles.orderDetails}>
                            📅 الموعد: {order.appointment}
                          </Text>
                        )}
                      </>
                    )}



                    {!user.isprovider & order.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => {
                          setSelectedOrderId(order.id);
                          setIsDeleteModalVisible(true);
                        }}
                      >
                        <Text style={styles.actionButtonText}>إلغاء الطلب</Text>
                      </TouchableOpacity>
                    )}

                    {user.isprovider && order.status === 'pending' && (

                      <View style={styles.orderActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleOrderAction(order.id, 'accepted')}
                        >
                          <Text style={styles.actionButtonText}>قبول</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.declineButton]}
                          onPress={() => handleOrderAction(order.id, 'declined')}
                        >
                          <Text style={styles.actionButtonText}>رفض</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={50} color="#dddcd7" />
              <Text style={styles.emptyText}>لا يوجد طلبات</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
      </TouchableOpacity>
      {user.isprovider && userServices.length > 0 && (
        <FloatingAction
          position="right"
          color="#e3711a"
          actions={[{
            text: "إضافة خدمة",
            icon: <Ionicons name="add" size={24} color="white" />,
            name: "add_service",
          }]}
          onPressItem={handleAddService}
        />
      )}
      <Modal
        transparent={true}
        visible={confirmVisible}
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editServiceModalContainer}>
            <Text style={styles.modalTitle}>تأكيد الإجراء</Text>
            <Text style={{ color: '#dddcd7', fontSize: 16, textAlign: 'center', marginTop: 10 }}>
              هل أنت متأكد أنك تريد <Text style={{ color: '#e3711a', fontWeight: 'bold' }}>{pendingAction.action}</Text>  هذا الطلب؟
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalButtonText}>لا</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={performOrderAction}
              >
                <Text style={styles.modalButtonText}>نعم</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    minHeight: '100%',           // ✅ avoid sudden shrink
    flex: 1,
    backgroundColor: '#133353',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(227, 113, 26, 0.1)',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#dddcd7',
  },
  userEmail: {
    fontSize: 14,
    color: '#dddcd7aa',
    marginBottom: 3,
  },
  userPhone: {
    fontSize: 14,
    color: '#dddcd7aa',
  },
  providerContainer: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    padding: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e3711a55',
  },
  providerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerDetailText: {
    marginLeft: 10,
    color: '#dddcd7',
    fontSize: 15,
  },
  editButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e3711a55',
  },
  tabButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#e3711a',
  },
  tabText: {
    fontSize: 16,
    color: '#dddcd7aa',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#dddcd7',
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    padding: 15,
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.2)',
  },
  itemImage: {
    width: 70,
    height: 50,
    marginRight: 15,
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 3,
    color: '#dddcd7',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#dddcd7aa',
    marginBottom: 3,
  },
  itemMileage: {
    fontSize: 13,
    color: '#dddcd777',
  },
  deleteCarButton: {
    padding: 8,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.2)',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#dddcd7',
    marginBottom: 3,
  },
  servicePrice: {
    fontSize: 16,
    color: '#e3711a',
    fontWeight: '600',
  },
  serviceActions: {
    flexDirection: 'row',
  },
  serviceButton: {
    paddingHorizontal: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#dddcd7aa',
    marginVertical: 15,
  },
  addButton: {
    backgroundColor: '#e3711a',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#133353',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3711a',
  },
  logoutButtonText: {
    color: '#e3711a',
    fontWeight: '600',
    fontSize: 16,
  },
  orderCard: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#dddcd755',
  },
  orderAccepted: {
    borderLeftColor: '#e3711a',
  },
  orderDeclined: {
    borderLeftColor: '#dddcd7aa',
  },
  orderCompleted: {
    borderLeftColor: '#dddcd7',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  orderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#dddcd7',
  },
  orderStatus: {
    fontSize: 14,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  statusAccepted: {
    color: '#e3711a',
  },
  statusDeclined: {
    color: '#dddcd7aa',
  },
  statusCompleted: {
    color: '#dddcd7',
  },
  statusPending: {
    color: '#dddcd7',
  },
  orderService: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dddcd7',
    marginBottom: 3,
  },
  orderDetails: {
    fontSize: 14,
    color: '#dddcd7aa',
    marginBottom: 3,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: 'rgba(227, 113, 26, 0.2)',
    borderWidth: 1,
    borderColor: '#e3711a',
  },
  declineButton: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderWidth: 1,
    borderColor: '#dddcd755',
  },
  actionButtonText: {
    fontWeight: '600',
    color: '#dddcd7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 51, 83, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    backgroundColor: '#133353',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e3711a',
    width: '80%',
  },
  successIconContainer: {
    marginBottom: 15,
  },
  successText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    color: '#dddcd7',
  },
  serviceModalContainer: {
    backgroundColor: '#133353',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  serviceModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#dddcd7',
  },
  serviceModalPrice: {
    fontSize: 20,
    color: '#e3711a',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  serviceModalDescription: {
    fontSize: 16,
    color: '#dddcd7aa',
    marginVertical: 15,
    lineHeight: 24,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceDetailText: {
    fontSize: 16,
    color: '#dddcd7',
    marginLeft: 10,
  },
  serviceModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  serviceModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 5,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
  },
  serviceModalButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#dddcd7',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(227, 113, 26, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3711a',
  },
  closeButtonText: {
    color: '#dddcd7',
    fontWeight: '600',
  },
  editServiceModalContainer: {
    backgroundColor: '#133353',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#dddcd7',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#dddcd7',
  },
  input: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3711a55',
    fontSize: 16,
    color: '#dddcd7',
  },
  textArea: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3711a55',
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    color: '#dddcd7',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderWidth: 1,
    borderColor: '#dddcd755',
  },
  saveButton: {
    backgroundColor: '#e3711a',
  },
  modalButtonText: {
    fontWeight: '600',
    color: '#133353',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#133353',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#e3711a',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  closeSuccessButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e3711a',
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  webOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 51, 83, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  webSuccessBox: {
    backgroundColor: '#133353',
    padding: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e3711a',
    alignItems: 'center',
  },
  deleteServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(227, 113, 26, 0.2)', // light orange transparent
    borderWidth: 1,
    borderColor: '#e3711a',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  // Add to your styles:
  deleteButton: {
    backgroundColor: 'rgba(204, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#cc0000',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align to right for single button
    marginTop: 10,
  },
});