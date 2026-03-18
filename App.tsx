import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item } from './constants/types';
import { usePhotoScanner } from './hooks/usePhotoScanner';
import { useAudioScanner } from './hooks/useAudioScanner';
import PhotoReviewModal from './components/PhotoReviewModal';

const STORAGE_KEY = '@lista_mercado';

const COLORS = {
  background: '#FAF9F6',
  primary: '#4ECDC4',
  primaryDark: '#3DBDB5',
  secondary: '#FFB4A2',
  accent: '#B8B8FF',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  textMuted: '#B2BEC3',
  danger: '#FF6B6B',
  dangerLight: '#FFCCCC',
  border: '#F0EDED',
  inputBg: '#F4F2EF',
  gradientStart: '#4ECDC4',
  gradientEnd: '#44B09E',
};

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [reviewItems, setReviewItems] = useState<string[]>([]);
  const [reviewVisible, setReviewVisible] = useState(false);

  const { scanFromGallery, scanFromCamera, isLoading: photoLoading } = usePhotoScanner();
  const { startRecording, stopRecording, isRecording, isLoading: audioLoading, recordingDuration } = useAudioScanner();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setItems(JSON.parse(json));
    } catch {}
  }

  async function saveItems(newItems: Item[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {}
  }

  function addItem() {
    const name = input.trim();
    if (!name) return;
    const newItems = [
      ...items,
      { id: Date.now().toString(), name, bought: false },
    ];
    setItems(newItems);
    saveItems(newItems);
    setInput('');
    Keyboard.dismiss();
  }

  function addMultipleItems(names: string[]) {
    if (names.length === 0) return;
    const now = Date.now();
    const newItems = [
      ...items,
      ...names.map((name, i) => ({ id: (now + i).toString(), name, bought: false })),
    ];
    setItems(newItems);
    saveItems(newItems);
  }

  function toggleItem(id: string) {
    const newItems = items.map(item =>
      item.id === id ? { ...item, bought: !item.bought } : item
    );
    setItems(newItems);
    saveItems(newItems);
  }

  function deleteItem(id: string) {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    saveItems(newItems);
  }

  async function handleScanPhoto() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Galeria de fotos', 'Tirar foto'], cancelButtonIndex: 0 },
        async buttonIndex => {
          if (buttonIndex === 1) await runScan('gallery');
          if (buttonIndex === 2) await runScan('camera');
        }
      );
    } else {
      Alert.alert('Adicionar da foto', 'Escolha uma opção', [
        { text: 'Galeria de fotos', onPress: () => runScan('gallery') },
        { text: 'Tirar foto', onPress: () => runScan('camera') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }

  async function runScan(source: 'gallery' | 'camera') {
    const extracted = source === 'gallery'
      ? await scanFromGallery()
      : await scanFromCamera();
    if (extracted === null) return;
    if (extracted.length > 0) {
      setReviewItems(extracted);
      setReviewVisible(true);
    } else {
      Alert.alert('Nenhum item encontrado', 'Não foi possível identificar itens na imagem.');
    }
  }

  async function handleMicPress() {
    if (isRecording) {
      const extracted = await stopRecording();
      if (extracted === null) return;
      if (extracted.length > 0) {
        setReviewItems(extracted);
        setReviewVisible(true);
      } else {
        Alert.alert('Nenhum item encontrado', 'Não foi possível identificar itens no áudio.');
      }
    } else {
      await startRecording();
    }
  }

  function formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleReviewConfirm(selected: string[]) {
    setReviewVisible(false);
    addMultipleItems(selected);
  }

  const showLoading = photoLoading || audioLoading;
  const loadingMessage = audioLoading ? 'Processando áudio...' : 'Analisando imagem...';
  const pending = items.filter(i => !i.bought).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      {showLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </View>
      )}

      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Lista de Mercado</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="cart-outline" size={14} color="#fff" />
              <Text style={styles.badgeText}>
                {pending} {pending === 1 ? 'item' : 'itens'} pendente{pending !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.itemRow, pressed && styles.itemRowPressed]}
            onPress={() => toggleItem(item.id)}
          >
            <Ionicons
              name={item.bought ? 'checkmark-circle' : 'ellipse-outline'}
              size={26}
              color={item.bought ? COLORS.primary : COLORS.textMuted}
              style={styles.checkboxIcon}
            />
            <Text style={[styles.itemName, item.bought && styles.itemDone]}>
              {item.name}
            </Text>
            <Pressable
              onPress={() => deleteItem(item.id)}
              style={styles.deleteBtn}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Lista vazia</Text>
            <Text style={styles.emptySubtitle}>Adicione itens usando o campo abaixo,{'\n'}uma foto ou gravação de áudio</Text>
          </View>
        }
      />

      {isRecording && (
        <View style={styles.recordingBanner}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>
            Gravando... {formatDuration(recordingDuration)} / 2:00
          </Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Adicionar item..."
          placeholderTextColor={COLORS.textMuted}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.addBtn, pressed && styles.actionBtnPressed]}
          onPress={addItem}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.cameraBtn, pressed && styles.actionBtnPressed]}
          onPress={handleScanPhoto}
        >
          <Ionicons name="camera-outline" size={22} color="#fff" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            isRecording ? styles.micBtnRecording : styles.micBtn,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={handleMicPress}
        >
          {isRecording ? (
            <Text style={styles.micTimerText}>{formatDuration(recordingDuration)}</Text>
          ) : (
            <Ionicons name="mic-outline" size={22} color="#fff" />
          )}
        </Pressable>
      </View>

      <PhotoReviewModal
        visible={reviewVisible}
        items={reviewItems}
        onConfirm={handleReviewConfirm}
        onCancel={() => setReviewVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingTop: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  itemRowPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  checkboxIcon: {
    marginRight: 14,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '400',
  },
  itemDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  actionBtn: {
    borderRadius: 14,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
  },
  cameraBtn: {
    backgroundColor: '#5B9BD5',
  },
  micBtn: {
    backgroundColor: COLORS.accent,
  },
  micBtnRecording: {
    backgroundColor: COLORS.danger,
  },
  micTimerText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 10,
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  recordingText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
