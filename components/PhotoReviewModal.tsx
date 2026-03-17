import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';

type Props = {
  visible: boolean;
  items: string[];
  onConfirm: (selected: string[]) => void;
  onCancel: () => void;
};

export default function PhotoReviewModal({ visible, items, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(items.map((_, i) => i)));

  function toggle(index: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  function handleConfirm() {
    const chosen = items.filter((_, i) => selected.has(i));
    onConfirm(chosen);
  }

  const selectedCount = selected.size;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Itens encontrados ({items.length})</Text>
          <Text style={styles.subtitle}>Desmarque os que não quer adicionar</Text>

          {items.length === 0 ? (
            <Text style={styles.empty}>Nenhum item identificado na imagem.</Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(_, i) => String(i)}
              style={styles.list}
              renderItem={({ item, index }) => (
                <Pressable style={styles.row} onPress={() => toggle(index)}>
                  <View style={[styles.checkbox, selected.has(index) && styles.checkboxSelected]}>
                    {selected.has(index) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.itemText, !selected.has(index) && styles.itemDeselected]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          )}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, selectedCount === 0 && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={selectedCount === 0}
            >
              <Text style={styles.confirmText}>
                Adicionar {selectedCount > 0 ? `${selectedCount} ` : ''}
                {selectedCount === 1 ? 'item' : 'itens'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginVertical: 32,
    fontSize: 15,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  checkboxSelected: {
    backgroundColor: '#2e7d32',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  itemDeselected: {
    color: '#bbb',
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#a5d6a7',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
