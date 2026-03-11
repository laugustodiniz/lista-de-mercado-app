import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
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
import AsyncStorage from '@react-native-async-storage/async-storage';

type Item = {
  id: string;
  name: string;
  bought: boolean;
};

const STORAGE_KEY = '@lista_mercado';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');

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

  const pending = items.filter(i => !i.bought).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Lista de Mercado</Text>
        <Text style={styles.subtitle}>
          {pending} {pending === 1 ? 'item' : 'itens'} pendente{pending !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Pressable
              style={[styles.checkbox, item.bought && styles.checkboxDone]}
              onPress={() => toggleItem(item.id)}
            >
              {item.bought && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
            <Text style={[styles.itemName, item.bought && styles.itemDone]}>
              {item.name}
            </Text>
            <Pressable onPress={() => deleteItem(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum item ainda. Adicione abaixo!</Text>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Adicionar item..."
          placeholderTextColor="#999"
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={addItem}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2e7d32',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#a5d6a7',
    marginTop: 4,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 60,
    fontSize: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
    color: '#333',
  },
  addBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
  },
});
