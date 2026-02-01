'use server'

import { pb } from '@/lib/pocketbase'
import { PerformanceData } from '@/types/performance'

// 获取所有员工姓名
export async function getEmployees() {
  try {
    const records = await pb.collection('performance').getFullList({
      fields: 'name',
    })
    const names = records.map(record => record.name)
    const uniqueNames = Array.from(new Set(names))
    return uniqueNames.filter(Boolean)
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
    if (data.date === null || data.date === undefined) {
      return { error: "日期不能为空" }
    }
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

// 按年月删除员工数据
export async function deleteEmployeeDataByMonth(name: string, year: number, month: number) {
  try {
    // 构建日期范围：从当月1号到下月1号（不包含）
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}" && date >= "${startDate}" && date < "${endDate}"`,
    })

    for (const record of records) {
      await pb.collection('performance').delete(record.id)
    }

    return { success: true, deletedCount: records.length }
  } catch (error) {
    console.error('Error deleting employee data by month:', error)
    return { error: '删除失败' }
  }
} 