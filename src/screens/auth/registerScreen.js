import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
   ScrollView, Alert, ImageBackground, I18nManager,
  Platform
 } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Linking } from 'react-native';
import API_BASE_URL from '../../config'



// Force RTL layout
I18nManager.forceRTL(true);

const RegisterSchema = Yup.object().shape({
  firstName: Yup.string().required('الاسم الأول مطلوب'),
  lastName: Yup.string().required('الاسم الأخير مطلوب'),
  password: Yup.string().min(6, 'كلمة المرور قصيرة جدًا').required('كلمة المرور مطلوبة'),
  phone: Yup.string().matches(/^[0-9]{10}$/, 'رقم الهاتف غير صالح'),
});

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [isProvider, setIsProvider] = useState(false);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const translations = {
    title: 'إنشاء حساب',
    firstName: 'الاسم الأول',
    lastName: 'الاسم الأخير',
    password: 'كلمة المرور',
    phone: 'رقم الهاتف',
    serviceProvider: 'هل أنا مقدم خدمة؟',
    contactUs: 'يرجى التواصل معنا للتسجيل',
    register: 'تسجيل',
    loginPrompt: 'لديك حساب بالفعل؟ تسجيل الدخول',
    yes: 'نعم',
    no: 'لا'
  };


  const handleRegister = async (values) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
        phoneNumber: values.phone,
      });

      if (response.status === 201 || response.status === 200) {
        showAlert('نجاح', 'تم إنشاء الحساب بنجاح');
        navigation.navigate('Login');
      } else {
        showAlert('خطأ', 'فشل في إنشاء الحساب');
      }
    } catch (error) {
      let errorMessage = 'فشل في التسجيل، حدث خطأ غير متوقع';

      if (error.response) {
        console.log('Backend Error Response:', error.response.data); // ✅ log everything
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        console.log('No response received:', error.request);
      } else {
        console.log('Request setup error:', error.message);
      }

      showAlert('خطأ', errorMessage);
    }
  };



  return (
    <ImageBackground
      source={require('../../../assets/logo.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{translations.title}</Text>

          <View style={styles.card}>
            <Formik
              initialValues={{ firstName: '', lastName: '', password: '', phone: '' }}
              validationSchema={RegisterSchema}
              onSubmit={handleRegister}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    placeholder={translations.firstName}
                    placeholderTextColor="#999"
                    onChangeText={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    value={values.firstName}
                  />
                  {touched.firstName && errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}

                  <TextInput
                    style={styles.input}
                    placeholder={translations.lastName}
                    placeholderTextColor="#999"
                    onChangeText={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    value={values.lastName}
                  />
                  {touched.lastName && errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}

                  <TextInput
                    style={styles.input}
                    placeholder={translations.password}
                    placeholderTextColor="#999"
                    secureTextEntry
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                  />
                  {touched.password && errors.password && <Text style={styles.error}>{errors.password}</Text>}

                  <TextInput
                    style={styles.input}
                    placeholder={translations.phone}
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    onChangeText={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                    value={values.phone}
                  />
                  {touched.phone && errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>{translations.serviceProvider}</Text>
                    <TouchableOpacity
                      style={[styles.switch, isProvider ? styles.switchActive : styles.switchInactive]}
                      onPress={() => setIsProvider(!isProvider)}
                    >
                      <Text style={styles.switchText}>{isProvider ? translations.yes : translations.no}</Text>
                    </TouchableOpacity>
                  </View>

                  {isProvider ? (
                    <>
                      <Text style={styles.contactText}>{translations.contactUs}</Text>
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => {
                          const phone = '+963983590892'; // replace with your WhatsApp number (no '+' or spaces)
                          const message = 'مرحبًا، أود التسجيل كمقدم خدمة.'; // your message
                          const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                          Linking.openURL(url).catch(err => console.error('WhatsApp error', err));
                        }}
                      >
                        <Text style={styles.whatsappText}>تواصل معنا عبر واتساب</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                      <Text style={styles.buttonText}>{translations.register}</Text>
                    </TouchableOpacity>
                  )}


                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.loginText}>{translations.loginPrompt}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flexGrow: 1,
    padding: 30,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    writingDirection: 'rtl',
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  error: {
    color: '#e74c3c',
    marginBottom: 10,
    fontSize: 14,
    marginRight: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  switchContainer: {
    flexDirection: 'row-reverse', // Reversed for RTL
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  switchLabel: {
    fontSize: 16,
    color: '#2c3e50',
    writingDirection: 'rtl',
  },
  switch: {
    padding: 12,
    borderRadius: 20,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#4a6fa5',
  },
  switchInactive: {
    backgroundColor: '#bdc3c7',
  },
  switchText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    writingDirection: 'rtl',
  },
  contactText: {
    marginVertical: 15,
    color: '#7f8c8d',
    textAlign: 'right',
    lineHeight: 24,
    paddingHorizontal: 20,
    writingDirection: 'rtl',
  },
  button: {
    backgroundColor: '#4a6fa5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4a6fa5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  loginButton: {
    marginTop: 20,
    padding: 10,
  },
  loginText: {
    textAlign: 'center',
    color: '#4a6fa5',
    fontSize: 16,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  whatsappButton: {
    marginTop: 10,
    backgroundColor: '#25D366',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  whatsappText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },

});