import { WEWORK_CONFIG } from '@/config/wework'

export class WeworkAuth {
  private static accessToken: string = ''
  private static expiresAt: number = 0

  static async getAccessToken() {
    // 如果access_token未过期，直接返回
    if (this.accessToken && Date.now() < this.expiresAt) {
      return this.accessToken
    }

    const response = await fetch(`${WEWORK_CONFIG.ACCESS_TOKEN_URL}?corpid=${WEWORK_CONFIG.CORPID}&corpsecret=${WEWORK_CONFIG.CORPSECRET}`)
    const data = await response.json()

    if (data.errcode === 0) {
      this.accessToken = data.access_token
      this.expiresAt = Date.now() + (data.expires_in * 1000)
      return this.accessToken
    }

    throw new Error('获取access_token失败：' + data.errmsg)
  }

  static async getUserInfo(code: string) {
    const accessToken = await this.getAccessToken()
    const response = await fetch(`${WEWORK_CONFIG.USER_INFO_URL}?access_token=${accessToken}&code=${code}`)
    const data = await response.json()

    if (data.errcode === 0) {
      return data
    }

    throw new Error('获取用户信息失败：' + data.errmsg)
  }

  static async getUserDetail(userId: string) {
    const accessToken = await this.getAccessToken()
    const response = await fetch(`${WEWORK_CONFIG.USER_DETAIL_URL}?access_token=${accessToken}&userid=${userId}`)
    const data = await response.json()

    if (data.errcode === 0) {
      return data
    }

    throw new Error('获取用户详细信息失败：' + data.errmsg)
  }
} 