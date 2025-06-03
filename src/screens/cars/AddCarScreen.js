import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { I18nManager } from 'react-native';
import API_BASE_URL from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image, Linking, Modal, ActivityIndicator } from 'react-native';


I18nManager.forceRTL(true);

export default function AddCarScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    model: '',
    year: '',
    used: true,
    describtion: '',
    price: '',
  });
  const [image, setImage] = useState(null);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]); // image.uri
    }
  };

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { model, year, describtion, price } = form;

    if (!model.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الموديل');
      return false;
    }

    if (!year.trim() || isNaN(year)) {
      Alert.alert('خطأ', 'يرجى إدخال سنة صحيحة');
      return false;
    }

    if (!describtion.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال وصف السيارة');
      return false;
    }

    if (!price.trim() || isNaN(price)) {
      Alert.alert('خطأ', 'يرجى إدخال سعر صحيح (أرقام فقط)');
      return false;
    }

    return true;
  };


  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true); // ⬅️ Start loading

    const token = await AsyncStorage.getItem('userToken');
    const formData = new FormData();

    formData.append('model', form.model);
    formData.append('year', form.year);
    formData.append('used', form.used);
    formData.append('describtion', form.describtion);
    formData.append('price', form.price);

    if (image) {
      const blob = await fetch(image.uri).then(r => r.blob());
      formData.append('image', blob, `car-image-${Date.now()}.png`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/cars/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.status === 403) {
        setLimitModalVisible(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'فشل في إضافة السيارة');
      }

      console.log('Server response:', data);
      navigation.goBack();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ ما');
    } finally {
      setIsLoading(false); // ⬅️ Stop loading
    }
  };



  const handlePress = () => {
    console.log("Button pressed, starting submit");
    handleSubmit().catch(e => console.error("Uncaught error:", e));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <Modal
        transparent={true}
        visible={limitModalVisible}
        onRequestClose={() => setLimitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editServiceModalContainer}>
            <Text style={styles.modalTitle}>تم الوصول إلى الحد المسموح</Text>
            <Text style={styles.serviceModalDescription}>
            يُسمح لك بإضافة سيارة واحدة فقط. لإضافة عدد غير محدود من السيارات، يمكنك الاشتراك في VIP.
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#e3711a' }]}
                onPress={() => setLimitModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#dddcd7' }]}
                onPress={() => {
                  Linking.openURL('https://wa.me/963983590892?text=أريد الاشتراك بخدمة vip,%20I%20want%20to%20subscribe%20to%20VIP%20to%20add%20unlimited%20cars.');
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#133353' }]}>اشترك في خدمة VIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      <View style={{ flex: 1 }}>

        <Text style={styles.title}>إضافة سيارة جديدة</Text>

        <Text style={styles.inputLabel}>الموديل</Text>
        <TextInput
          style={styles.input}
          placeholder="مارسيدس , كيا..."
          placeholderTextColor="#dddcd7aa"
          value={form.model}
          onChangeText={(text) => handleChange('model', text)}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />

        <Text style={styles.inputLabel}>السنة</Text>
        <TextInput
          style={styles.input}
          placeholder="سنة التصنيع"
          placeholderTextColor="#dddcd7aa"
          value={form.year}
          onChangeText={(text) => handleChange('year', text)}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />

        <Text style={styles.inputLabel}>الحالة</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              form.used === false && styles.activeToggleButton
            ]}
            onPress={() => handleChange('used', false)}
          >
            <Text style={[
              styles.toggleButtonText,
              form.used === false && styles.activeToggleButtonText
            ]}>
              جديدة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              form.used === true && styles.activeToggleButton
            ]}
            onPress={() => handleChange('used', true)}
          >
            <Text style={[
              styles.toggleButtonText,
              form.used === true && styles.activeToggleButtonText
            ]}>
              مستعملة
            </Text>
          </TouchableOpacity>
        </View>

        {/* Move the image picker below the toggle container */}
        <TouchableOpacity
          onPress={pickImage}
          style={styles.imagePickerButton}
        >
          {image ? (
            <Image
              source={{ uri: image.uri }}
              style={styles.selectedImage}
            />
          ) : (
            <View style={styles.imagePickerContent}>
              <Text style={styles.imagePickerText}>اختر صورة السيارة</Text>
              <Text style={styles.imagePickerSubText}>انقر لاختيار صورة</Text>
            </View>
          )}
        </TouchableOpacity>

        {image && (
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.removeImageText}>إزالة الصورة</Text>
          </TouchableOpacity>
        )}



        <Text style={styles.inputLabel}>الوصف</Text>
        <TextInput
          style={styles.input}
          placeholder="وصف السيارة"
          placeholderTextColor="#dddcd7aa"
          value={form.describtion}
          onChangeText={(text) => handleChange('describtion', text)}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />

        <Text style={styles.inputLabel}>السعر</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل السعر"
          placeholderTextColor="#dddcd7aa"
          value={form.price}
          keyboardType='numeric'
          onChangeText={(text) => {
            const numericValue = text.replace(/[^0-9]/g, '');
            handleChange('price', numericValue);
          }}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />


        <TouchableOpacity
          style={styles.submitButton}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>حفظ السيارة</Text>
        </TouchableOpacity>
        {isLoading && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#e3711a" />
            <Text style={{ color: '#dddcd7', marginTop: 10 }}>جارٍ حفظ السيارة...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#133353',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#e3711a',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e3711a',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dddcd7',
    marginBottom: 8,
    marginRight: 5,
  },
  input: {
    height: 50,
    borderColor: '#e3711a',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    color: '#dddcd7',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#e3711a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  submitButtonText: {
    color: '#133353',
    fontWeight: '700',
    fontSize: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },

  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3711a',
    alignItems: 'center',
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
  },

  activeToggleButton: {
    backgroundColor: '#e3711a',
  },

  toggleButtonText: {
    color: '#dddcd7',
    fontWeight: '600',
    fontSize: 16,
  },

  activeToggleButtonText: {
    color: '#133353',
  },
  imagePickerButton: {
    height: 150,
    borderWidth: 2,
    borderColor: '#e3711a',
    borderRadius: 8,
    backgroundColor: 'rgba(221, 220, 215, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10, // 👈 Add this line if you want spacing
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerContent: {
    alignItems: 'center',
    padding: 10,
  },
  imagePickerText: {
    color: '#e3711a',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  imagePickerSubText: {
    color: '#dddcd7',
    fontSize: 12,
  },
  removeImageButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: -15,
    marginBottom: 15,
    zIndex: 1,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 12,
  },
  modalButtonText: {
    fontWeight: '600',
    color: '#133353',
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
  }, editServiceModalContainer: {
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
  }, serviceModalActions: {
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
  }, serviceModalContainer: {
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
});