import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from './languageContext';

const LanguageToggle = () => {
  const { isArabic, toggleLanguage } = useLanguage();

  return (
    <TouchableOpacity 
      style={styles.languageButton} 
      onPress={toggleLanguage}
    >
      <Text style={styles.languageButtonText}>
        {isArabic ? 'English' : 'عربي'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  languageButtonText: {
    color: '#4a6fa5',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LanguageToggle;