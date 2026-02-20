import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, SafeAreaView, ActivityIndicator, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { documentsAPI } from '../services/api';

export default function HistoryScreen({ navigation }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDocuments = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      const response = await documentsAPI.getAll(pageNum);
      if (refresh || pageNum === 1) {
        setDocuments(response.data);
      } else {
        setDocuments(prev => [...prev, ...response.data]);
      }
      setTotal(response.total);
    } catch (error) {
      Alert.alert('Error', 'Failed to load documents. Make sure the server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchDocuments(1, true);
  };

  const deleteDocument = (id, title) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await documentsAPI.delete(id);
              setDocuments(prev => prev.filter(d => d.id !== id));
            } catch {
              Alert.alert('Error', 'Failed to delete document.');
            }
          }
        }
      ]
    );
  };

  const openPDF = (pdfUrl) => {
    Linking.openURL(pdfUrl).catch(() => {
      Alert.alert('Error', 'Could not open PDF. Make sure server is running.');
    });
  };

  const renderItem = ({ item }) => {
    const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.docIcon}>
            <Ionicons name="document-text" size={24} color="#1a73e8" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardDate}>{date}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteDocument(item.id, item.title)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#e53935" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.badge}>
            <Ionicons name="text" size={12} color="#1a73e8" />
            <Text style={styles.badgeText}>{item.wordCount} words</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={12} color="#43a047" />
            <Text style={styles.badgeText}>{item.confidence}% accuracy</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.pdfBtn} onPress={() => openPDF(item.pdfUrl)}>
          <Ionicons name="download" size={16} color="white" />
          <Text style={styles.pdfBtnText}>Open PDF</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={{ marginTop: 12, color: '#888' }}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a73e8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Documents</Text>
        <Text style={styles.headerCount}>{total}</Text>
      </View>

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Documents Yet</Text>
          <Text style={styles.emptyText}>Scan your first image to get started!</Text>
          <TouchableOpacity style={styles.scanNowBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.scanNowText}>Scan Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a73e8" />}
          onEndReached={() => {
            if (documents.length < total) {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchDocuments(nextPage);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerCount: {
    backgroundColor: '#1a73e8', color: 'white', paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: 12, fontSize: 13, fontWeight: 'bold'
  },
  list: { padding: 16 },
  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  docIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#e8f0fe',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  cardDate: { fontSize: 12, color: '#999' },
  deleteBtn: { padding: 6 },
  cardStats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f0f4ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4
  },
  badgeText: { fontSize: 12, color: '#333' },
  pdfBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, backgroundColor: '#1a73e8', borderRadius: 8, padding: 10
  },
  pdfBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', marginBottom: 24 },
  scanNowBtn: { backgroundColor: '#1a73e8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  scanNowText: { color: 'white', fontWeight: 'bold', fontSize: 15 }
});
