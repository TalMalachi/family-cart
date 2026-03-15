import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native'
import type { ProductImage }  from '@familycart/shared'
import type { UploadState }   from '../../hooks/useImageUpload'
import { PermissionGate }     from './PermissionGate'
import { Colors, FontSize, FontWeight, Radius, Space } from '../../utils/theme'

interface Props {
  images:         ProductImage[]
  selectedId:     string | null
  uploadState:    UploadState
  uploadProgress: number
  uploadError:    string
  onSelect:       (id: string) => void
  onSetPrimary:   (id: string) => void
  onDelete:       (id: string) => void
  onPickCamera:   () => void
  onPickLibrary:  () => void
}

export function ImageGallery({
  images,
  selectedId,
  uploadState,
  uploadProgress,
  uploadError,
  onSelect,
  onSetPrimary,
  onDelete,
  onPickCamera,
  onPickLibrary,
}: Props) {
  const isUploading = uploadState === 'uploading' || uploadState === 'picking' || uploadState === 'compressing'

  return (
    <View>
      {/* Thumbnails row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbRow}
      >
        {images.map(img => (
          <TouchableOpacity
            key={img.id}
            style={[styles.thumb, selectedId === img.id && styles.thumbSelected]}
            onPress={() => onSelect(img.id)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: img.url }} style={styles.thumbImg} />
            {img.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>main</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Upload in-progress slot */}
        {isUploading && (
          <View style={[styles.thumb, styles.thumbUploading]}>
            <ActivityIndicator color={Colors.teal} size="small" />
            {uploadProgress > 0 && (
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            )}
          </View>
        )}

        {/* Add slot */}
        <PermissionGate require="med.upload">
          <View style={styles.addSlots}>
            <TouchableOpacity style={styles.addBtn} onPress={onPickCamera} activeOpacity={0.8}>
              <Text style={styles.addIcon}>📷</Text>
              <Text style={styles.addLabel}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={onPickLibrary} activeOpacity={0.8}>
              <Text style={styles.addIcon}>🖼</Text>
              <Text style={styles.addLabel}>Library</Text>
            </TouchableOpacity>
          </View>
        </PermissionGate>
      </ScrollView>

      {/* Error message */}
      {uploadState === 'error' && (
        <Text style={styles.errorText}>{uploadError}</Text>
      )}

      {/* Selected image preview + actions */}
      {selectedId && (() => {
        const img = images.find(i => i.id === selectedId)
        if (!img) return null
        return (
          <View style={styles.preview}>
            <Image source={{ uri: img.url }} style={styles.previewImg} resizeMode="contain" />
            <View style={styles.previewActions}>
              <PermissionGate require="med.upload">
                {!img.isPrimary && (
                  <TouchableOpacity
                    style={styles.previewBtn}
                    onPress={() => onSetPrimary(img.id)}
                  >
                    <Text style={styles.previewBtnText}>Set as main photo</Text>
                  </TouchableOpacity>
                )}
              </PermissionGate>
              <PermissionGate require="med.delete">
                <TouchableOpacity
                  style={[styles.previewBtn, styles.previewBtnDanger]}
                  onPress={() => onDelete(img.id)}
                >
                  <Text style={[styles.previewBtnText, styles.previewBtnTextDanger]}>
                    Delete photo
                  </Text>
                </TouchableOpacity>
              </PermissionGate>
            </View>
          </View>
        )
      })()}
    </View>
  )
}

const styles = StyleSheet.create({
  thumbRow:           { paddingHorizontal: Space.lg, paddingVertical: Space.sm, gap: Space.sm, alignItems: 'center' },
  thumb:              { width: 72, height: 72, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.border },
  thumbSelected:      { borderColor: Colors.teal, borderWidth: 2 },
  thumbImg:           { width: '100%', height: '100%' },
  thumbUploading:     { backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', gap: 4 },
  progressText:       { fontSize: FontSize.xs, color: Colors.teal, fontWeight: FontWeight.medium },
  primaryBadge:       { position: 'absolute', bottom: 4, left: 4, backgroundColor: Colors.teal, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  primaryBadgeText:   { fontSize: 9, color: Colors.white, fontWeight: FontWeight.medium },
  addSlots:           { flexDirection: 'row', gap: Space.xs },
  addBtn:             { width: 72, height: 72, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderMid, borderStyle: 'dashed', backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', gap: 2 },
  addIcon:            { fontSize: 22 },
  addLabel:           { fontSize: FontSize.xs, color: Colors.textSecondary },
  errorText:          { fontSize: FontSize.xs, color: Colors.danger, marginHorizontal: Space.lg, marginTop: Space.xs },
  preview:            { marginHorizontal: Space.lg, marginTop: Space.sm, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.border },
  previewImg:         { width: '100%', height: 220, backgroundColor: Colors.bgSecondary },
  previewActions:     { flexDirection: 'row', gap: Space.sm, padding: Space.md },
  previewBtn:         { flex: 1, borderWidth: 0.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 9, alignItems: 'center' },
  previewBtnDanger:   { borderColor: Colors.danger + '55' },
  previewBtnText:     { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  previewBtnTextDanger: { color: Colors.danger },
})
