'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { 
  BanknotesIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  stats: {
    totalSales: { value: number; change: number };
    productsSold: { value: number; change: number };
    activeCustomers: { value: number; change: number };
    averageSale: { value: number; change: number };
  };
  recentTransactions: {
    id: string;
    customer: { name: string } | null;
    items: {
      quantity: number;
      product: { name: string };
    }[];
    total: number;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error}</div>
        </div>
      </PageLayout>
    );
  }

  const stats = [
    { 
      name: 'Total Sales Today', 
      value: `₱${dashboardData?.stats.totalSales.value.toFixed(2)}`, 
      icon: BanknotesIcon, 
      change: `${dashboardData?.stats.totalSales.change?.toFixed(1) || '0'}%`,
      changeType: (dashboardData?.stats.totalSales.change || 0) >= 0 ? 'positive' : 'negative'
    },
    { 
      name: 'Products Sold', 
      value: dashboardData?.stats.productsSold.value.toString() || '0', 
      icon: ShoppingBagIcon, 
      change: `${dashboardData?.stats.productsSold.change?.toFixed(1) || '0'}%`,
      changeType: (dashboardData?.stats.productsSold.change || 0) >= 0 ? 'positive' : 'negative'
    },
    { 
      name: 'Active Customers', 
      value: dashboardData?.stats.activeCustomers.value.toString() || '0', 
      icon: UserGroupIcon, 
      change: `${dashboardData?.stats.activeCustomers.change?.toFixed(1) || '0'}%`,
      changeType: (dashboardData?.stats.activeCustomers.change || 0) >= 0 ? 'positive' : 'negative'
    },
    { 
      name: 'Average Sale', 
      value: `₱${dashboardData?.stats.averageSale.value.toFixed(2)}`, 
      icon: ChartBarIcon, 
      change: `${dashboardData?.stats.averageSale.change?.toFixed(1) || '0'}%`,
      changeType: (dashboardData?.stats.averageSale.change || 0) >= 0 ? 'positive' : 'negative'
    },
  ];

  return (
    <PageLayout title="Dashboard">
      <div className="h-full flex flex-col">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-white">
                          Transaction ID
                        </th>
                        <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-white">
                          Customer
                        </th>
                        <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-white">
                          Products
                        </th>
                        <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-white">
                          Total
                        </th>
                        <th className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-white">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData?.recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{transaction.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.customer?.name || 'Walk-in Customer'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} items
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{transaction.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 