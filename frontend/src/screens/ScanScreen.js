import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, SafeAreaView, Image, ScrollView,
  Animated, Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { ocrAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const STEPS = {
  CAMERA: 'camera',
  PREVIEW: 'preview',
  PROCESSING: 'processing',
  RESULT: 'result'
};

const PROCESSING_STEPS = [
  { id: 1, label: 'Uploading image', icon: 'cloud-upload' },
  { id: 2, label: 'Reading your handwriting', icon: 'eye' },
  { id: 3, label: 'Converting to digital text', icon: 'text' },
  { id: 4, label: 'Generating PDF', icon: 'document' },
];

export default function ScanScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState(STEPS.CAMERA);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState('off');
  const [currentProcessStep, setCurrentProcessStep] = useState(0);
  const cameraRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (route?.params?.openGallery) {
      pickFromGallery();
    }
  }, []);

  useEffect(() => {
    if (step === STEPS.CAMERA) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
        ])
      ).start();
    }
  }, [step]);

  useEffect(() => {
    if (step === STEPS.RESULT) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [step]);

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9, base64: true, exif: false
      });
      setCapturedImage(photo);
      setStep(STEPS.PREVIEW);
    } catch {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      base64: true,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 10
    });

    if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
      if (pickerResult.assets.length === 1) {
        setCapturedImage(pickerResult.assets[0]);
        setStep(STEPS.PREVIEW);
      } else {
        setStep(STEPS.PROCESSING);
        setCurrentProcessStep(0);
        await processMultipleImages(pickerResult.assets);
      }
    }
  };

  const processImage = async () => {
    if (!capturedImage) return;
    setStep(STEPS.PROCESSING);
    setCurrentProcessStep(0);

    const stepDuration = 3000;
    PROCESSING_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setCurrentProcessStep(i);
        Animated.timing(progressAnim, {
          toValue: ((i + 1) / PROCESSING_STEPS.length) * 100,
          duration: stepDuration - 200,
          useNativeDriver: false
        }).start();
      }, i * stepDuration);
    });

    try {
      const title = `Notes_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}_${Date.now()}`;
      let base64 = capturedImage.base64;
      if (!base64) {
        base64 = await FileSystem.readAsStringAsync(capturedImage.uri, {
          encoding: FileSystem.EncodingType.Base64
        });
      }
      const response = await ocrAPI.processBase64Image(
        `data:image/jpeg;base64,${base64}`, title, 'eng'
      );
      progressAnim.setValue(100);
      setResult(response.data);
      setTimeout(() => setStep(STEPS.RESULT), 500);
    } catch (error) {
      setStep(STEPS.PREVIEW);
      progressAnim.setValue(0);
      Alert.alert('Failed', error.message || 'Could not process image. Try a clearer photo.');
    }
  };

  const processMultipleImages = async (images) => {
    setStep(STEPS.PROCESSING);
    setCurrentProcessStep(0);

    // Animate steps
    PROCESSING_STEPS.forEach((_, i) => {
      setTimeout(() => setCurrentProcessStep(i), i * 4000);
    });

    try {
      // Convert all images to base64
      const base64Images = [];
      for (let i = 0; i < images.length; i++) {
        let base64 = images[i].base64;
        if (!base64) {
          base64 = await FileSystem.readAsStringAsync(images[i].uri, {
            encoding: FileSystem.EncodingType.Base64
          });
        }
        base64Images.push(`data:image/jpeg;base64,${base64}`);
      }

      // Send ALL images in one request → get ONE combined PDF back
      const response = await ocrAPI.processMultipleImages(base64Images);

      progressAnim.setValue(100);
      setResult(response.data);
      setTimeout(() => setStep(STEPS.RESULT), 500);
    } catch (error) {
      setStep(STEPS.CAMERA);
      progressAnim.setValue(0);
      Alert.alert('Failed', error.message || 'Could not process images.');
    }
  };

  const downloadPDF = async () => {
    if (!result?.pdfUrl) return;
    try {
      const localUri = FileSystem.documentDirectory + `Notes_${Date.now()}.pdf`;
      await FileSystem.downloadAsync(result.pdfUrl, localUri);
      await Sharing.shareAsync(localUri, { mimeType: 'application/pdf', dialogTitle: 'Save your PDF' });
    } catch {
      Alert.alert('Error', 'Failed to download PDF.');
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setResult(null);
    progressAnim.setValue(0);
    fadeAnim.setValue(0);
    setCurrentProcessStep(0);
    setStep(STEPS.CAMERA);
  };

  if (!permission) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a73e8" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permBox}>
          <Ionicons name="camera" size={56} color="#1a73e8" />
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permText}>To photograph your handwritten notes</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === STEPS.CAMERA) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" flash={flash}>
          <SafeAreaView style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.topBarBtn}>
              <Ionicons name="time" size={22} color="white" />
            </TouchableOpacity>
            <View style={styles.topBarCenter}>
              <Text style={styles.topBarTitle}>NoteLens</Text>
              <Text style={styles.topBarSub}>Handwritten notes → PDF</Text>
            </View>
            <TouchableOpacity onPress={() => setFlash(flash === 'off' ? 'on' : 'off')} style={styles.topBarBtn}>
              <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color="white" />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.frameArea}>
            <Animated.View style={[styles.docFrame, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <View style={styles.frameCenterHint}>
                <Ionicons name="document-text-outline" size={40} color="rgba(255,255,255,0.3)" />
              </View>
            </Animated.View>
            <Text style={styles.frameHint}>Place your notes inside the frame</Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.sideBtn} onPress={pickFromGallery}>
              <View style={styles.sideBtnInner}>
                <Ionicons name="images-outline" size={26} color="white" />
              </View>
              <Text style={styles.sideBtnLabel}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shutterBtn} onPress={capturePhoto}>
              <View style={styles.shutterRing}>
                <View style={styles.shutterInner} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.navigate('History')}>
              <View style={styles.sideBtnInner}>
                <Ionicons name="document-text-outline" size={26} color="white" />
              </View>
              <Text style={styles.sideBtnLabel}>My PDFs</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === STEPS.PREVIEW) {
    return (
      <SafeAreaView style={styles.previewContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={resetScan} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Review Photo</Text>
          <View style={{ width: 40 }} />
        </View>
        <Image source={{ uri: capturedImage?.uri }} style={styles.previewImage} resizeMode="contain" />
        <View style={styles.previewBottom}>
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={18} color="#f59e0b" />
            <Text style={styles.tipText}>Make sure all text is visible and well-lit for best results</Text>
          </View>
          <View style={styles.previewBtns}>
            <TouchableOpacity style={styles.outlineBtn} onPress={resetScan}>
              <Ionicons name="camera-outline" size={20} color="#1a73e8" />
              <Text style={styles.outlineBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={processImage}>
              <Ionicons name="document-text" size={20} color="white" />
              <Text style={styles.primaryBtnText}>Convert to PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === STEPS.PROCESSING) {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 100], outputRange: ['0%', '100%']
    });
    return (
      <View style={styles.processingBg}>
        <View style={styles.processingCard}>
          <View style={styles.processingLogo}>
            <Ionicons name="document-text" size={36} color="#1a73e8" />
          </View>
          <Text style={styles.processingTitle}>Converting your notes</Text>
          <Text style={styles.processingSubtitle}>This will take just a moment</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.stepsContainer}>
            {PROCESSING_STEPS.map((s, i) => (
              <View key={s.id} style={styles.stepRow}>
                <View style={[
                  styles.stepIconBox,
                  i < currentProcessStep && styles.stepDone,
                  i === currentProcessStep && styles.stepActive
                ]}>
                  {i < currentProcessStep
                    ? <Ionicons name="checkmark" size={14} color="white" />
                    : i === currentProcessStep
                      ? <ActivityIndicator size="small" color="white" />
                      : <Ionicons name={s.icon} size={14} color="#ccc" />
                  }
                </View>
                <Text style={[
                  styles.stepText,
                  i === currentProcessStep && styles.stepTextActive,
                  i < currentProcessStep && styles.stepTextDone
                ]}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (step === STEPS.RESULT && result) {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={resetScan} style={styles.navBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Conversion Complete</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.navBtn}>
              <Ionicons name="time" size={24} color="#1a73e8" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.successBanner}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.successTitle}>Your PDF is ready!</Text>
                <Text style={styles.successSub}>
                  {result.extractedText?.includes('--- Page')
                    ? 'Multiple pages digitized'
                    : 'Handwriting successfully digitized'}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{result.wordCount}</Text>
                <Text style={styles.statLabel}>Words</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{result.confidence}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{(result.processingTime / 1000).toFixed(1)}s</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
            </View>
            <View style={styles.textCard}>
              <View style={styles.textCardHeader}>
                <Ionicons name="text" size={16} color="#1a73e8" />
                <Text style={styles.textCardTitle}>Digitized Text Preview</Text>
              </View>
              <ScrollView style={styles.textScroll} nestedScrollEnabled>
                <Text style={styles.extractedText}>{result.extractedText}</Text>
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.downloadBtn} onPress={downloadPDF}>
              <Ionicons name="download-outline" size={22} color="white" />
              <Text style={styles.downloadBtnText}>Save PDF to Device</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn2} onPress={resetScan}>
              <Ionicons name="camera-outline" size={20} color="#1a73e8" />
              <Text style={styles.outlineBtn2Text}>Convert Another Page</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  permBox: { alignItems: 'center', padding: 40 },
  permTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 16 },
  permText: { fontSize: 14, color: '#888', marginTop: 6, marginBottom: 24 },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.5)'
  },
  topBarBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topBarCenter: { alignItems: 'center' },
  topBarTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  topBarSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  frameArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  docFrame: {
    width: width * 0.82, height: height * 0.45,
    borderRadius: 4, position: 'relative', justifyContent: 'center', alignItems: 'center'
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#1a73e8', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  frameCenterHint: { justifyContent: 'center', alignItems: 'center' },
  frameHint: {
    color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20
  },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 28, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.6)'
  },
  sideBtn: { alignItems: 'center', gap: 6 },
  sideBtnInner: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center'
  },
  sideBtnLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  shutterBtn: { alignItems: 'center', justifyContent: 'center' },
  shutterRing: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: 'white', justifyContent: 'center', alignItems: 'center'
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  previewContainer: { flex: 1, backgroundColor: '#fff' },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  navBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  previewImage: { flex: 1 },
  previewBottom: { padding: 16, gap: 12 },
  tipBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fffbeb', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#fde68a'
  },
  tipText: { flex: 1, fontSize: 13, color: '#92400e' },
  previewBtns: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, backgroundColor: '#1a73e8', borderRadius: 12, padding: 15
  },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  outlineBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, borderWidth: 2, borderColor: '#1a73e8', borderRadius: 12, padding: 13
  },
  outlineBtnText: { color: '#1a73e8', fontWeight: 'bold', fontSize: 15 },
  processingBg: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.95)',
    justifyContent: 'center', alignItems: 'center'
  },
  processingCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 32,
    width: width * 0.88, alignItems: 'center', elevation: 20
  },
  processingLogo: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#e8f0fe', justifyContent: 'center',
    alignItems: 'center', marginBottom: 20
  },
  processingTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  processingSubtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  progressTrack: {
    width: '100%', height: 6, backgroundColor: '#f0f0f0',
    borderRadius: 3, overflow: 'hidden', marginBottom: 28
  },
  progressFill: { height: '100%', backgroundColor: '#1a73e8', borderRadius: 3 },
  stepsContainer: { width: '100%', gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIconBox: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center'
  },
  stepActive: { backgroundColor: '#1a73e8' },
  stepDone: { backgroundColor: '#22c55e' },
  stepText: { fontSize: 14, color: '#aaa' },
  stepTextActive: { color: '#1a1a1a', fontWeight: '600' },
  stepTextDone: { color: '#22c55e' },
  resultContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  resultScroll: { flex: 1 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#f0fdf4', margin: 16, padding: 16,
    borderRadius: 14, borderWidth: 1, borderColor: '#bbf7d0'
  },
  successIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center'
  },
  successTitle: { fontSize: 16, fontWeight: 'bold', color: '#15803d' },
  successSub: { fontSize: 13, color: '#86efac', marginTop: 2 },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 16,
    borderRadius: 14, padding: 16, elevation: 2, marginBottom: 16,
    justifyContent: 'space-around', alignItems: 'center'
  },
  statCard: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#1a73e8' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#f0f0f0' },
  textCard: {
    backgroundColor: 'white', marginHorizontal: 16, borderRadius: 14,
    padding: 16, elevation: 2, marginBottom: 16
  },
  textCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  textCardTitle: { fontSize: 14, fontWeight: '600', color: '#1a73e8' },
  textScroll: { maxHeight: 180 },
  extractedText: { fontSize: 14, color: '#333', lineHeight: 22 },
  downloadBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: '#1a73e8', marginHorizontal: 16, borderRadius: 14,
    padding: 16, marginBottom: 12, elevation: 2
  },
  downloadBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  outlineBtn2: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: '#1a73e8', marginHorizontal: 16,
    borderRadius: 14, padding: 14, marginBottom: 32
  },
  outlineBtn2Text: { color: '#1a73e8', fontWeight: 'bold', fontSize: 15 }
});