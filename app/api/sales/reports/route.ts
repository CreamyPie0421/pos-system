import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || 'daily';

    // Get date range based on timeRange
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    let endDate = new Date();
    switch (timeRange) {
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default: // daily
        endDate.setDate(endDate.getDate() + 1);
    }

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Process data based on timeRange
    const salesData = processSalesData(sales, timeRange);
    const topProducts = await getTopProducts(sales);

    return NextResponse.json({
      salesData,
      topProducts
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
  const productSales: { [key: string]: { name: string; quantity: number; total: number; image: string | null } } = {};

  sales.forEach(sale => {
    sale.items.forEach((item: any) => {
      const productId = item.productId;
      if (!productSales[productId]) {
        productSales[productId] = {
          name: item.product.name,
          quantity: 0,
          total: 0,
          image: item.product.image
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