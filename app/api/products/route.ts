import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  category: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().min(0, "Cost price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  currentStock: z.number().int().min(0, "Stock must be non-negative"),
  lowStockAlert: z.number().int().min(0, "Low stock alert must be non-negative"),
  unit: z.string().default("piece"),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.ACTIVE),
  barcode: z.string().optional(),
  supplier: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = productSchema.parse(body);

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: validatedData.sku },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this SKU already exists" },
        { status: 400 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        ownerId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Search
    const search = searchParams.get("search") || "";

    // Filters
    const status = searchParams.get("status") as ProductStatus | null;
    const category = searchParams.get("category") || null;
    const lowStock = searchParams.get("lowStock") === "true";
    const outOfStock = searchParams.get("outOfStock") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {
      ownerId: user.id,
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Category filter
    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    // Out of stock filter
    if (outOfStock) {
      where.currentStock = { equals: 0 };
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else if (sortBy === "currentStock") {
      orderBy.currentStock = sortOrder;
    } else if (sortBy === "sellingPrice") {
      orderBy.sellingPrice = sortOrder;
    } else if (sortBy === "costPrice") {
      orderBy.costPrice = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Fetch all products first if low stock filter is needed
    let products: any[];
    let total: number;

    if (lowStock && !outOfStock) {
      const allProducts = await prisma.product.findMany({
        where,
        include: {
          _count: {
            select: {
              saleItems: true,
            },
          },
        },
      });

      const lowStockProducts = allProducts.filter(
        (p) => p.currentStock > 0 && p.currentStock <= p.lowStockAlert
      );

      lowStockProducts.sort((a, b) => {
        const aVal = a[sortBy as keyof typeof a];
        const bVal = b[sortBy as keyof typeof b];
        if (sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });

      total = lowStockProducts.length;
      products = lowStockProducts.slice(skip, skip + limit);
    } else {
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            _count: {
              select: {
                saleItems: true,
              },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);
    }

    // Calculate stats
    const stats = await prisma.product.aggregate({
      where: { ownerId: user.id },
      _sum: {
        currentStock: true,
        sellingPrice: true,
        costPrice: true,
      },
      _avg: {
        sellingPrice: true,
        costPrice: true,
      },
      _count: {
        id: true,
      },
    });

    const allProductsForStats = await prisma.product.findMany({
      where: { ownerId: user.id },
      select: { currentStock: true, lowStockAlert: true },
    });

    const lowStockCount = allProductsForStats.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.lowStockAlert
    ).length;

    const outOfStockCount = await prisma.product.count({
      where: {
        ownerId: user.id,
        currentStock: { equals: 0 },
      },
    });

    const activeCount = await prisma.product.count({
      where: {
        ownerId: user.id,
        status: "ACTIVE",
      },
    });

    const allProducts = await prisma.product.findMany({
      where: { ownerId: user.id },
      select: {
        currentStock: true,
        costPrice: true,
      },
    });

    const totalInventoryValue = allProducts.reduce((sum, product) => {
      return sum + Number(product.currentStock) * Number(product.costPrice);
    }, 0);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalProducts: stats._count.id,
        totalInventoryValue,
        averageSellingPrice: stats._avg.sellingPrice || 0,
        averageCostPrice: stats._avg.costPrice || 0,
        lowStockCount,
        outOfStockCount,
        activeCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
