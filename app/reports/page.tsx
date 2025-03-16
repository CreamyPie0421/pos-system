'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface SalesData {
  date: string;
  total: number;
  count: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  total: number;
  image: string | null;
}

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sales/reports?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const data = await response.json();
      setSalesData(data.salesData);
      setTopProducts(data.topProducts);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    switch (timeRange) {
      case 'daily':
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        return `Week ${Math.ceil(d.getDate() / 7)}`;
      case 'monthly':
        return d.toLocaleDateString('en-US', { month: 'short' });
      case 'yearly':
        return d.getFullYear().toString();
      default:
        return date;
    }
  };

  const calculateTotalSales = () => {
    return salesData.reduce((sum, data) => sum + data.total, 0);
  };

  const calculateTotalTransactions = () => {
    return salesData.reduce((sum, data) => sum + data.count, 0);
  };

  const calculateAverageTransactionValue = () => {
    const totalTransactions = calculateTotalTransactions();
    if (totalTransactions === 0) return 0;
    return calculateTotalSales() / totalTransactions;
  };

  const formatCurrency = (value: number) => {
    return `₱${value.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <PageLayout title="Sales Reports">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Sales Reports">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error}</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Sales Reports">
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex items-center space-x-4">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatCurrency(calculateTotalSales())}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <ShoppingCartIcon className="h-6 w-6 text-blue-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {calculateTotalTransactions()}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-500">Average Transaction</h3>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatCurrency(calculateAverageTransactionValue())}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 text-purple-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-500">Top Product</h3>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {topProducts[0]?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-500">
              {topProducts[0]?.quantity || 0} units
            </p>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  labelFormatter={formatDate}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 