import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  sku: z.string().optional(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  currentStock: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const productId = params.id;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: user.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const productId = params.id;
    const body = await request.json();

    // Verify product belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: user.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Validate input
    const validatedData = updateProductSchema.parse(body);

    // Check if SKU is being updated and already exists
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: {
          ownerId: user.id,
          sku: validatedData.sku,
          id: { not: productId },
        },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: "A product with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.sku && { sku: validatedData.sku }),
        ...(validatedData.barcode !== undefined && { barcode: validatedData.barcode || null }),
        ...(validatedData.description !== undefined && { description: validatedData.description || null }),
        ...(validatedData.category !== undefined && { category: validatedData.category || null }),
        ...(validatedData.unit && { unit: validatedData.unit }),
        ...(validatedData.costPrice !== undefined && { costPrice: validatedData.costPrice }),
        ...(validatedData.sellingPrice !== undefined && { sellingPrice: validatedData.sellingPrice }),
        ...(validatedData.currentStock !== undefined && { currentStock: validatedData.currentStock }),
        ...(validatedData.lowStockAlert !== undefined && { lowStockAlert: validatedData.lowStockAlert }),
        ...(validatedData.status && { status: validatedData.status }),
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
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
    const productId = params.id;

    // Verify product belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: user.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}

