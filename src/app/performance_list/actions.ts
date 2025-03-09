'use server'

import { pb } from '@/lib/pocketbase'

export async function getPerformanceList(name: string, startDate: string, endDate: string) {
  try {
    const records = await pb.collection('performance').getFullList({
      filter: `name = "${name}" && date >= "${startDate}" && date <= "${endDate}"`,
      sort: '-date',
    })
    return records
  } catch (error) {
    console.error('Error fetching performance list:', error)
    return []
  }
} 