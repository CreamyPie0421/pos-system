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
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
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

    fetchDashboardData();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
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
        <div className="p-6">
          {/* Mobile View: Recent Transactions */}
          <div className="block lg:hidden mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData?.recentTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₱{transaction.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Today's Sales</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">₱{dashboardData?.stats.totalSales.value.toFixed(2)}</p>
              <div className="mt-4">
                <div className="text-sm text-gray-500">
                  {dashboardData?.stats.totalSales.change && (
                    <>
                      {dashboardData?.stats.totalSales.change > 0 ? (
                        <span className="text-green-600">↑ {dashboardData?.stats.totalSales.change.toFixed(1)}%</span>
                      ) : (
                        <span className="text-red-600">↓ {Math.abs(dashboardData?.stats.totalSales.change).toFixed(1)}%</span>
                      )} vs yesterday
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{dashboardData?.stats.productsSold.value.toString() || '0'}</p>
              <div className="mt-4">
                <div className="text-sm text-gray-500">
                  {/* Assuming lowStockProducts is not provided in the original data */}
                  {/* Add logic to calculate lowStockProducts based on productsSold */}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Categories</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{/* Assuming totalCategories is not provided in the original data */}</p>
              <div className="mt-4">
                <div className="text-sm text-gray-500">
                  {/* Assuming totalProducts is not provided in the original data */}
                  {/* Add logic to calculate totalProducts based on productsSold */}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">₱{dashboardData?.stats.totalSales.value.toFixed(2)}</p>
              <div className="mt-4">
                <div className="text-sm text-gray-500">
                  {/* Assuming totalTransactions is not provided in the original data */}
                  {/* Add logic to calculate totalTransactions based on recentTransactions */}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop View: Recent Transactions */}
          <div className="hidden lg:block">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData?.recentTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₱{transaction.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
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
    </PageLayout>
  );
} 