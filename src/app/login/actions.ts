'use server'

import { pb } from '../../lib/pocketbase'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  try {
    const authData = await pb.collection('users').authWithPassword(
      formData.get('username') as string,
      formData.get('password') as string,
    )

    // 设置 cookie
    const cookieStore = await cookies()
    cookieStore.set('token', pb.authStore.token, {
      httpOnly: true,
      secure: false, // process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return {
      error: '用户名或密码错误'
    }
  }
} 