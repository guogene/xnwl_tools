'use server'

import { pb } from '@/lib/pocketbase'

// 获取从指定日期到现在的业绩数据
export async function getEmployeePerformance(name: string, startDate: string) {
  try {
    const records = await pb.collection('daily_performance').getList(1, 50, {
      filter: `name = "${name}" && date >= "${startDate}"`,
      sort: '-date',
    });
    return records.items;
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    return [];
  }
}

// 获取指定日期范围内的业绩数据
export async function getEmployeePerformanceByDateRange(name: string, startDate: string, endDate: string) {
  try {
    const records = await pb.collection('daily_performance').getList(1, 50, {
      filter: `name = "${name}" && date >= "${startDate}" && date <= "${endDate}"`,
      sort: '-date',
    });
    return records.items;
  } catch (error) {
    console.error('Error fetching employee performance by date range:', error);
    return [];
  }
} 