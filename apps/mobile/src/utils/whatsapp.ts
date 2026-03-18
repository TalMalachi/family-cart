import { Linking, Alert } from 'react-native'
import type { ShoppingList, ShoppingItem } from '@familycart/shared'
import { api } from '../services/api'

const WHATSAPP_SCHEME = 'whatsapp://'

/**
 * Check whether WhatsApp is installed on the device.
 */
export async function isWhatsAppInstalled(): Promise<boolean> {
  try {
    return await Linking.canOpenURL(WHATSAPP_SCHEME)
  } catch {
    return false
  }
}

/**
 * Open WhatsApp to create a new group.
 * Pre-fills a message with the family name so the user can select all
 * family members in WhatsApp's contact picker and create the group.
 *
 * After creating the group the user should copy its invite link and
 * save it back in the app for one-tap access.
 */
export async function openWhatsAppForGroupCreation(
  familyName: string,
  memberPhones: string[],
): Promise<void> {
  const installed = await isWhatsAppInstalled()
  if (!installed) {
    Alert.alert('WhatsApp Not Installed', 'Please install WhatsApp to create a family group.')
    return
  }

  const message = `👨‍👩‍👧‍👦 ${familyName} — FamilyCart\n\nMembers:\n${memberPhones.join('\n')}`
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`
  await Linking.openURL(url)
}

/**
 * Open an existing WhatsApp group directly via its invite link.
 * The link format is `https://chat.whatsapp.com/INVITE_CODE`.
 */
export async function openWhatsAppGroup(inviteLink: string): Promise<void> {
  const installed = await isWhatsAppInstalled()
  if (!installed) {
    Alert.alert('WhatsApp Not Installed', 'Please install WhatsApp to open the group.')
    return
  }

  try {
    await Linking.openURL(inviteLink)
  } catch {
    Alert.alert('Cannot Open Link', 'Unable to open the WhatsApp group link.')
  }
}

/**
 * Share a shopping list to WhatsApp.
 *
 * Builds a formatted text message with all items grouped by category.
 * Instead of raw image URLs, appends a single link to a preview page
 * that shows all product photos inline — WhatsApp will render a rich
 * link preview with the first product image.
 */
export async function shareListToWhatsApp(list: ShoppingList): Promise<void> {
  const installed = await isWhatsAppInstalled()
  if (!installed) {
    Alert.alert('WhatsApp Not Installed', 'Please install WhatsApp to share this list.')
    return
  }

  // Get signed share link from API
  let shareUrl = ''
  try {
    const baseUrl = (api.defaults.baseURL ?? '').replace(/\/$/, '')
    const { data } = await api.get(`/lists/${list.id}/share-link`)
    // Server returns absolute URL when APP_URL is set or host is public;
    // otherwise returns a relative path that we prepend with baseUrl.
    const url = data.shareUrl as string
    shareUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
  } catch (e) {
    console.warn('[share-link]', e)
    // Continue without the photos link — text message still works
  }

  // Group items by category
  const grouped = new Map<string, ShoppingItem[]>()
  for (const item of list.items ?? []) {
    const cat = item.category ?? 'Other'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(item)
  }

  const hasImages = (list.items ?? []).some(i => i.images?.length > 0)
  const total = list.items?.length ?? 0
  const purchased = list.items?.filter(i => i.isPurchased).length ?? 0
  const date = new Date().toLocaleDateString()

  let msg = `🛒 *${list.name}*\n`
  msg += `📅 ${date}\n`
  msg += '─'.repeat(20) + '\n'

  for (const [cat, items] of grouped) {
    msg += `\n*${cat.toUpperCase()}*\n`
    for (const item of items) {
      const check = item.isPurchased ? '✅' : '☐'
      const qty = `${item.quantity}${item.unit ? ' ' + item.unit : ''}`
      const price = item.estimatedPrice ? ` - ₪${item.estimatedPrice.toFixed(2)}` : ''
      msg += `${check} ${item.name} x${qty}${price}\n`
    }
  }

  msg += '\n' + '─'.repeat(20) + '\n'
  msg += `📊 ${total} items | ✅ ${purchased} done | ⏳ ${total - purchased} remaining\n`

  // Add share link with product images instead of individual URLs
  if (shareUrl && hasImages) {
    msg += `\n🖼️ View list with product photos:\n${shareUrl}\n`
  }

  msg += '_Sent via FamilyCart_'

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
  await Linking.openURL(url)
}

/**
 * Send a WhatsApp message to a specific phone number.
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  await Linking.openURL(url)
}

/**
 * Validate that a string is a WhatsApp group invite link.
 */
export function isValidWhatsAppGroupLink(link: string): boolean {
  return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}$/.test(link.trim())
}

