"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PivotConfig, PivotResult, PivotTableUtils, SampleData } from './module/wasm-interface'

interface PivotTableProps {
  className?: string
}

const PivotTable: React.FC<PivotTableProps> = ({ className }) => {
  const [data, setData] = useState<Record<string, string>[]>([])
  const [config, setConfig] = useState<PivotConfig>({
    row_fields: ['Product'],
    column_fields: ['Region'],
    value_fields: ['Sales'],
    aggregation: 'sum'
  })
  const [result, setResult] = useState<PivotResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableFields, setAvailableFields] = useState<string[]>([])

  // Load sample data on component mount
  useEffect(() => {
    const sampleData = SampleData.getSalesData()
    setData(sampleData)
    if (sampleData.length > 0) {
      setAvailableFields(Object.keys(sampleData[0]))
    }
  }, [])

  // Generate pivot table
  const generatePivot = useCallback(async () => {
    if (data.length === 0) {
      setError('No data available')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const pivotResult = await PivotTableUtils.quickPivot(
        data,
        config.row_fields[0],
        config.column_fields[0],
        config.value_fields[0],
        config.aggregation
      )
      setResult(pivotResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pivot table')
    } finally {
      setLoading(false)
    }
  }, [data, config])

  // Update config handlers
  const updateRowField = (field: string) => {
    setConfig(prev => ({ ...prev, row_fields: [field] }))
  }

  const updateColumnField = (field: string) => {
    setConfig(prev => ({ ...prev, column_fields: [field] }))
  }

  const updateValueField = (field: string) => {
    setConfig(prev => ({ ...prev, value_fields: [field] }))
  }

  const updateAggregation = (aggregation: PivotConfig['aggregation']) => {
    setConfig(prev => ({ ...prev, aggregation }))
  }

  // Load different sample datasets
  const loadSalesData = () => {
    const salesData = SampleData.getSalesData()
    setData(salesData)
    setConfig({
      row_fields: ['Product'],
      column_fields: ['Region'],
      value_fields: ['Sales'],
      aggregation: 'sum'
    })
    setResult(null)
  }

  const loadEmployeeData = () => {
    const employeeData = SampleData.getEmployeeData()
    setData(employeeData)
    setConfig({
      row_fields: ['Department'],
      column_fields: ['Position'],
      value_fields: ['Salary'],
      aggregation: 'sum'
    })
    setResult(null)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Pivot Table with WASM + Rust
            <Badge variant="secondary">High Performance</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Data Buttons */}
          <div className="flex gap-2">
            <Button onClick={loadSalesData} variant="outline" size="sm">
              Load Sales Data
            </Button>
            <Button onClick={loadEmployeeData} variant="outline" size="sm">
              Load Employee Data
            </Button>
          </div>

          <Separator />

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="row-field">Row Field</Label>
              <Select value={config.row_fields[0]} onValueChange={updateRowField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select row field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(field => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="column-field">Column Field</Label>
              <Select value={config.column_fields[0]} onValueChange={updateColumnField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(field => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value-field">Value Field</Label>
              <Select value={config.value_fields[0]} onValueChange={updateValueField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select value field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(field => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aggregation">Aggregation</Label>
              <Select value={config.aggregation} onValueChange={updateAggregation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select aggregation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                  <SelectItem value="min">Min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generatePivot} 
            disabled={loading || data.length === 0}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Pivot Table'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Pivot Table Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {result.headers.map((header, index) => (
                      <TableHead key={index} className="font-semibold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={rowIndex === result.rows.length - 1 ? 'bg-gray-50 font-semibold' : ''}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className={cellIndex === 0 ? 'font-medium' : 'text-right'}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 mb-2">
              Showing {data.length} rows
            </div>
            <div className="overflow-x-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    {availableFields.map(field => (
                      <TableHead key={field} className="text-xs">
                        {field}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {availableFields.map(field => (
                        <TableCell key={field} className="text-xs">
                          {row[field] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {data.length > 5 && (
              <div className="text-xs text-gray-500 mt-2">
                ... and {data.length - 5} more rows
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PivotTable
