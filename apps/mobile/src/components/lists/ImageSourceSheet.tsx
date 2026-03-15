import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
} from 'react-native'
import { Colors, FontSize, FontWeight, Radius, Space } from '../../utils/theme'

interface Props {
  visible:  boolean
  onCamera: () => void
  onLibrary: () => void
  onClose:  () => void
}

export function ImageSourceSheet({ visible, onCamera, onLibrary, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Add product photo</Text>

        <TouchableOpacity style={styles.option} onPress={onCamera} activeOpacity={0.8}>
          <View style={styles.optionIcon}>
            <Text style={{ fontSize: 22 }}>📷</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionName}>Take a photo</Text>
            <Text style={styles.optionDesc}>Use your camera to photograph the product</Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.option} onPress={onLibrary} activeOpacity={0.8}>
          <View style={styles.optionIcon}>
            <Text style={{ fontSize: 22 }}>🖼</Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionName}>Choose from library</Text>
            <Text style={styles.optionDesc}>Pick an existing photo from your device</Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:        {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Space.xl,
    paddingBottom: 40,
  },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Space.lg },
  title:        { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: Space.lg },
  option:       { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: Space.sm },
  optionIcon:   { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  optionInfo:   { flex: 1 },
  optionName:   { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  optionDesc:   { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  optionArrow:  { fontSize: 20, color: Colors.textTertiary },
  separator:    { height: 0.5, backgroundColor: Colors.border, marginVertical: Space.xs },
  cancelBtn:    { marginTop: Space.lg, backgroundColor: Colors.bgSecondary, borderRadius: Radius.sm, paddingVertical: 14, alignItems: 'center' },
  cancelText:   { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
})
