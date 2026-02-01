'use server'

import { pb } from '@/lib/pocketbase'

// 获取从指定日期到现在的业绩数据
export async function getEmployeePerformance(name: string, startDate: string) {
  try {
    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}" && date >= "${startDate}"`,
      sort: '-date',
    });
    return records;
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    return [];
  }
}

// 获取指定日期范围内的业绩数据
export async function getEmployeePerformanceByDateRange(name: string, startDate: string, endDate: string) {
  try {
    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}" && date >= "${startDate}" && date <= "${endDate}"`,
      sort: '-date',
    });
    return records;
  } catch (error) {
    console.error('Error fetching employee performance by date range:', error);
    return [];
  }
}

// 按年月获取业绩数据
export async function getEmployeePerformanceByMonth(name: string, year: number, month: number) {
  try {
    // 构建日期范围：从当月1号到下月1号（不包含）
    const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01 00:00:00`

    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}" && date >= "${startDate}" && date < "${endDate}"`,
      sort: '-date',
    });
    return records;
  } catch (error) {
    console.error('Error fetching employee performance by month:', error);
    return [];
  }
} 