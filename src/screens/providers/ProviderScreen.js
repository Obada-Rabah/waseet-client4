import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';


export default function ProviderScreen({ route, navigation }) {
  const { providerId } = route.params;
  const [selectedService, setSelectedService] = useState(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('user');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');


  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken')
        const response = await fetch(`${API_BASE_URL}/api/auth/user/${providerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch provider data');
        }
        const data = await response.json();
        setProvider(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [providerId]);

  const handleOrderPress = (service) => {
    setSelectedService(service);
    setIsModalVisible(true);
  };

  const fetchServiceDetails = async (serviceId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        `${API_BASE_URL}/api/providers/service/${serviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch sigma service');
      return await response.json(); // Returns { name, price, image, description }
    } catch (err) {
      console.error("Sigma fetch error:", err);
      throw err; // Throw it like you throw weak code out the window
    }
  };

  // Updated showServiceDescription with BEAST MODE fetching
  const showServiceDescription = async (service) => {
    try {
      setIsDescriptionModalVisible(false); // Close immediately to show loading

      // Sigma move: Parallel fetch while showing cached data
      const [freshService] = await Promise.all([
        fetchServiceDetails(service.id),
        new Promise(resolve => setTimeout(resolve, 300)) // Artificial delay for dramatic effect
      ]);

      setSelectedService({
        ...service, // Fallback to cached data if needed
        ...freshService // Override with fresh sigma data
      });

      setIsDescriptionModalVisible(true);
    } catch (err) {
      // Still show modal with cached data if fetch fails
      setSelectedService(service);
      setIsDescriptionModalVisible(true);
      Alert.alert("تحذير", "يتم استخدام بيانات قديمة بسبب ضعف الشبكة, تحقق من وجود اتصال انترنت جيد");
    }
  };

  const confirmOrder = async () => {
    setIsSubmitting(true)
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        `${API_BASE_URL}/api/orders/add/${selectedService.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            CarModel: orderNotes, // Using orderNotes as carModel
            // Add any other required fields here
          }),
        }
      );

      if (!response.ok) {
        throw new Error('خطأ في إنشاء الطلب');
      }

      const result = await response.json();
      console.log('Order created:', result);

      // Show success and reset
      setIsModalVisible(false);
      setOrderNotes('');
      setIsSuccessModalVisible(true);

      setTimeout(() => {
        setIsSuccessModalVisible(false);
      }, 3000);

    } catch (err) {
      console.error('Order error:', err);
      Alert.alert('خطأ', 'فشل إرسال الطلب, الرجاء إعادة المحاولة');
    } finally {
      setIsSubmitting(false)
    }
  };

  const handleReport = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token found');

      const res = await fetch(`${API_BASE_URL}/api/report/add/${providerId}`, {
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
      Alert.alert('تم الإبلاغ عن مزود الخدمة بنجاح');
      setIsReportModalVisible(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error reporting user:', error);
      Alert.alert('خطأ', 'حدث خطأ في إرسال الإبلاغ');
    }
  };


  const openChat = () => {
    navigation.navigate('Chat', {
      recipientId: provider.id,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#e3711a" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>خطأ: {error}</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>لم يتم العثور على مزود الخدمة</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Provider Header */}
      <View style={styles.header}>
        <Image source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS5JKkEsOUjRTx488XWzep59wkmMOohNrLKQ&s' }} style={styles.providerImage} />
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.providerName}>{provider.firstName} {provider.lastName}</Text>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={openChat}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#133353" />
              <Text style={styles.chatButtonText}>تواصل مع مزود الخدمة</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setIsReportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={16} color="white" />
            <Text style={styles.reportButtonText}>الإبلاغ عن مزود الخدمة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Provider Info */}

      {provider.location && (
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#dddcd7" />
          <Text style={styles.infoText}>{provider.location}</Text>
        </View>
      )}

      {provider.phoneNumber && (
        <View style={styles.infoRow}>
          <Ionicons name="call" size={20} color="#dddcd7" />
          <Text style={styles.infoText}>{provider.phoneNumber}</Text>
        </View>
      )}

      {/* Services List */}
      {provider.services && provider.services.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الخدمات والأسعار</Text>
          {provider.services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => showServiceDescription(service)}
              activeOpacity={0.8}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
              </View>
              <View style={styles.serviceAction}>
                {service.price && (
                  <Text style={styles.servicePrice}>${service.price}</Text>
                )}
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleOrderPress(service);
                  }}
                >
                  <Text style={styles.orderButtonText}>اطلب</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Service Description Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDescriptionModalVisible}
        onRequestClose={() => setIsDescriptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.descriptionModalContainer}>
            {selectedService && (
              <>
                <Text style={styles.modalTitle}>{selectedService.name}</Text>
                {selectedService.description && (
                  <Text style={styles.serviceDescription}>
                    {selectedService.description}
                  </Text>
                )}
                <View style={styles.serviceDetails}>
                  {selectedService.price && (
                    <Text style={styles.detailText}>السعر: ${selectedService.price}</Text>
                  )}
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.closeButton]}
                    onPress={() => setIsDescriptionModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.orderModalButton]}
                    onPress={() => {
                      setIsDescriptionModalVisible(false);
                      handleOrderPress(selectedService);
                    }}
                  >
                    <Text style={styles.orderButtonText}>اطلب الآن</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isReportModalVisible}
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={styles.reportModalContainer}>
            <Text style={styles.modalTitle}>الإبلاغ عن مزود الخدمة</Text>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={reportType}
                onValueChange={(itemValue) => setReportType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="المزود" value="user" />
                <Picker.Item label="الخدمات" value="car" />
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

        </View>
      </Modal>

      {/* Order Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>تأكيد الطلب</Text>

            {selectedService && (
              <View style={styles.serviceSummary}>
                <Text style={styles.serviceSummaryName}>{selectedService.name}</Text>
                <Text style={styles.serviceDescription}>{selectedService.description}</Text>
                {selectedService.price && (
                  <Text style={styles.serviceSummaryPrice}>${selectedService.price}</Text>
                )}
              </View>
            )}

            <Text style={styles.notesLabel}>أدخل موديل سيارتك</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="مثال: تويوتا كامري 2009"
              placeholderTextColor="#dddcd7aa"
              value={orderNotes}
              onChangeText={setOrderNotes}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#133353" />
                ) : (
                  <Text style={styles.confirmButtonText}>تأكيد الطلب</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSuccessModalVisible}
        onRequestClose={() => setIsSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#e3711a" />
            </View>
            <Text style={styles.successText}>تم إرسال الطلب بنجاح</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#133353',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.2)',
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  headerInfo: {
    flex: 1,
  },
  reportButton: {
    flexDirection: 'row',
    backgroundColor: '#cc0000',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  reportButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  providerImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  providerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dddcd7',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#dddcd7',
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#e3711a',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '80%',
  },
  chatButtonText: {
    color: '#133353',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(227, 113, 26, 0.2)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e3711a',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
    paddingBottom: 5,
  },
  description: {
    fontSize: 15,
    color: '#dddcd7',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#dddcd7',
    flex: 1,
  },
  serviceCard: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  serviceDuration: {
    fontSize: 13,
    color: '#dddcd7aa',
    marginTop: 3,
  },
  serviceAction: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e3711a',
    marginBottom: 8,
  },
  orderButton: {
    backgroundColor: '#e3711a',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  orderButtonText: {
    color: '#133353',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 51, 83, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionModalContainer: {
    backgroundColor: '#133353',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  modalContainer: {
    backgroundColor: '#133353',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    color: '#dddcd7',
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 16,
    color: '#dddcd7',
    lineHeight: 24,
    marginVertical: 15,
  },
  serviceDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(221, 220, 215, 0.2)',
  },
  detailText: {
    fontSize: 15,
    color: '#dddcd7',
    marginBottom: 8,
  },
  serviceSummary: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221, 220, 215, 0.2)',
  },
  serviceSummaryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dddcd7',
  },
  serviceSummaryPrice: {
    fontSize: 17,
    color: '#e3711a',
    marginVertical: 5,
    fontWeight: '700',
  },
  serviceSummaryDuration: {
    fontSize: 15,
    color: '#dddcd7aa',
  },
  notesLabel: {
    fontSize: 15,
    color: '#dddcd7',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e3711a55',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    color: '#dddcd7',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  closeButton: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderWidth: 1,
    borderColor: '#dddcd755',
  },
  orderModalButton: {
    backgroundColor: '#e3711a',
  },
  cancelButton: {
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    borderWidth: 1,
    borderColor: '#dddcd755',
  },
  confirmButton: {
    backgroundColor: '#e3711a',
  },
  closeButtonText: {
    color: '#dddcd7',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#dddcd7',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#133353',
    fontWeight: '600',
  },
  successModalContainer: {
    backgroundColor: '#133353',
    borderRadius: 15,
    padding: 30,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e3711a',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dddcd7',
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
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