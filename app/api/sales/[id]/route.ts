import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const saleId = params.id;

    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        ownerId: user.id,
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        saleItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const saleId = params.id;

    // Verify sale belongs to user
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        ownerId: user.id,
      },
      include: {
        saleItems: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    // Restore product stock
    for (const item of sale.saleItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Delete sale (cascade will delete saleItems)
    await prisma.sale.delete({
      where: { id: saleId },
    });

    return NextResponse.json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete sale" },
      { status: 500 }
    );
  }
}

