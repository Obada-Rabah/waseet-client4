import {React, useEffect, useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
   ImageBackground, I18nManager, ActivityIndicator,
  Platform,
 } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import API_BASE_URL from '../../config'
import AsyncStorage from '@react-native-async-storage/async-storage';



// Force RTL layout
I18nManager.forceRTL(true);

const LoginSchema = Yup.object().shape({
  phoneNumber: Yup.string().required('رقم الهاتف مطلوب'),
  password: Yup.string().required('كلمة المرور مطلوبة'),
});

export default function LoginScreen({ navigation }) {
  const translations = {
    welcome: 'مرحباً بعودتك',
    phoneNumber: 'رقم الهاتف',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    registerPrompt: 'ليس لديك حساب؟ سجل الآن'
  };

  const showAlert = (title, message) => {
      if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
      } else {
        Alert.alert(title, message);
      }
    };

  const handleLogin = async (values) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        phoneNumber: values.phoneNumber,
        password: values.password,
      });
  
      const { token } = response.data;
  
      await AsyncStorage.setItem('userToken', token);
  
      navigation.navigate('Main');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      showAlert('خطأ', 'فشل تسجيل الدخول. تأكد من المعلومات.');
    }
  };
  

  return (
    <ImageBackground 
      source={require('../../../assets/logo.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{translations.welcome}</Text>
          
          <View style={[styles.card, { direction: 'rtl' }]}>
            <Formik
              initialValues={{ phoneNumber: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid }) => (
                <View style={styles.form}>
                  <TextInput
                    style={[styles.input, { textAlign: 'right' }]}
                    placeholder={translations.phoneNumber}
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    onChangeText={handleChange('phoneNumber')}
                    onBlur={handleBlur('phoneNumber')}
                    value={values.phoneNumber}
                    autoCapitalize="none"
                  />
                  {touched.phoneNumber && errors.phoneNumber && (
                    <Text style={styles.error}>{errors.phoneNumber}</Text>
                  )}

                  <TextInput
                    style={[styles.input, { textAlign: 'right' }]}
                    placeholder={translations.password}
                    placeholderTextColor="#999"
                    secureTextEntry
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.error}>{errors.password}</Text>
                  )}

                  <TouchableOpacity 
                    style={[styles.button, !isValid && styles.buttonDisabled]} 
                    onPress={handleSubmit}
                    disabled={!isValid}
                  >
                    <Text style={styles.buttonText}>{translations.login}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.registerButton}
                    onPress={() => navigation.navigate('Register')}
                  >
                    <Text style={styles.registerText}>{translations.registerPrompt}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </View>
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
    justifyContent: 'center',
  },
  container: {
    flex: 1,
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
  registerButton: {
    marginTop: 20,
    padding: 10,
  },
  registerText: {
    textAlign: 'center',
    color: '#4a6fa5',
    fontSize: 16,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
});