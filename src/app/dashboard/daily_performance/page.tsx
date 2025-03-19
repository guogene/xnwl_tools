'use client'

import { useState, useEffect } from 'react'
import { DailyPerformanceData, DailyPerformanceDataList } from '@/types/daily_performance'
import * as XLSX from 'xlsx'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { 
  getEmployees, 
  getEmployeePerformance, 
  upsertPerformance, 
  batchUpsertPerformance,
  deleteEmployeeData 
} from './actions'
import dayjs from 'dayjs'

const columnHelper = createColumnHelper<DailyPerformanceData>()

const columns = [
  columnHelper.accessor('date', {
    header: '日期',
    cell: info => {
      const date = info.getValue()
      if (!date) return ''
      try {
        return dayjs(date).format('YYYY-MM-DD')
      } catch (e) {
        return date
      }
    },
  }),
  columnHelper.accessor('pickupCount', {
    header: '收件票数',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('weight', {
    header: '重量',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('pickupShare', {
    header: '收件分成',
    cell: info => info.getValue().toFixed(2),
  }),
  columnHelper.accessor('deliveryCount', {
    header: '派件票数',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('deliveryWeight', {
    header: '派件重量',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('deliveryShare', {
    header: '派件分成',
    cell: info => info.getValue().toFixed(2),
  }),
  columnHelper.display({
    id: 'actions',
    header: '操作',
    cell: props => (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => props.table.options.meta?.onEdit(props.row.original)}
          className="text-blue-600 hover:text-blue-800"
        >
          编辑
        </button>
      </div>
    ),
  }),
]

export default function DailyPerformance() {
  const [data, setData] = useState<DailyPerformanceData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [editingData, setEditingData] = useState<DailyPerformanceData | null>(null)
  const [employees, setEmployees] = useState<string[]>([])

  // 加载员工列表
  useEffect(() => {
    async function loadEmployees() {
      const employeeList = await getEmployees()
      setEmployees(employeeList)
    }
    loadEmployees()
  }, [])

  // 加载选中员工的数据
  useEffect(() => {
    async function loadEmployeeData() {
      if (selectedEmployee) {
        setIsLoading(true)
        const performanceData = await getEmployeePerformance(selectedEmployee)
        setData(performanceData)
        setIsLoading(false)
      }
    }
    loadEmployeeData()
  }, [selectedEmployee])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onEdit: (data: DailyPerformanceData) => {
        setEditingData(data)
      },
    },
  })

  const excelDateToJSDate = (excelDate: number) => {
    const jsTimestamp = (excelDate - 25569) * 86400 * 1000
    const jsDate = new Date(jsTimestamp)
    return dayjs(jsDate).format('YYYY-MM-DD')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (e) => {
        const workbook = XLSX.read(e.target?.result, { type: 'buffer' })
        
        // 遍历所有sheet
        for (const sheetName of workbook.SheetNames) {
          try {
            const sheet = workbook.Sheets[sheetName]
            
            // 获取员工姓名
            const nameCell = sheet['A1']
            const name = nameCell ? nameCell.v : null
            
            if (!name) {
              throw new Error('未找到员工姓名')
            }

            // 获取数据范围
            const ref = sheet['!ref']
            if (!ref) {
              throw new Error('sheet为空')
            }
            const range = XLSX.utils.decode_range(ref)
            
            // 提取表头（第二行）
            const headers: (string | null)[] = []
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col })
              const cell = sheet[cellAddress]
              headers[col] = cell ? cell.v : null
            }

            // 提取数据行（从第三行开始）
            const list = []
            for (let row = 2; row <= range.e.r; row++) {
              const rowData: Record<string, any> = {}
              let isEmpty = true

              for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
                const cell = sheet[cellAddress]
                const value = cell ? cell.v : null
                rowData[`col_${col}`] = value
                if (value !== null) isEmpty = false
              }

              if (!isEmpty) list.push(rowData)
            }

            // 构建数据列表
            const performanceDataList: DailyPerformanceDataList = {
              name: name,
              list: list.map(item => ({
                date: item.col_0 ? excelDateToJSDate(item.col_0) : null,
                pickupCount: item.col_1 ? parseInt(String(item.col_1)) : 0,
                weight: item.col_2 ? parseFloat(String(item.col_2)) : 0,
                pickupShare: item.col_3 ? parseFloat(String(item.col_3)) : 0,
                deliveryCount: item.col_4 ? parseInt(String(item.col_4)) : 0,
                deliveryWeight: item.col_5 ? parseFloat(String(item.col_5)) : 0,
                deliveryShare: item.col_6 ? parseFloat(String(item.col_6)) : 0,
              }))
            }

            // 保存到数据库
            const result = await batchUpsertPerformance(performanceDataList.name, performanceDataList.list)
            if (!result.success) {
              throw new Error(result.error)
            }

          } catch (error) {
            console.error(`处理工作表 "${sheetName}" 时出错:`, error)
            alert(`处理工作表 "${sheetName}" 时出错: ${error instanceof Error ? error.message : '未知错误'}`)
            return // 遇到错误时停止处理后续sheet
          }
        }

        // 所有sheet处理完成后，更新UI
        if (workbook.SheetNames.length > 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const nameCell = firstSheet['A1']
          const name = nameCell ? nameCell.v : null
          
          if (name) {
            const updatedData = await getEmployeePerformance(name)
            setData(updatedData as DailyPerformanceData[])
            setSelectedEmployee(name)
            
            const employeeList = await getEmployees()
            setEmployees(employeeList)
          }
        }

        alert('所有工作表处理完成')

      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error handling file upload:', error)
      alert('导入失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEmployeeData = async () => {
    if (!selectedEmployee) {
      alert('请先选择员工')
      return
    }

    if (confirm('确定要删除该员工的所有数据吗？')) {
      setIsLoading(true)
      const result = await deleteEmployeeData(selectedEmployee)
      if (result.success) {
        setData([])
        setSelectedEmployee('')
        const employeeList = await getEmployees()
        setEmployees(employeeList)
      } else {
        alert(result.error)
      }
      setIsLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingData || !selectedEmployee) return

    setIsLoading(true)
    const result = await upsertPerformance({
      ...editingData,
      name: selectedEmployee,
    })

    if (result.success) {
      const updatedData = await getEmployeePerformance(selectedEmployee)
      setData(updatedData)
      setEditingData(null)
    } else {
      alert(result.error)
    }
    setIsLoading(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">日报业绩管理</h2>
        <div className="flex items-center space-x-4">
          {/* 员工选择 */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="block w-48 px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">请选择员工</option>
            {employees.map(employee => (
              <option key={employee} value={employee}>
                {employee}
              </option>
            ))}
          </select>

          {/* 删除按钮 */}
          <button
            onClick={handleDeleteEmployeeData}
            disabled={!selectedEmployee || isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              (!selectedEmployee || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            删除数据
          </button>

          {/* 导入按钮 */}
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="excel-upload"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? '导入中...' : '导入 Excel'}
          </label>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="mt-4 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingData && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">编辑数据</h3>
              <button
                type="button"
                onClick={() => setEditingData(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">关闭</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {/* 日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    日期：{dayjs(editingData.date).format('YYYY-MM-DD')}
                  </label>
                </div>

                {/* 收件票数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">收件票数</label>
                  <input
                    type="number"
                    value={editingData.pickupCount}
                    onChange={(e) => setEditingData({...editingData, pickupCount: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* 重量 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">重量</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingData.weight}
                    onChange={(e) => setEditingData({...editingData, weight: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* 收件分成 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">收件分成</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingData.pickupShare}
                    onChange={(e) => setEditingData({...editingData, pickupShare: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* 派件票数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">派件票数</label>
                  <input
                    type="number"
                    value={editingData.deliveryCount}
                    onChange={(e) => setEditingData({...editingData, deliveryCount: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* 派件重量 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">派件重量</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingData.deliveryWeight}
                    onChange={(e) => setEditingData({...editingData, deliveryWeight: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {/* 派件分成 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">派件分成</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingData.deliveryShare}
                    onChange={(e) => setEditingData({...editingData, deliveryShare: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingData(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 