import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../../languageContext';

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
    padding: 10,
    marginRight: 15,
  },
  languageButtonText: {
    color: '#4a6fa5',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LanguageToggle;