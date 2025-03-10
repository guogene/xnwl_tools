import { NextResponse } from 'next/server'
import { WeworkAuth } from '@/lib/wework'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: '缺少code参数' }, { status: 400 })
    }

    // 获取用户基本信息
    const userInfo = await WeworkAuth.getUserInfo(code)
    
    // 获取用户详细信息
    const userDetail = await WeworkAuth.getUserDetail(userInfo.UserId)
    // const userDetail = {
    //   name: '张三'
    // }

    // 创建重定向响应，将用户名作为URL参数传递
    const redirectUrl = new URL('/performance_detail', process.env.BASE_URL)
    redirectUrl.searchParams.set('temp_username', userDetail.name)
    // console.log("request url", request.url)
    // console.log("redirectUrl", redirectUrl.toString())
    
    return NextResponse.redirect(redirectUrl)

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { 
      status: 500 
    })
  }
} 