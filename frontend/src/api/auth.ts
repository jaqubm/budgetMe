import { apiClient } from './client'
import type { UserInfo, VerifyTokenResponse } from '@/types/api'

/** POST /auth/verify — validate a Google access token */
export async function verifyToken(token: string): Promise<VerifyTokenResponse> {
  const { data } = await apiClient.post<VerifyTokenResponse>('/auth/verify', null, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

/** GET /auth/me — return the authenticated user's profile */
export async function getMe(): Promise<UserInfo> {
  const { data } = await apiClient.get<UserInfo>('/auth/me')
  return data
}
