'use server'

import { pb } from '@/lib/pocketbase'
import { PerformanceData } from '@/types/performance'

// 获取所有员工姓名
export async function getEmployees() {
  try {
    const records = await pb.collection('performance').getFullList({
      fields: 'name',
      groupBy: 'name',
    })
    return [...new Set(records.map(record => record.name))].filter(Boolean)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return []
  }
}

// 获取指定员工的业绩数据
export async function getEmployeePerformance(name: string) {
  try {
    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}"`,
      sort: '-date',
    })
    return records
  } catch (error) {
    console.error('Error fetching performance:', error)
    return []
  }
}

// 更新或创建业绩数据
export async function upsertPerformance(data: PerformanceData & { name: string }) {
  try {
    // 检查是否存在相同日期和姓名的记录
    const existingRecords = await pb.collection('performance').getFullList({
      filter: `name = "${data.name}" && date = "${data.date}"`,
    })

    if (existingRecords.length > 0) {
      // 更新现有记录
      await pb.collection('performance').update(existingRecords[0].id, data)
    } else {
      // 创建新记录
      await pb.collection('performance').create(data)
    }
    return { success: true }
  } catch (error) {
    console.error('Error upserting performance:', error)
    return { error: '保存失败' }
  }
}

// 批量更新或创建业绩数据
export async function batchUpsertPerformance(name: string, dataList: PerformanceData[]) {
  try {
    for (const data of dataList) {
      await upsertPerformance({ ...data, name })
    }
    return { success: true }
  } catch (error) {
    console.error('Error batch upserting performance:', error)
    return { error: '批量保存失败' }
  }
}

// 删除员工数据
export async function deleteEmployeeData(name: string) {
  try {
    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}"`,
    })
    
    for (const record of records) {
      await pb.collection('performance').delete(record.id)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting employee data:', error)
    return { error: '删除失败' }
  }
} 