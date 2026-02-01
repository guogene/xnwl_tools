'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PerformanceData } from '@/types/performance'
import { getEmployeePerformance, getEmployeePerformanceByMonth } from './actions'
import { Watermark } from 'watermark-js-plus';
import { Menu } from '@headlessui/react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

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

function PerformanceDetailContent() {
  const [data, setData] = useState<DailyPerformance[]>([])
  const [rangeData, setRangeData] = useState<DailyPerformance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  const [name, setName] = useState<string>('')

  // 年月选择状态，默认为当前年月
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1)
  const [showYearMonthPicker, setShowYearMonthPicker] = useState(false)

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

  // 从 URL 参数中获取年月
  useEffect(() => {
    const urlYear = searchParams.get('year')
    const urlMonth = searchParams.get('month')

    if (urlYear && urlMonth) {
      setSelectedYear(parseInt(urlYear))
      setSelectedMonth(parseInt(urlMonth))
    }
  }, [searchParams])

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

  // 加载选中年月的数据
  useEffect(() => {
    async function loadRangeData() {
      if (name && selectedYear && selectedMonth) {
        const rangeData = await getEmployeePerformanceByMonth(name, selectedYear, selectedMonth)
        console.log(rangeData)
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
  }, [name, selectedYear, selectedMonth])

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

  // 年月选择处理函数
  const handleYearMonthChange = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
    setShowYearMonthPicker(false)

    // 更新 URL 参数
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('year', year.toString())
    newSearchParams.set('month', month.toString())

    // 使用 replace 而不是 push 来避免创建新的历史记录
    router.replace(`/performance_detail?${newSearchParams.toString()}`)
  }

  // 修改查看明细的处理函数
  const handleViewDetail = () => {
    // 使用当前选中的年月构建日期范围
    const startDate = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`)
    const endDate = startDate.endOf('month')

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('startDate', startDate.format('YYYY-MM-DD HH:mm:ss'))
    newSearchParams.set('endDate', endDate.format('YYYY-MM-DD HH:mm:ss'))

    router.push(`/performance_list?${newSearchParams.toString()}`)
  }

  // 生成年份列表（最近5年）
  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i)

  // 生成月份列表
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

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
            {/* 年月选择器 */}
            <button
              onClick={() => setShowYearMonthPicker(true)}
              className="flex items-center px-4 py-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 shadow-sm"
            >
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-base font-medium text-gray-900">
                {selectedYear}年{selectedMonth}月
              </span>
              <svg className="w-4 h-4 ml-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
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

      {/* 年月选择器弹窗 */}
      {showYearMonthPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">选择年月</h3>
              <button
                onClick={() => setShowYearMonthPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 年份选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">年份</label>
              <div className="grid grid-cols-5 gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`py-3 px-4 rounded-lg text-center transition-colors ${
                      selectedYear === year
                        ? 'bg-blue-500 text-white font-semibold'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* 月份选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">月份</label>
              <div className="grid grid-cols-4 gap-2">
                {months.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`py-3 px-4 rounded-lg text-center transition-colors ${
                      selectedMonth === month
                        ? 'bg-blue-500 text-white font-semibold'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {month}月
                  </button>
                ))}
              </div>
            </div>

            {/* 确认按钮 */}
            <button
              onClick={() => handleYearMonthChange(selectedYear, selectedMonth)}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              确认
            </button>
          </div>
        </div>
      )}
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