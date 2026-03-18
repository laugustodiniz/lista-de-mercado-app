import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#FAF9F6',
  primary: '#4ECDC4',
  primaryDark: '#3DBDB5',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  textMuted: '#B2BEC3',
  border: '#F0EDED',
};

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
          <View style={styles.handle} />

          <Text style={styles.title}>Itens encontrados ({items.length})</Text>
          <Text style={styles.subtitle}>Desmarque os que não quer adicionar</Text>

          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.empty}>Nenhum item identificado.</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(_, i) => String(i)}
              style={styles.list}
              renderItem={({ item, index }) => (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => toggle(index)}
                >
                  <Ionicons
                    name={selected.has(index) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={selected.has(index) ? COLORS.primary : COLORS.textMuted}
                    style={styles.checkboxIcon}
                  />
                  <Text style={[styles.itemText, !selected.has(index) && styles.itemDeselected]}>
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          )}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                selectedCount === 0 && styles.confirmBtnDisabled,
                pressed && styles.btnPressed,
              ]}
              onPress={handleConfirm}
              disabled={selectedCount === 0}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 32,
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 15,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  checkboxIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  itemDeselected: {
    color: COLORS.textMuted,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  btnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  cancelText: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#B8E8E4',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
