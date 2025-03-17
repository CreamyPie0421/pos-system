'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SaleItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Sale {
  id: string;
  total: number;
  items: SaleItem[];
  createdAt: string;
  cashGiven: number | null;
  change: number | null;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching sales data...');
      
      const response = await fetch('/api/sales');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch sales:', errorData);
        throw new Error(`Failed to fetch sales: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Sales data fetched successfully:', data);
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const filteredSales = sales.filter(sale => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (sale.id?.toLowerCase() || '').includes(searchLower) ||
      sale.items?.some(item => 
        (item.productName?.toLowerCase() || '').includes(searchLower)
      ) || false;
    
    if (!selectedDate || !sale.createdAt) return matchesSearch;

    try {
      const saleDate = new Date(sale.createdAt);
      const filterDate = new Date(selectedDate);
      return matchesSearch && 
        saleDate.getFullYear() === filterDate.getFullYear() &&
        saleDate.getMonth() === filterDate.getMonth() &&
        saleDate.getDate() === filterDate.getDate();
    } catch (error) {
      console.error('Error comparing dates:', error);
      return false;
    }
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;

  if (isLoading) {
    return (
      <PageLayout title="Sales">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Sales">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error}</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Sales">
      <div className="h-full flex flex-col">
        <div className="space-y-6 flex-shrink-0">
          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by customer, transaction ID, or product..."
                className="w-full px-4 py-2 border rounded-lg text-gray-900 placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <input
                type="date"
                className="w-full px-4 py-2 border rounded-lg text-gray-900"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
              <p className="text-2xl font-semibold text-gray-900">₱{totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-semibold text-gray-900">{totalTransactions}</p>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mt-6 flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cash Given
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="group hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        {sale.items.map((item, index) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.productName} x{item.quantity}</span>
                            <span className="text-gray-500">₱{item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.cashGiven != null ? `₱${sale.cashGiven.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.change != null ? `₱${sale.change.toFixed(2)}` : '-'}
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