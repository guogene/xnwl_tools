'use server'

import { cookies } from 'next/headers'
import { pb } from '@/lib/pocketbase'

export async function logout() {
  try {
    pb.authStore.clear()
    
    // 清除 cookie
    const cookieStore = await cookies()
    cookieStore.delete('token')
    
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: '退出登录失败' }
  }
}