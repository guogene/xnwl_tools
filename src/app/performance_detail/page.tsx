'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PerformanceData } from '@/types/performance'
import { getEmployeePerformance, getEmployeePerformanceByDateRange } from './actions'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { registerLocale } from "react-datepicker"
import { zhCN } from 'date-fns/locale/zh-CN'

registerLocale('zh-CN', zhCN)

export default function PerformanceDetail() {
  const [data, setData] = useState<PerformanceData[]>([])
  const [rangeData, setRangeData] = useState<PerformanceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const name = searchParams.get('name')
  
  // 从 URL 参数中获取日期范围
  const urlStartDate = searchParams.get('startDate')
  const urlEndDate = searchParams.get('endDate')
  
  // 初始化日期范围状态，优先使用 URL 中的日期
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    urlStartDate ? new Date(urlStartDate) : new Date(),
    urlEndDate ? new Date(urlEndDate) : new Date()
  ])
  const [startDate, endDate] = dateRange
  const dateRanges = ['本周(2/17-2/21)', '上周(2/10-2/14)', '本月(2/1-2/29)']

  // 加载最近三天的数据
  useEffect(() => {
    async function loadData() {
      if (name) {
        const today = new Date()
        const threeDaysAgo = new Date(today)
        threeDaysAgo.setDate(today.getDate() - 2)
        
        const performanceData = await getEmployeePerformance(name, threeDaysAgo.toISOString().split('T')[0])
        setData(performanceData)
      }
      setIsLoading(false)
    }
    loadData()
  }, [name])

  // 加载日期范围内的数据
  useEffect(() => {
    async function loadRangeData() {
      if (name && startDate && endDate) {
        const rangeData = await getEmployeePerformanceByDateRange(
          name,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        setRangeData(rangeData)
      }
    }
    loadRangeData()
  }, [name, startDate, endDate])

  // 获取指定日期的数据
  const getDayData = (daysAgo: number) => {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - daysAgo)
    const targetDateStr = targetDate.toISOString().split('T')[0]
    
    const dayData = data.find(item => item.date.split('T')[0] === targetDateStr)
    return {
      pickupShare: dayData?.pickupShare || 0,
      deliveryShare: dayData?.deliveryShare || 0
    }
  }

  // 计算总账单
  const totalAmount = rangeData.reduce((sum, item) => 
    sum + item.pickupShare + item.deliveryShare, 0
  )

  // 获取今天、昨天、前天的数据
  const today = getDayData(0)
  const yesterday = getDayData(1)
  const dayBeforeYesterday = getDayData(2)

  // 修改日期选择的处理函数
  const handleDateRangeChange = (update: [Date | null, Date | null]) => {
    setDateRange(update)
    
    // 更新 URL 参数
    const newSearchParams = new URLSearchParams(searchParams.toString())
    if (update[0]) {
      newSearchParams.set('startDate', update[0].toISOString().split('T')[0])
    } else {
      newSearchParams.delete('startDate')
    }
    if (update[1]) {
      newSearchParams.set('endDate', update[1].toISOString().split('T')[0])
    } else {
      newSearchParams.delete('endDate')
    }
    
    // 使用 replace 而不是 push 来避免创建新的历史记录
    router.replace(`/performance_detail?${newSearchParams.toString()}`)
  }

  // 修改查看明细的处理函数
  const handleViewDetail = () => {
    if (startDate && endDate) {
      // 直接使用当前 URL 的所有参数
      router.push(`/performance_list?${searchParams.toString()}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!name) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">缺少必要的参数</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      {/* 顶部导航栏 */}
      <div className="bg-white px-4 py-3 flex items-center border-b">
        <button onClick={() => window.history.back()} className="text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-medium text-center flex-1">我的账单</h1>
      </div>

      {/* 总账单 */}
      <div className="bg-white px-4 py-6 mb-4 bg-cyan-50 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <div className="text-2xl font-bold">总账单</div>
          <div className="relative z-10">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              dateFormat="MM/dd"
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="选择日期范围"
              isClearable={true}
              locale="zh-CN"
              maxDate={new Date()}
            />
          </div>
        </div>
        <div className="text-3xl font-bold">{totalAmount.toFixed(2)} 元</div>
      </div>

      {/* 我的账单 */}
      <div className="bg-white px-4 py-4 mb-4">        
        {/* 收件分成 */}
        <div className="mb-6 bg-gray-100 p-4 rounded-md bg-violet-50">
          <div className="text-gray-900 font-xl mb-3">收件分成</div>
          <hr className='border-gray-300 mb-3' />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">今天</div>
              <div className="text-2xl font-bold text-red-500">+{today.pickupShare.toFixed(2)} 元</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-500 text-xl">昨天</div>
              <div className="text-xl text-red-500">+{yesterday.pickupShare.toFixed(2)} 元</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-400 text-lg">前天</div>
              <div className="text-red-400 text-lg">+{dayBeforeYesterday.pickupShare.toFixed(2)} 元</div>
            </div>
          </div>
        </div>

        {/* 派件分成 */}
        <div className="mb-6 bg-gray-100 p-4 rounded-md bg-pink-50">
          <div className="text-gray-900 font-xl mb-3">派件分成</div>
          <hr className='border-gray-300 mb-3' />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">今天</div>
              <div className="text-2xl font-bold text-red-500">+{today.deliveryShare.toFixed(2)} 元</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-500 text-xl">昨天</div>
              <div className="text-red-500 text-xl">+{yesterday.deliveryShare.toFixed(2)} 元</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-400 text-lg">前天</div>
              <div className="text-red-400 text-lg">+{dayBeforeYesterday.deliveryShare.toFixed(2)} 元</div>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white px-4 py-4 mb-4">
        {/* 账单明细 */}
        <div 
          className="flex justify-between items-center py-3 border-b cursor-pointer"
          onClick={handleViewDetail}
        >
          <div className="text-lg font-medium">账单明细</div>
          <div className="text-gray-400 flex items-center">
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <hr className='border-gray-300 mb-3'/>
        <div className="text-gray-400 text-lg">
          <span>日期: {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
} 