'use server'

import { cookies } from 'next/headers'
import { pb } from '../../lib/pocketbase'

export async function logout() {
  // 清除 PocketBase 认证状态
  pb.authStore.clear()
  
  // 清除 cookie
  const cookieStore = cookies()
  await cookieStore.delete('token')
  
  return { success: true }
} 