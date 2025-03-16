import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get sales for today
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
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

    return NextResponse.json(sales);
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