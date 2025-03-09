import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { pb } from './lib/pocketbase'

export async function middleware(request: NextRequest) {
  // 获取当前路径
  const path = request.nextUrl.pathname

  // 定义公开路径
  const publicPath = ['/login', '/images', '/performance_detail', '/performance_list']
  
  // 获取token
  const token = request.cookies.get('token')?.value

  // 验证token
  if (token) {
    try {
      pb.authStore.save(token)
      if (pb.authStore.isValid) {
        // 如果是公开路径，已登录则跳转到首页
        if (publicPath.includes(path)) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } else {
        // token 无效，清除 cookie
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('token')
        return response
      }
    } catch (error) {
      console.error('Auth error:', error)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return response
    }
  }

  // 如果不是公开路径，未登录则跳转到登录页
  if (!publicPath.includes(path) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// 配置需要进行中间件处理的路径，排除静态资源
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|txt)$).*)',
  ],
} 