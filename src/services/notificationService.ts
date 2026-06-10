import api from './api'
import type { CustomResponse, PageResponse } from '@/types/common'
import type { NotificationItem } from '@/types/notification'

// Le backend notifications utilise le format Spring Boot 3 (page imbriqué)
interface NotifApiData {
  content: NotificationItem[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

export const notificationService = {
  getMyNotifications: async (page = 0, size = 20): Promise<PageResponse<NotificationItem>> => {
    const { data } = await api.get<CustomResponse<NotifApiData>>(
      '/v1/notifications',
      { params: { page, size } }
    )
    const raw = data.data
    return {
      content: raw.content,
      totalElements: raw.page.totalElements,
      totalPages: raw.page.totalPages,
      size: raw.page.size,
      number: raw.page.number,
      first: raw.page.number === 0,
      last: raw.page.number >= raw.page.totalPages - 1,
    }
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
