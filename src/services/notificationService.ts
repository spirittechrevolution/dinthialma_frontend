import api from './api'
import { toPage, type CustomResponse, type PageResponse, type RawPage } from '@/types/common'
import type { NotificationItem } from '@/types/notification'

export const notificationService = {
  getMyNotifications: async (page = 0, size = 20): Promise<PageResponse<NotificationItem>> => {
    const { data } = await api.get<CustomResponse<RawPage<NotificationItem>>>(
      '/v1/notifications',
      { params: { page, size } }
    )
    return toPage(data.data)
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<CustomResponse<number>>('/v1/notifications/unread-count')
    return data.data
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/v1/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/v1/notifications/read-all')
  },
}
