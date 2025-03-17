export interface DailyPerformanceData {
  id?: string
  name: string
  date: string
  pickupCount: number
  weight: number
  pickupShare: number
  deliveryCount: number
  deliveryWeight: number
  deliveryShare: number
}

export interface DailyPerformanceDataList {
  name: string
  list: Omit<DailyPerformanceData, 'id' | 'name'>[]
} 