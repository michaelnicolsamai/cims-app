import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { CustomerType } from "@prisma/client";
import { z } from "zod";

const updateCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  alternatePhone: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional(),
  countryId: z.string().optional().nullable(),
  regionId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
  chiefdomId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  type: z.nativeEnum(CustomerType).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const customerId = params.id;

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ownerId: user.id,
      },
      include: {
        region: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        country: { select: { id: true, name: true } },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer" },
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
    const customerId = params.id;
    const body = await request.json();

    // Verify customer belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ownerId: user.id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Validate input
    const validatedData = updateCustomerSchema.parse(body);

    // Check if phone is being updated and already exists
    if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
      const phoneExists = await prisma.customer.findFirst({
        where: {
          ownerId: user.id,
          phone: validatedData.phone,
          id: { not: customerId },
        },
      });

      if (phoneExists) {
        return NextResponse.json(
          { error: "A customer with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // Combine first and last name if provided
    let name = existingCustomer.name;
    if (validatedData.firstName || validatedData.lastName) {
      const firstName = validatedData.firstName || existingCustomer.name.split(" ")[0] || "";
      const lastName = validatedData.lastName || existingCustomer.name.split(" ").slice(1).join(" ") || "";
      name = `${firstName} ${lastName}`.trim();
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(name !== existingCustomer.name && { name }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(validatedData.alternatePhone !== undefined && { alternatePhone: validatedData.alternatePhone }),
        ...(validatedData.email !== undefined && { email: validatedData.email || null }),
        ...(validatedData.address !== undefined && { address: validatedData.address || null }),
        ...(validatedData.city && { city: validatedData.city }),
        ...(validatedData.countryId !== undefined && { countryId: validatedData.countryId || null }),
        ...(validatedData.regionId !== undefined && { regionId: validatedData.regionId || null }),
        ...(validatedData.districtId !== undefined && { districtId: validatedData.districtId || null }),
        ...(validatedData.chiefdomId !== undefined && { chiefdomId: validatedData.chiefdomId || null }),
        ...(validatedData.locationId !== undefined && { locationId: validatedData.locationId || null }),
        ...(validatedData.type && { type: validatedData.type }),
        ...(validatedData.tags && { tags: validatedData.tags }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
      },
      include: {
        region: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        country: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Customer updated successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update customer" },
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
    const customerId = params.id;

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        ownerId: user.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}

