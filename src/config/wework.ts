export const WEWORK_CONFIG = {
  CORPID: process.env.WEWORK_CORPID || '',
  CORPSECRET: process.env.WEWORK_CORPSECRET || '',
  REDIRECT_URI: process.env.WEWORK_REDIRECT_URI || '',
  AUTH_URL: 'https://open.weixin.qq.com/connect/oauth2/authorize',
  ACCESS_TOKEN_URL: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
  USER_INFO_URL: 'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo',
  USER_DETAIL_URL: 'https://qyapi.weixin.qq.com/cgi-bin/user/get'
} 