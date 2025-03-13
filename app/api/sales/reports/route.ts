import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'daily';

    // Get date range based on timeRange
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 7); // Last 7 days
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 28); // Last 4 weeks
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 6); // Last 6 months
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1); // Last year
        break;
    }

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Process sales data for the chart
    const salesData = processSalesData(sales, timeRange);

    // Get top products
    const topProducts = await getTopProducts(sales);

    return NextResponse.json({
      salesData,
      topProducts,
    });
  } catch (error) {
    console.error('Error fetching sales reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales reports' },
      { status: 500 }
    );
  }
}

function processSalesData(sales: any[], timeRange: string) {
  const data: { [key: string]: { total: number; count: number } } = {};

  sales.forEach(sale => {
    let key: string;
    const date = new Date(sale.createdAt);

    switch (timeRange) {
      case 'daily':
        key = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekNumber = Math.ceil(date.getDate() / 7);
        key = `Week ${weekNumber}`;
        break;
      case 'monthly':
        key = date.toLocaleDateString('en-US', { month: 'short' });
        break;
      case 'yearly':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!data[key]) {
      data[key] = { total: 0, count: 0 };
    }

    data[key].total += sale.total;
    data[key].count += 1;
  });

  // Convert to array and sort by date
  return Object.entries(data)
    .map(([date, { total, count }]) => ({
      date,
      total,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getTopProducts(sales: any[]) {
  const productSales: { [key: string]: { name: string; quantity: number; total: number } } = {};

  sales.forEach(sale => {
    sale.items.forEach((item: any) => {
      const productId = item.productId;
      if (!productSales[productId]) {
        productSales[productId] = {
          name: item.product.name,
          quantity: 0,
          total: 0,
        };
      }

      productSales[productId].quantity += item.quantity;
      productSales[productId].total += item.subtotal;
    });
  });

  // Convert to array and sort by total sales
  return Object.values(productSales)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Get top 10 products
} 