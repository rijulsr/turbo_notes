import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { enhancedModelManager, LocalModel } from '../../services/EnhancedModelManager';
import { benchmarkService, BenchmarkResult } from '../../services/BenchmarkService';

export default function Benchmarks() {
  const isDark = useColorScheme() === 'dark';
  const [models, setModels] = useState<LocalModel[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, BenchmarkResult>>({});

  const refresh = () => {
    const all = enhancedModelManager.getAllModels();
    setModels(all.filter(m => m.isDownloaded));
  };

  useEffect(() => {
    refresh();
  }, []);

  const run = async (m: LocalModel) => {
    setRunningId(m.id);
    try {
      const res = await benchmarkService.runBenchmark(m);
      setResults(prev => ({ ...prev, [m.id]: res }));
    } finally {
      setRunningId(null);
    }
  };

  const Badge = ({ r }: { r: BenchmarkResult }) => {
    const rating = benchmarkService.getRecommendationBadge(r);
    const color = rating === 'Good' ? '#34C759' : rating === 'Fair' ? '#FFCC00' : '#FF3B30';
    return (
      <View style={{ backgroundColor: color, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
        <Text style={{ color: '#000', fontWeight: '700' }}>{rating}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111' : '#fff' }]}> 
      <ScrollView>
        {models.length === 0 ? (
          <Text style={{ color: isDark ? '#aaa' : '#666' }}>No models installed. Download from Model Hub first.</Text>
        ) : (
          models.map(m => {
            const r = results[m.id];
            return (
              <View key={m.id} style={[styles.card, { backgroundColor: isDark ? '#222' : '#f7f7f7' }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modelName, { color: isDark ? '#fff' : '#000' }]}>{m.name}</Text>
                  {r ? (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <Badge r={r} />
                        <Text style={{ color: isDark ? '#ccc' : '#333' }}>{r.completion.approxTokensPerSec} tok/s</Text>
                        <Text style={{ color: isDark ? '#ccc' : '#333' }}>Load: {r.coldLoadMs} ms</Text>
                      </View>
                      <Text style={{ color: isDark ? '#aaa' : '#555', marginTop: 4 }}>
                        Output: {r.completion.outputChars} chars • Time: {r.completion.elapsedMs} ms
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.modelMeta, { color: isDark ? '#aaa' : '#555' }]}>No benchmark yet</Text>
                  )}
                </View>
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#34C759' }]} onPress={() => run(m)}>
                  <Text style={styles.btnText}>{runningId === m.id ? 'Running...' : 'Run'}</Text>
                </TouchableOpacity>
              </View>
            );
          })
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
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});


