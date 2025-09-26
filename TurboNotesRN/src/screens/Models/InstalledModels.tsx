import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Alert } from 'react-native';
import { enhancedModelManager, LocalModel } from '../../services/EnhancedModelManager';

export default function InstalledModels() {
  const isDark = useColorScheme() === 'dark';
  const [installed, setInstalled] = useState<LocalModel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const refresh = async () => {
    const all = enhancedModelManager.getAllModels();
    setInstalled(all.filter(m => m.isDownloaded));
    setActiveId(enhancedModelManager.getActiveModel()?.id || null);
  };

  useEffect(() => {
    const interval = setInterval(refresh, 1000);
    refresh();
    return () => clearInterval(interval);
  }, []);

  const onLoad = async (id: string) => {
    try {
      setLoadingId(id);
      await enhancedModelManager.loadModel(id);
      await refresh();
    } catch (e) {
      Alert.alert('Load failed', (e as any).message || 'Unknown error');
    } finally {
      setLoadingId(null);
    }
  };

  const onUnload = async () => {
    try {
      setLoadingId(activeId);
      await enhancedModelManager.unloadModel();
      await refresh();
    } catch (e) {
      Alert.alert('Unload failed', (e as any).message || 'Unknown error');
    } finally {
      setLoadingId(null);
    }
  };

  const onDelete = async (id: string) => {
    Alert.alert('Delete Model', 'Are you sure you want to delete this model file?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setLoadingId(id);
          await enhancedModelManager.deleteModel(id);
          await refresh();
        } catch (e) {
          Alert.alert('Delete failed', (e as any).message || 'Unknown error');
        } finally {
          setLoadingId(null);
        }
      } }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111' : '#fff' }]}> 
      <ScrollView style={{ flex: 1 }}>
        {installed.length === 0 ? (
          <Text style={{ color: isDark ? '#aaa' : '#666' }}>No installed models yet. Download from the Model Hub.</Text>
        ) : (
          installed.map(m => (
            <View key={m.id} style={[styles.card, { backgroundColor: isDark ? '#222' : '#f7f7f7' }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.modelName, { color: isDark ? '#fff' : '#000' }]}>
                  {m.name} {activeId === m.id ? '• Active' : ''}
                </Text>
                <Text style={[styles.modelMeta, { color: isDark ? '#aaa' : '#555' }]}>
                  {m.size}MB • {m.quantization} • ctx {m.contextLength}
                </Text>
                <Text style={[styles.modelPath, { color: isDark ? '#8a8' : '#262' }]} numberOfLines={1}>
                  {m.filePath}
                </Text>
              </View>
              {activeId === m.id ? (
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#ff3b30' }]} onPress={onUnload}>
                  <Text style={styles.btnText}>{loadingId === m.id ? '...' : 'Unload'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#007AFF' }]} onPress={() => onLoad(m.id)}>
                  <Text style={styles.btnText}>{loadingId === m.id ? '...' : 'Load'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#8e8e93' }]} onPress={() => onDelete(m.id)}>
                <Text style={styles.btnText}>{loadingId === m.id ? '...' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  card: { padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modelName: { fontSize: 16, fontWeight: '700' },
  modelMeta: { fontSize: 12, marginTop: 2 },
  modelPath: { fontSize: 10, marginTop: 6 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});


