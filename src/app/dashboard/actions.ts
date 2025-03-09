'use server'

import { cookies } from 'next/headers'
import { pb } from '@/lib/pocketbase'

export async function logout() {
  try {
    // 清除 PocketBase 认证状态
    pb.authStore.clear()
    
    // 清除 cookie
    const cookieStore = cookies()
    cookieStore.delete('token')
    
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: '退出登录失败' }
  }
} 