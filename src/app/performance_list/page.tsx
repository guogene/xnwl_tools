'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PerformanceData } from '@/types/performance'
import { getPerformanceList } from './actions'

// 将主要内容移到一个新组件中
function PerformanceListContent() {
  const [data, setData] = useState<PerformanceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const name = searchParams.get('name')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  useEffect(() => {
    async function loadData() {
      if (name && startDate && endDate) {
        const performanceData = await getPerformanceList(name, startDate, endDate)
        setData(performanceData)
      }
      setIsLoading(false)
    }
    loadData()
  }, [name, startDate, endDate])

  // 格式化日期显示，添加年份
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', { 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit' 
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white px-4 py-3 flex items-center border-b">
        <button onClick={() => window.history.back()} className="text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-medium text-center flex-1">账单明细</h1>
      </div>

      {/* 表格容器 */}
      <div className="p-4">
        {/* 日期范围显示 */}
        <div className="mb-4 text-gray-600 font-bold text-2xl">
          {startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : ''}
        </div>

        <div className="bg-white rounded-lg shadow relative">
          {/* 添加一个外层容器，设置最大高度和滚动 */}
          <div className="max-h-[calc(100vh-120px)] overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 relative">
              <thead className="bg-gray-50 sticky top-0 z-30">
                <tr>
                  {/* 日期表头 - 最高层级 */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    日期
                  </th>
                  {/* 其他表头 */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">收件票数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">重量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">件数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">运费</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">中转费</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">扫描费</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">基金费</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">电子单</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">收件分成</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">派件票数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">派件重量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">派件分成</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* 日期列 - 中等层级 */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {new Date(item.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.pickupCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.weight}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.freight.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.transferFee.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.scanningFee.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.fundFee.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.electronicOrder.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">+{item.pickupShare.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.deliveryCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.deliveryWeight}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">+{item.deliveryShare.toFixed(2)}</td>
                  </tr>
                ))}
                {/* 合计行 */}
                <tr className="bg-gray-50 font-medium">
                  {/* 合计列 - 中等层级 */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    合计
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.pickupCount, 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.weight, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.freight, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.transferFee, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.scanningFee, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.fundFee, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.electronicOrder, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">
                    +{data.reduce((sum, item) => sum + item.pickupShare, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.deliveryCount, 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {data.reduce((sum, item) => sum + item.deliveryWeight, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">
                    +{data.reduce((sum, item) => sum + item.deliveryShare, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 添加全局样式 */}
      <style jsx global>{`
        /* 隐藏 WebKit 浏览器的滚动条 */
        .overflow-auto::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        
        .overflow-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )
}

// 导出默认组件，使用 Suspense 包裹内容组件
export default function PerformanceListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    }>
      <PerformanceListContent />
    </Suspense>
  )
} 