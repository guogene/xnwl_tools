'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PerformanceData } from '@/types/performance'
import { getEmployeePerformance, getEmployeePerformanceByDateRange } from './actions'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { registerLocale } from "react-datepicker"
import { zhCN } from 'date-fns/locale/zh-CN'
import { Watermark } from 'watermark-js-plus';
import { Menu } from '@headlessui/react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

registerLocale('zh-CN', zhCN)

// 添加类型定义
interface DailyPerformance {
  name: string;
  date: string;
  pickupCount: number;
  weight: number;
  pickupShare: number;
  deliveryCount: number;
  deliveryWeight: number;
  deliveryShare: number;
}

// 修改快捷日期范围的类型定义
interface QuickRange {
  label: string;
  getValue: () => [Date, Date]; // 明确指定返回类型为元组
}

function PerformanceDetailContent() {
  const [data, setData] = useState<DailyPerformance[]>([])
  const [rangeData, setRangeData] = useState<DailyPerformance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  const [name, setName] = useState<string>('')

  useEffect(() => {
    // 首先尝试从sessionStorage获取
    const storedName = sessionStorage.getItem('name')
    
    if (storedName) {
      setName(storedName)
      return
    }

    // 如果sessionStorage中没有，则从URL参数获取
    const tempUsername = searchParams.get('temp_username')
    
    if (tempUsername) {
      // 存入sessionStorage
      sessionStorage.setItem('name', tempUsername)
      setName(tempUsername)
      // 移除URL参数并更新历史记录
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('temp_username')
      router.replace(`/performance_detail${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`)
    }
  }, [searchParams, router])
  
  // 从 URL 参数中获取日期范围
  const urlStartDate = searchParams.get('startDate')
  const urlEndDate = searchParams.get('endDate')
  
  // 修改初始化日期范围状态，默认为近一天
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(() => {
    if (urlStartDate && urlEndDate) {
      return [new Date(urlStartDate), new Date(urlEndDate)]
    }
    // 默认显示近一天
    return [dayjs().subtract(1, 'day').toDate(), dayjs().toDate()]
  })
  const [startDate, endDate] = dateRange

  // 加载最近三天的数据
  useEffect(() => {
    async function loadData() {
      if (name) {
        const watermark = new Watermark({
          content: name,
          width: 120,
          height: 100,
          globalAlpha: 0.1,
        })
        watermark.create();

        const today = dayjs()
        const threeDaysAgo = today.subtract(2, 'day')
        
        const performanceData = await getEmployeePerformance(
          name, 
          threeDaysAgo.format('YYYY-MM-DD')
        )
        // 转换数据格式
        const formattedData = performanceData.map(record => ({
          name: record.name || '',
          date: record.date || '',
          pickupCount: record.pickupCount || 0,
          weight: record.weight || 0,
          pickupShare: record.pickupShare || 0,
          deliveryCount: record.deliveryCount || 0,
          deliveryWeight: record.deliveryWeight || 0,
          deliveryShare: record.deliveryShare || 0
        }))
        setData(formattedData)
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
          dayjs(startDate).format('YYYY-MM-DD HH:mm:ss'),
          dayjs(endDate).format('YYYY-MM-DD HH:mm:ss')
        )
        // 将API返回的数据转换为DailyPerformance格式
        const formattedData = rangeData.map(record => ({
          name: record.name || '',
          date: record.date || '',
          pickupCount: record.pickupCount || 0,
          weight: record.weight || 0,
          pickupShare: record.pickupShare || 0,
          deliveryCount: record.deliveryCount || 0,
          deliveryWeight: record.deliveryWeight || 0,
          deliveryShare: record.deliveryShare || 0
        }))
        setRangeData(formattedData)
      }
    }
    loadRangeData()
  }, [name, startDate, endDate])

  // 计算总账单 - 修改计算逻辑
  const totalAmount = rangeData.reduce((sum, item) => 
    sum + (item.pickupShare || 0) + (item.deliveryShare || 0), 0
  )

  // 计算收件汇总数据
  const pickupSummary = rangeData.reduce((sum, item) => ({
    share: sum.share + (item.pickupShare || 0),
    count: sum.count + (item.pickupCount || 0),
    weight: sum.weight + (item.weight || 0)
  }), { share: 0, count: 0, weight: 0 })

  // 计算派件汇总数据
  const deliverySummary = rangeData.reduce((sum, item) => ({
    share: sum.share + (item.deliveryShare || 0),
    count: sum.count + (item.deliveryCount || 0),
    weight: sum.weight + (item.deliveryWeight || 0)
  }), { share: 0, count: 0, weight: 0 })

  // 获取指定日期的数据
  const getDayData = (daysAgo: number) => {
    const targetDate = dayjs().subtract(daysAgo, 'day')
    const targetDateStr = targetDate.format('YYYY-MM-DD')
    
    const dayData = data.find(item => dayjs(item.date).format('YYYY-MM-DD') === targetDateStr)
    return {
      pickupShare: dayData?.pickupShare || 0,
      deliveryShare: dayData?.deliveryShare || 0
    }
  }

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
      newSearchParams.set('startDate', dayjs(update[0]).format('YYYY-MM-DD HH:mm:ss'))
    } else {
      newSearchParams.delete('startDate')
    }
    if (update[1]) {
      newSearchParams.set('endDate', dayjs(update[1]).format('YYYY-MM-DD HH:mm:ss'))
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

  // 修改快捷日期范围的定义
  const quickRanges: QuickRange[] = [
    { 
      label: '近一天', 
      getValue: () => [dayjs().subtract(1, 'day').toDate(), dayjs().toDate()] as [Date, Date]
    },
    { 
      label: '近三天', 
      getValue: () => [dayjs().subtract(2, 'day').toDate(), dayjs().toDate()] as [Date, Date]
    },
    { 
      label: '近一周', 
      getValue: () => [dayjs().subtract(6, 'day').toDate(), dayjs().toDate()] as [Date, Date]
    },
    { 
      label: '本月', 
      getValue: () => [dayjs().startOf('month').toDate(), dayjs().toDate()] as [Date, Date]
    },
    { 
      label: '上月', 
      getValue: () => [dayjs().subtract(1, 'month').startOf('month').toDate(), dayjs().subtract(1, 'month').endOf('month').toDate()] as [Date, Date]
    },
  ]

  // 获取当前选中的日期范围标签
  const getCurrentRangeLabel = () => {
    if (!startDate || !endDate) return '快捷选择'
    
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    
    for (const range of quickRanges) {
      const [rangeStart, rangeEnd] = range.getValue()
      if (start.isSame(dayjs(rangeStart), 'day') && end.isSame(dayjs(rangeEnd), 'day')) {
        return range.label
      }
    }
    return '自定义'
  }

  // 修改handleQuickRangeSelect的类型
  const handleQuickRangeSelect = (range: QuickRange) => {
    const [start, end] = range.getValue()
    handleDateRangeChange([start, end])
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
    // <Watermark text="测试水印" style={{ overflow: 'hidden' }}>
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
      <div>
      <div className="flex items-center justify-between mb-4">
            <Menu as="div" className="relative">
              <Menu.Button className="min-w-[100px] px-4 py-2 text-sm bg-white rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-between">
                <span>{getCurrentRangeLabel()}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </Menu.Button>
              <Menu.Items className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  {quickRanges.map((range) => {
                    const [rangeStart, rangeEnd] = range.getValue()
                    const isSelected = startDate && endDate && 
                      dayjs(startDate).isSame(dayjs(rangeStart), 'day') && 
                      dayjs(endDate).isSame(dayjs(rangeEnd), 'day')
                    
                    return (
                      <Menu.Item key={range.label}>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } w-full text-left px-4 py-2 text-sm ${
                              isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'
                            } flex items-center justify-between`}
                            onClick={() => handleQuickRangeSelect(range)}
                          >
                            <span>{range.label}</span>
                            {isSelected && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        )}
                      </Menu.Item>
                    )
                  })}
                </div>
              </Menu.Items>
            </Menu>
            
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
          </div></div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-2xl font-bold">总账单</div>
          
        </div>
        <div className="text-3xl font-bold">{totalAmount.toFixed(2)} 元</div>
      </div>

      <div className="bg-white px-4 py-4 mb-4">
        {/* 账单明细 */}
        <div 
          className="flex justify-between items-center py-3 border-b cursor-pointer"
          onClick={handleViewDetail}
        >
          <div className="text-lg font-medium">月账单明细</div>
          <div className="text-gray-400 flex items-center">
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 我的账单 */}
      <div className="bg-white px-4 py-4 mb-4">        
        {/* 收件汇总 */}
        <div className="mb-6 bg-gray-100 p-4 rounded-md bg-violet-50">
          <div className="text-gray-900 font-xl mb-3">收件汇总</div>
          <hr className='border-gray-300 mb-3' />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-xl">分成</div>
              <div className="text-xl font-bold text-red-500">+{pickupSummary.share.toFixed(2)} 元</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600 text-lg">票数</div>
              <div className="text-lg text-gray-900">{pickupSummary.count} 票</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600 text-lg">重量</div>
              <div className="text-lg text-gray-900">{pickupSummary.weight.toFixed(2)} kg</div>
            </div>
          </div>
        </div>

        {/* 派件汇总 */}
        <div className="mb-6 bg-gray-100 p-4 rounded-md bg-pink-50">
          <div className="text-gray-900 font-xl mb-3">派件汇总</div>
          <hr className='border-gray-300 mb-3' />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-xl">分成</div>
              <div className="text-xl font-bold text-red-500">+{deliverySummary.share.toFixed(2)} 元</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600 text-lg">票数</div>
              <div className="text-lg text-gray-900">{deliverySummary.count} 票</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-gray-600 text-lg">重量</div>
              <div className="text-lg text-gray-900">{deliverySummary.weight.toFixed(2)} kg</div>
            </div>
          </div>
        </div>

      </div>
    </div>
    // </Watermark>
  )
}

export default function PerformanceDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      
      <PerformanceDetailContent />
      
    </Suspense>
  )
} 