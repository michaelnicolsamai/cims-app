import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { PaymentMethod, PaymentStatus, SaleStatus } from "@prisma/client";
import { z } from "zod";
import { startOfDay, endOfDay, subDays, subMonths } from "date-fns";

const saleItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
});

const saleSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  amountPaid: z.number().min(0).default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PAID),
  status: z.nativeEnum(SaleStatus).default(SaleStatus.COMPLETED),
  saleDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  saleRegionId: z.string().optional().nullable(),
  saleDistrictId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = saleSchema.parse(body);

    // Generate invoice number
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    
    // Get the last invoice number for this month
    const lastSale = await prisma.sale.findFirst({
      where: {
        ownerId: user.id,
        invoiceNumber: {
          startsWith: `INV-${year}-${month}`,
        },
      },
      orderBy: {
        invoiceNumber: "desc",
      },
    });

    let invoiceNumber: string;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.invoiceNumber.split("-")[3] || "0");
      invoiceNumber = `INV-${year}-${month}-${String(lastNumber + 1).padStart(4, "0")}`;
    } else {
      invoiceNumber = `INV-${year}-${month}-0001`;
    }

    // Calculate balance due
    const balanceDue = validatedData.totalAmount - validatedData.amountPaid;

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber,
        customerId: validatedData.customerId || null,
        subtotal: validatedData.subtotal,
        discount: validatedData.discount,
        tax: validatedData.tax,
        totalAmount: validatedData.totalAmount,
        amountPaid: validatedData.amountPaid,
        balanceDue,
        paymentMethod: validatedData.paymentMethod,
        paymentStatus: validatedData.paymentStatus,
        status: validatedData.status,
        saleDate: validatedData.saleDate ? new Date(validatedData.saleDate) : new Date(),
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        notes: validatedData.notes,
        saleRegionId: validatedData.saleRegionId,
        saleDistrictId: validatedData.saleDistrictId,
        ownerId: user.id,
        soldById: user.id,
        items: {
          create: validatedData.items.map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update product stock if productId is provided
    for (const item of validatedData.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Update customer stats if customer exists
    if (validatedData.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: validatedData.customerId },
      });

      if (customer) {
        const now = new Date();
        await prisma.customer.update({
          where: { id: validatedData.customerId },
          data: {
            totalSpent: {
              increment: validatedData.totalAmount,
            },
            totalVisits: {
              increment: 1,
            },
            lastVisit: now,
            firstVisit: customer.firstVisit || now,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: sale,
      message: "Sale created successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sale" },
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
    const status = searchParams.get("status") as SaleStatus | null;
    const paymentStatus = searchParams.get("paymentStatus") as PaymentStatus | null;
    const paymentMethod = searchParams.get("paymentMethod") as PaymentMethod | null;
    const dateRange = searchParams.get("dateRange") || "all";
    const startDate = searchParams.get("startDate") || null;
    const endDate = searchParams.get("endDate") || null;
    const customerId = searchParams.get("customerId") || null;
    const sortBy = searchParams.get("sortBy") || "saleDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {
      ownerId: user.id,
    };

    // Search filter
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Payment method filter
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    // Date range filter
    if (dateRange !== "all" || startDate || endDate) {
      where.saleDate = {};
      
      if (startDate && endDate) {
        where.saleDate.gte = startOfDay(new Date(startDate));
        where.saleDate.lte = endOfDay(new Date(endDate));
      } else if (dateRange === "today") {
        const today = new Date();
        where.saleDate.gte = startOfDay(today);
        where.saleDate.lte = endOfDay(today);
      } else if (dateRange === "week") {
        where.saleDate.gte = startOfDay(subDays(new Date(), 7));
      } else if (dateRange === "month") {
        where.saleDate.gte = startOfDay(subMonths(new Date(), 1));
      }
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === "invoiceNumber") {
      orderBy.invoiceNumber = sortOrder;
    } else if (sortBy === "totalAmount") {
      orderBy.totalAmount = sortOrder;
    } else if (sortBy === "saleDate") {
      orderBy.saleDate = sortOrder;
    } else if (sortBy === "customer") {
      orderBy.customer = { name: sortOrder };
    } else {
      orderBy.saleDate = sortOrder;
    }

    // Fetch sales
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
          saleRegion: {
            select: {
              id: true,
              name: true,
            },
          },
          soldBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    // Calculate stats
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfDay(subDays(now, 7));
    const monthStart = startOfDay(subMonths(now, 1));

    const [
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      totalSales,
      todaySales,
      pendingPayments,
      overduePayments,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { ownerId: user.id, status: "COMPLETED" },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: {
          ownerId: user.id,
          status: "COMPLETED",
          saleDate: { gte: todayStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: {
          ownerId: user.id,
          status: "COMPLETED",
          saleDate: { gte: weekStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: {
          ownerId: user.id,
          status: "COMPLETED",
          saleDate: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.sale.count({
        where: { ownerId: user.id, status: "COMPLETED" },
      }),
      prisma.sale.count({
        where: {
          ownerId: user.id,
          status: "COMPLETED",
          saleDate: { gte: todayStart },
        },
      }),
      prisma.sale.aggregate({
        where: {
          ownerId: user.id,
          paymentStatus: { in: ["PENDING", "PARTIAL"] },
        },
        _sum: { balanceDue: true },
      }),
      prisma.sale.aggregate({
        where: {
          ownerId: user.id,
          paymentStatus: "OVERDUE",
        },
        _sum: { balanceDue: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
        weekRevenue: Number(weekRevenue._sum.totalAmount || 0),
        monthRevenue: Number(monthRevenue._sum.totalAmount || 0),
        totalSales,
        todaySales,
        pendingPayments: Number(pendingPayments._sum.balanceDue || 0),
        overduePayments: Number(overduePayments._sum.balanceDue || 0),
      },
    });
  } catch (error: any) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales" },
      { status: 500 }
    );
  }
}
