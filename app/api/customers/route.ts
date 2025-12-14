import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { CustomerType } from "@prisma/client";
import { z } from "zod";

const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  alternatePhone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().default("Freetown"),
  countryId: z.string().optional().nullable(),
  regionId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
  chiefdomId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  type: z.nativeEnum(CustomerType).default(CustomerType.RETAIL),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

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
    const type = searchParams.get("type") as CustomerType | null;
    const tag = searchParams.get("tag") || null;
    const city = searchParams.get("city") || null;
    const regionId = searchParams.get("regionId") || null;
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
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { customerCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // Type filter
    if (type) {
      where.type = type;
    }

    // Tag filter
    if (tag) {
      where.tags = { has: tag };
    }

    // City filter
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    // Region filter
    if (regionId) {
      where.regionId = regionId;
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === "totalSpent") {
      orderBy.totalSpent = sortOrder;
    } else if (sortBy === "loyaltyScore") {
      orderBy.loyaltyScore = sortOrder;
    } else if (sortBy === "totalVisits") {
      orderBy.totalVisits = sortOrder;
    } else if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Fetch customers with relations
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          region: {
            select: {
              id: true,
              name: true,
            },
          },
          district: {
            select: {
              id: true,
              name: true,
            },
          },
          country: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              sales: true,
              customerInteractions: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Calculate stats
    const stats = await prisma.customer.aggregate({
      where: { ownerId: user.id },
      _sum: {
        totalSpent: true,
      },
      _avg: {
        loyaltyScore: true,
        totalSpent: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalCustomers: stats._count.id,
        totalRevenue: stats._sum.totalSpent || 0,
        averageLoyaltyScore: stats._avg.loyaltyScore || 0,
        averageSpent: stats._avg.totalSpent || 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = customerSchema.parse(body);

    // Combine first and last name
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim();

    // Check if phone already exists for this owner
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        ownerId: user.id,
        phone: validatedData.phone,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "A customer with this phone number already exists" },
        { status: 400 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: fullName,
        phone: validatedData.phone,
        alternatePhone: validatedData.alternatePhone || null,
        email: validatedData.email || null,
        address: validatedData.address || null,
        city: validatedData.city,
        countryId: validatedData.countryId || null,
        regionId: validatedData.regionId || null,
        districtId: validatedData.districtId || null,
        chiefdomId: validatedData.chiefdomId || null,
        locationId: validatedData.locationId || null,
        type: validatedData.type,
        tags: validatedData.tags,
        notes: validatedData.notes || null,
        ownerId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Customer created successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}

