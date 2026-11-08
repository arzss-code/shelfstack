import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

interface ExtendedRealtimeClient {
  realtime?: {
    _remove?: (channel: RealtimeChannel) => void
  }
}

interface ExtendedChannel extends RealtimeChannel {
  channelAdapter?: {
    isJoined?: () => boolean
    isJoining?: () => boolean
  }
}

/**
 * Memastikan channel Supabase Realtime di-unsubscribe dan dilepas secara aman dari registry.
 */
export function teardownRealtimeChannel(
  client: SupabaseClient | null | undefined,
  channel: RealtimeChannel | null | undefined,
): void {
  if (!channel) return

  try {
    if (typeof channel.unsubscribe === 'function') {
      channel.unsubscribe()
    }
  } catch {
    // Abaikan jika sudah tidak aktif
  }

  if (client) {
    try {
      if (typeof client.removeChannel === 'function') {
        client.removeChannel(channel)
      }
    } catch {
      // Abaikan jika sudah terhapus
    }

    try {
      const extClient = client as unknown as ExtendedRealtimeClient
      if (extClient.realtime && typeof extClient.realtime._remove === 'function') {
        extClient.realtime._remove(channel)
      }
    } catch {
      // Abaikan jika tidak tersedia
    }
  }
}

/**
 * Mengakuisisi channel Supabase Realtime unik, membersihkan instance lama yang menempel pada topik yang sama.
 */
export function acquireRealtimeChannel(client: SupabaseClient, topic: string): RealtimeChannel {
  try {
    if (typeof client.getChannels === 'function') {
      const existing = client
        .getChannels()
        .find((ch) => ch.topic === topic || ch.topic === `realtime:${topic}`)
      if (existing) {
        teardownRealtimeChannel(client, existing)
      }
    }
  } catch {
    // Safe fallback untuk testing/mock environments
  }

  return client.channel(topic)
}

/**
 * Mengecek apakah channel saat ini sudah bergabung atau sedang dalam proses bergabung.
 */
export function isChannelSubscribed(channel: RealtimeChannel | null | undefined): boolean {
  if (!channel) return false
  const extChannel = channel as ExtendedChannel
  if (extChannel.channelAdapter) {
    return Boolean(
      extChannel.channelAdapter.isJoined?.() || extChannel.channelAdapter.isJoining?.(),
    )
  }
  return false
}
