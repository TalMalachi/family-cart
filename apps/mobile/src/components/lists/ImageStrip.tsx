import React from 'react'
import {
  View, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Text,
} from 'react-native'
import type { ProductImage } from '@familycart/shared'
import { UploadState }       from '../../hooks/useImageUpload'
import { Colors, Radius, Space, Shadow } from '../../utils/theme'

interface Props {
  images:       ProductImage[]
  selectedId:   string | null
  uploadState:  UploadState
  uploadProgress: number
  canUpload:    boolean
  canDelete:    boolean
  onSelect:     (id: string) => void
  onSetPrimary: (id: string) => void
  onDelete:     (id: string) => void
  onAddPress:   () => void
}

export function ImageStrip({
  images, selectedId, uploadState, uploadProgress,
  canUpload, canDelete,
  onSelect, onSetPrimary, onDelete, onAddPress,
}: Props) {

  const isUploading = uploadState === 'uploading' || uploadState === 'compressing'

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {images.map(img => {
        const isSelected = img.id === selectedId
        const isPrimary  = img.isPrimary

        return (
          <TouchableOpacity
            key={img.id}
            style={[styles.thumb, isSelected && styles.thumbSelected]}
            onPress={() => onSelect(img.id)}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: img.url }}
              style={styles.thumbImg}
              resizeMode="cover"
            />

            {/* Primary crown badge */}
            {isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>★</Text>
              </View>
            )}

            {/* Long-press action bar appears when selected */}
            {isSelected && (
              <View style={styles.thumbActions}>
                {!isPrimary && (
                  <TouchableOpacity
                    style={styles.thumbActionBtn}
                    onPress={() => onSetPrimary(img.id)}
                  >
                    <Text style={styles.thumbActionText}>★</Text>
                  </TouchableOpacity>
                )}
                {canDelete && (
                  <TouchableOpacity
                    style={[styles.thumbActionBtn, styles.thumbActionDelete]}
                    onPress={() => onDelete(img.id)}
                  >
                    <Text style={styles.thumbActionText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        )
      })}

      {/* Upload slot */}
      {canUpload && (
        <TouchableOpacity
          style={[styles.addSlot, isUploading && styles.addSlotUploading]}
          onPress={onAddPress}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <View style={styles.uploadProgress}>
              <ActivityIndicator color={Colors.teal} size="small" />
              <Text style={styles.uploadPct}>{uploadProgress}%</Text>
            </View>
          ) : (
            <>
              <View style={styles.addIcon}>
                <Text style={styles.addIconText}>+</Text>
              </View>
              <Text style={styles.addLabel}>Add photo</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const THUMB = 88

const styles = StyleSheet.create({
  strip:            { paddingHorizontal: Space.lg, paddingVertical: Space.md, gap: Space.sm },
  thumb:            { width: THUMB, height: THUMB, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', ...Shadow.card },
  thumbSelected:    { borderColor: Colors.teal },
  thumbImg:         { width: '100%', height: '100%' },
  primaryBadge:     { position: 'absolute', top: 4, left: 4, backgroundColor: Colors.teal, borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  primaryBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  thumbActions:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  thumbActionBtn:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
  thumbActionDelete:{ borderLeftWidth: 0.5, borderLeftColor: 'rgba(255,255,255,0.3)' },
  thumbActionText:  { color: Colors.white, fontSize: 13, fontWeight: '600' },
  addSlot:          { width: THUMB, height: THUMB, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.borderMid, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgSecondary },
  addSlotUploading: { borderColor: Colors.teal, borderStyle: 'solid' },
  uploadProgress:   { alignItems: 'center', gap: 4 },
  uploadPct:        { fontSize: 11, color: Colors.teal, fontWeight: '500' },
  addIcon:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  addIconText:      { fontSize: 20, color: Colors.textSecondary, lineHeight: 24 },
  addLabel:         { fontSize: 11, color: Colors.textSecondary },
})
