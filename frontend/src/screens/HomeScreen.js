import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, Dimensions, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Feature = ({ icon, title, desc }) => (
  <View style={styles.feature}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={22} color="#1a73e8" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Ionicons name="scan" size={32} color="white" />
          </View>
          <View>
            <Text style={styles.appName}>TextLens</Text>
            <Text style={styles.appTagline}>Handwriting → Digital PDF</Text>
          </View>
        </View>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroCard}>
          <Ionicons name="eye" size={60} color="#1a73e8" />
          <Text style={styles.heroTitle}>Like Google Lens,{'\n'}But for Documents</Text>
          <Text style={styles.heroText}>
            Point your camera at any handwritten or printed text and instantly convert it to a searchable, shareable PDF.
          </Text>
        </View>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Feature icon="camera" title="Instant Camera Scan" desc="Capture text from any angle in real-time" />
        <Feature icon="text" title="Smart OCR Engine" desc="Powered by Tesseract.js for high accuracy" />
        <Feature icon="document" title="Beautiful PDF Output" desc="Clean, formatted PDFs with embedded original" />
        <Feature icon="cloud-upload" title="Cloud Storage" desc="All scans saved securely in MongoDB" />
      </View>

      {/* CTA Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('Scan')}>
          <Ionicons name="camera" size={22} color="white" />
          <Text style={styles.scanBtnText}>Start Scanning</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('History')}>
          <Ionicons name="document-text" size={22} color="#1a73e8" />
          <Text style={styles.historyBtnText}>View Documents</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: '#1a73e8',
    justifyContent: 'center', alignItems: 'center'
  },
  appName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  appTagline: { fontSize: 12, color: '#888', marginTop: 1 },
  hero: { paddingHorizontal: 20, paddingTop: 20 },
  heroCard: {
    backgroundColor: '#e8f0fe', borderRadius: 20, padding: 24,
    alignItems: 'center'
  },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginTop: 12, textAlign: 'center', lineHeight: 28 },
  heroText: { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  features: { padding: 20, gap: 12 },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#e8f0fe',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0
  },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  featureDesc: { fontSize: 12, color: '#888', marginTop: 1 },
  actions: { padding: 20, gap: 12 },
  scanBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: '#1a73e8', borderRadius: 14, padding: 16
  },
  scanBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  historyBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: '#1a73e8', borderRadius: 14, padding: 14
  },
  historyBtnText: { color: '#1a73e8', fontSize: 16, fontWeight: 'bold' }
});
