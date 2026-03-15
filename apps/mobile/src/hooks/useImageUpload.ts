import { useState }           from 'react'
import * as ImagePicker        from 'expo-image-picker'
import * as ImageManipulator   from 'expo-image-manipulator'
import { api }                 from '../services/api'

export type UploadState = 'idle' | 'picking' | 'compressing' | 'uploading' | 'done' | 'error'

interface UseImageUploadOptions {
  itemId: string
  onSuccess?: (imageId: string, url: string) => void
}

export function useImageUpload({ itemId, onSuccess }: UseImageUploadOptions) {
  const [state, setState]     = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError]     = useState<string | null>(null)

  const pickAndUpload = async (source: 'camera' | 'library') => {
    setError(null)
    setState('picking')

    try {
      // 1. Pick image
      let result: ImagePicker.ImagePickerResult

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          setError('Camera permission is required.')
          setState('idle')
          return
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        })
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
          setError('Photo library permission is required.')
          setState('idle')
          return
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        })
      }

      if (result.canceled || !result.assets?.[0]) {
        setState('idle')
        return
      }

      const asset = result.assets[0]

      // 2. Compress to max 800×800 and convert to JPEG
      setState('compressing')
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      )

      // 3. Get presigned upload URL from API
      setState('uploading')
      setProgress(10)
      const { data: presign } = await api.post('/media/presign', {
        itemId,
        contentType: 'image/jpeg',
      })
      setProgress(30)

      // 4. Upload directly to R2/S3 from device
      const blob = await (await fetch(compressed.uri)).blob()
      await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      })
      setProgress(90)

      setState('done')
      setProgress(100)
      onSuccess?.(presign.imageId, presign.publicUrl)

      // Reset after a moment
      setTimeout(() => { setState('idle'); setProgress(0) }, 1500)

    } catch (e: any) {
      setError(e?.message ?? 'Upload failed. Please try again.')
      setState('error')
      setTimeout(() => { setState('idle'); setError(null) }, 3000)
    }
  }

  return { state, progress, error, pickAndUpload }
}
