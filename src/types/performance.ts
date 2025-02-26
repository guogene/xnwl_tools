export interface PerformanceData {
  date: string
  pickupCount: number
  weight: number
  quantity: number
  freight: number
  transferFee: number
  scanningFee: number
  fundFee: number
  electronicOrder: number
  pickupShare: number
  deliveryCount: number
  deliveryWeight: number
  deliveryShare: number
} 

export interface PerformanceDataList {
  name: string
  list: PerformanceData[]
}