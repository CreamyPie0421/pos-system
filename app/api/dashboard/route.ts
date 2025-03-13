import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get yesterday's date range for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get sales statistics
    const [
      todaySales,
      yesterdaySales,
      todayProductsSold,
      yesterdayProductsSold,
      recentTransactions
    ] = await Promise.all([
      // Today's total sales
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          status: 'COMPLETED'
        },
        _sum: {
          total: true
        }
      }),

      // Yesterday's total sales
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          },
          status: 'COMPLETED'
        },
        _sum: {
          total: true
        }
      }),

      // Today's products sold
      prisma.saleItem.aggregate({
        where: {
          sale: {
            createdAt: {
              gte: today,
              lt: tomorrow
            },
            status: 'COMPLETED'
          }
        },
        _sum: {
          quantity: true
        }
      }),

      // Yesterday's products sold
      prisma.saleItem.aggregate({
        where: {
          sale: {
            createdAt: {
              gte: yesterday,
              lt: today
            },
            status: 'COMPLETED'
          }
        },
        _sum: {
          quantity: true
        }
      }),

      // Recent transactions
      prisma.sale.findMany({
        where: {
          status: 'COMPLETED'
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    // Calculate percentage changes
    const todayTotal = todaySales._sum.total || 0;
    const yesterdayTotal = yesterdaySales._sum.total || 0;
    const salesChange = yesterdayTotal ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;

    const todayProducts = todayProductsSold._sum.quantity || 0;
    const yesterdayProducts = yesterdayProductsSold._sum.quantity || 0;
    const productsChange = yesterdayProducts ? ((todayProducts - yesterdayProducts) / yesterdayProducts) * 100 : 0;

    // Calculate average sale
    const averageSale = todayProducts ? todayTotal / todayProducts : 0;
    const yesterdayAverage = yesterdayProducts ? yesterdayTotal / yesterdayProducts : 0;
    const averageChange = yesterdayAverage ? ((averageSale - yesterdayAverage) / yesterdayAverage) * 100 : 0;

    // Get unique customers count
    const uniqueCustomers = await prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: 'COMPLETED'
      },
      _count: true
    });

    const yesterdayCustomers = await prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        },
        status: 'COMPLETED'
      },
      _count: true
    });

    const customersChange = yesterdayCustomers.length 
      ? ((uniqueCustomers.length - yesterdayCustomers.length) / yesterdayCustomers.length) * 100 
      : 0;

    return NextResponse.json({
      stats: {
        totalSales: {
          value: todayTotal,
          change: salesChange
        },
        productsSold: {
          value: todayProducts,
          change: productsChange
        },
        activeCustomers: {
          value: uniqueCustomers.length,
          change: customersChange
        },
        averageSale: {
          value: averageSale,
          change: averageChange
        }
      },
      recentTransactions
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 