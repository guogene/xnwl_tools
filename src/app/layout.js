import './globals.css'

export const metadata = {
  title: '管理后台',
  description: '管理后台系统',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
