import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { enhancedModelManager, LocalModel } from '../../services/EnhancedModelManager';
import huggingFaceService, { ProcessedModel } from '../../services/HuggingFaceService';

export default function ModelHub() {
  const isDark = useColorScheme() === 'dark';
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProcessedModel[]>([]);
  const [recommended, setRecommended] = useState<any>({});
  const [downloading, setDownloading] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rec = await huggingFaceService.getRecommendedModels();
        setRecommended(rec);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSearch = async () => {
    setLoading(true);
    try {
      const found = await huggingFaceService.searchModels({ search: query, limit: 30 });
      setResults(found);
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async (model: ProcessedModel) => {
    setDownloading(prev => ({ ...prev, [model.id]: 0 }));
    try {
      await enhancedModelManager.downloadModel(model.id, (p) => {
        setDownloading(prev => ({ ...prev, [model.id]: p.progress }));
      });
    } catch (e) {
      // no-op, progress UI will reset automatically later if needed
    } finally {
      setTimeout(() => setDownloading(prev => { const cp = { ...prev }; delete cp[model.id]; return cp; }), 3000);
    }
  };

  const Section = ({ title, models }: { title: string; models: ProcessedModel[] }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      {models.length === 0 ? (
        <Text style={{ color: isDark ? '#aaa' : '#666' }}>No models</Text>
      ) : (
        models.map((m) => (
          <View key={m.id} style={[styles.card, { backgroundColor: isDark ? '#222' : '#f7f7f7' }]}> 
            <View style={{ flex: 1 }}>
              <Text style={[styles.modelName, { color: isDark ? '#fff' : '#000' }]}>{m.name}</Text>
              <Text style={[styles.modelMeta, { color: isDark ? '#aaa' : '#555' }]}>
                {m.author} • {m.size}MB • {m.quantization}
              </Text>
              <Text style={[styles.modelDesc, { color: isDark ? '#ccc' : '#333' }]} numberOfLines={2}>
                {m.description}
              </Text>
              <Text style={[styles.modelTags, { color: isDark ? '#9ad' : '#246' }]}>
                {m.capabilities.join(', ')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#007AFF' }]}
              onPress={() => onDownload(m)}
            >
              <Text style={styles.actionText}>{downloading[m.id] ? `${downloading[m.id]}%` : 'Download'}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111' : '#fff' }]}> 
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search models (e.g., phi, llama, gemma)"
          placeholderTextColor={isDark ? '#888' : '#999'}
          style={[styles.searchInput, { color: isDark ? '#fff' : '#000', backgroundColor: isDark ? '#222' : '#f5f5f5' }]}
        />
        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: '#34C759' }]} onPress={onSearch}>
          <Text style={styles.searchText}>{loading ? '...' : 'Search'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {results.length > 0 && <Section title="Search Results" models={results} />}

        <Section title="Recommended: Lightweight" models={recommended.lightweight || []} />
        <Section title="Recommended: Balanced" models={recommended.balanced || []} />
        <Section title="Recommended: Vision" models={recommended.vision || []} />
        <Section title="Recommended: Specialized" models={recommended.specialized || []} />
        <Section title="Recommended: Multilingual" models={recommended.multilingual || []} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, padding: 12, borderRadius: 8 },
  searchBtn: { paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  searchText: { color: '#fff', fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  card: { padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modelName: { fontSize: 16, fontWeight: '700' },
  modelMeta: { fontSize: 12, marginTop: 2 },
  modelDesc: { fontSize: 13, marginTop: 6 },
  modelTags: { fontSize: 12, marginTop: 6 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: '700' },
});


