import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/sales
export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true,
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
  }
}

// DELETE /api/sales (Clear all sales)
export async function DELETE() {
  try {
    // Delete all sale items first due to foreign key constraints
    await prisma.saleItem.deleteMany({});
    
    // Then delete all sales
    await prisma.sale.deleteMany({});
    
    return NextResponse.json({ message: 'All sales records cleared successfully' });
  } catch (error) {
    console.error('Error clearing sales:', error);
    return NextResponse.json({ error: 'Failed to clear sales records' }, { status: 500 });
  }
}

// POST /api/sales
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Invalid items data' }, { status: 400 });
    }

    if (typeof body.subtotal !== 'number' || typeof body.tax !== 'number' || typeof body.total !== 'number') {
      return NextResponse.json({ error: 'Invalid amount values' }, { status: 400 });
    }

    if (typeof body.cash !== 'number' || body.cash < body.total) {
      return NextResponse.json({ error: 'Invalid cash amount' }, { status: 400 });
    }

    // For now, we'll use a hardcoded user ID (the admin we created in seed)
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 400 });
    }

    console.log('Creating sale with data:', body);

    // Validate items structure
    const saleItems = body.items.map((item: any) => {
      if (!item.productId || !item.quantity || !item.price || !item.subtotal) {
        throw new Error('Invalid item data structure');
      }
      return {
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      };
    });

    console.log('Validated sale items:', saleItems);

    const sale = await prisma.sale.create({
      data: {
        userId: user.id,
        subtotal: Number(body.subtotal),
        tax: Number(body.tax),
        total: Number(body.total),
        cashGiven: Number(body.cash),
        change: Number(body.change),
        status: 'COMPLETED',
        items: {
          create: saleItems
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

    console.log('Sale created successfully:', sale);

    // Update product stock
    await Promise.all(
      body.items.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      )
    );

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Error creating sale: ' + errorMessage }, { status: 500 });
  }
} 