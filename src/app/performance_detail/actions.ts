'use server'

import { pb } from '@/lib/pocketbase'

// 获取从指定日期到现在的业绩数据
export async function getEmployeePerformance(name: string, fromDate: string) {
  try {
    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}" && date >= "${fromDate}"`,
      sort: '-date',
    })
    return records
  } catch (error) {
    console.error('Error fetching performance:', error)
    return []
  }
}

// 获取指定日期范围内的业绩数据
export async function getEmployeePerformanceByDateRange(name: string, startDate: string, endDate: string) {
  try {
    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}" && date >= "${startDate}" && date <= "${endDate}"`,
      sort: '-date',
    })
    return records
  } catch (error) {
    console.error('Error fetching performance by date range:', error)
    return []
  }
} 