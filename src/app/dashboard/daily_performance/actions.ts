'use server'

import { pb } from '@/lib/pocketbase'
import { DailyPerformanceData } from '@/types/daily_performance'

// 获取所有员工列表
export async function getEmployees() {
  try {
    const records = await pb.collection('daily_performance').getFullList({
      fields: 'name',
    })
    const employees = [...new Set(records.map(record => record.name))]
    return employees
  } catch (error) {
    console.error('Error fetching employees:', error)
    return []
  }
}

// 获取指定员工的业绩数据
export async function getEmployeePerformance(name: string) {
  try {
    const records = await pb.collection('daily_performance').getFullList({
      filter: `name = "${name}"`,
      sort: '-date',
    })
    return records
  } catch (error) {
    console.error('Error fetching employee performance:', error)
    return []
  }
}

// 更新或插入单条数据
export async function upsertPerformance(data: DailyPerformanceData) {
  try {
    const existingRecord = await pb.collection('daily_performance').getFirstListItem(
      `name = "${data.name}" && date = "${data.date}"`
    ).catch(() => null)

    if (existingRecord) {
      await pb.collection('daily_performance').update(existingRecord.id, data)
    } else {
      await pb.collection('daily_performance').create(data)
    }
    return { success: true }
  } catch (error) {
    console.error('Error upserting performance:', error)
    return { success: false, error: '保存失败' }
  }
}

// 批量更新或插入数据
export async function batchUpsertPerformance(
  name: string,
  dataList: Omit<DailyPerformanceData, 'id' | 'name'>[]
) {
  try {
    for (const data of dataList) {
      await upsertPerformance({ ...data, name })
    }
    return { success: true }
  } catch (error) {
    console.error('Error batch upserting performance:', error)
    return { success: false, error: '批量保存失败' }
  }
}

// 删除员工数据
export async function deleteEmployeeData(name: string) {
  try {
    const records = await pb.collection('daily_performance').getFullList({
      filter: `name = "${name}"`,
    })
    
    for (const record of records) {
      await pb.collection('daily_performance').delete(record.id)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting employee data:', error)
    return { success: false, error: '删除失败' }
  }
} 