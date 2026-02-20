import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Dimensions, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header — fixed so logo doesn't hide under status bar */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Ionicons name="document-text" size={28} color="white" />
          </View>
          <View>
            <Text style={styles.appName}>NoteLens</Text>
            <Text style={styles.appTagline}>Handwritten notes → Digital PDF</Text>
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroIconRow}>
          <View style={styles.heroIconBox}>
            <Ionicons name="camera" size={28} color="#1a73e8" />
          </View>
          <Ionicons name="arrow-forward" size={20} color="#ccc" />
          <View style={styles.heroIconBox}>
            <Ionicons name="text" size={28} color="#1a73e8" />
          </View>
          <Ionicons name="arrow-forward" size={20} color="#ccc" />
          <View style={styles.heroIconBox}>
            <Ionicons name="document" size={28} color="#1a73e8" />
          </View>
        </View>
        <Text style={styles.heroTitle}>
          Photograph your notes.{'\n'}Get a digital PDF instantly.
        </Text>
        <Text style={styles.heroSubtitle}>
          Point your camera at any handwritten or printed notes and we'll convert them into a clean, shareable PDF in seconds.
        </Text>
      </View>

      {/* How it works */}
      <View style={styles.steps}>
        <Step number="1" icon="camera-outline" text="Take a photo of your handwritten notes" />
        <Step number="2" icon="eye-outline" text="AI reads and digitizes your handwriting" />
        <Step number="3" icon="document-text-outline" text="Download your clean PDF instantly" />
      </View>

      {/* CTA */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Scan')}>
          <Ionicons name="camera" size={22} color="white" />
          <Text style={styles.primaryBtnText}>Convert Notes to PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('History')}>
          <Ionicons name="document-text-outline" size={20} color="#1a73e8" />
          <Text style={styles.outlineBtnText}>View My PDFs</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const Step = ({ number, icon, text }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepNum}>
      <Text style={styles.stepNumText}>{number}</Text>
    </View>
    <View style={styles.stepIconBox}>
      <Ionicons name={icon} size={20} color="#1a73e8" />
    </View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
 header: {
    paddingHorizontal: 20,
    paddingTop: (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center'
  },
  appName: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  appTagline: { fontSize: 12, color: '#888', marginTop: 1 },

  // Hero
  hero: {
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20, alignItems: 'center'
  },
  heroIconRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20
  },
  heroIconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center'
  },
  heroTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#1a1a1a',
    textAlign: 'center', lineHeight: 30, marginBottom: 10
  },
  heroSubtitle: {
    fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 21
  },

  // Steps
  steps: {
    paddingHorizontal: 20, gap: 14, paddingVertical: 8
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14
  },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center'
  },
  stepNumText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  stepIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center'
  },
  stepText: { flex: 1, fontSize: 13, color: '#444', lineHeight: 18 },

  // Actions
  actions: { padding: 20, gap: 12, marginTop: 'auto' },
  primaryBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, backgroundColor: '#1a73e8', borderRadius: 14, padding: 16
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  outlineBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, borderWidth: 2, borderColor: '#1a73e8', borderRadius: 14, padding: 14
  },
  outlineBtnText: { color: '#1a73e8', fontSize: 15, fontWeight: 'bold' }
});