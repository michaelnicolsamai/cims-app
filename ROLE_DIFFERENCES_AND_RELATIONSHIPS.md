# Role Differences and Relationships in CIMS

## Overview

The Customer Insight Management System (CIMS) uses a **role-based access control (RBAC)** system with three distinct roles: **ADMIN**, **MANAGER**, and **STAFF**. Understanding their differences and relationships is crucial for using the system effectively.

---

## 🔑 Key Differences Between Roles

### 1. ADMIN (Business Owner/System Administrator)

**Purpose**: Full system control and ownership

**Access Level**: ✅ **Full Access** - Can access all features

**Accessible Features:**
- ✅ Dashboard (comprehensive overview)
- ✅ Customer Insights (full analytics)
- ✅ Sales Analytics (advanced metrics)
- ✅ Customer Segments (RFM analysis)
- ✅ Customers Management (full CRUD)
- ✅ Products Management (full CRUD)
- ✅ Sales Management (full CRUD)
- ✅ Reports (all report types)
- ✅ **Settings** (system configuration) - **ADMIN ONLY**
- ✅ **User Management** (create/edit users) - **ADMIN ONLY**

**Key Responsibilities:**
- Configure system settings (currency, timezone, notifications)
- Create and manage user accounts (assign roles)
- Access all business data and analytics
- Generate comprehensive reports
- Manage business-wide operations

**Route Prefix**: `/dashboard/admin`

---

### 2. MANAGER

**Purpose**: Operational management with analytics access

**Access Level**: ⚠️ **Management Access** - Can view analytics but cannot change system settings

**Accessible Features:**
- ✅ Dashboard (comprehensive overview)
- ✅ Customer Insights (full analytics)
- ✅ Sales Analytics (advanced metrics)
- ✅ Customer Segments (RFM analysis)
- ✅ Customers Management (full CRUD)
- ✅ Products Management (full CRUD)
- ✅ Sales Management (full CRUD)
- ✅ Reports (all report types)
- ❌ **Settings** - No Access
- ❌ **User Management** - No Access

**Key Responsibilities:**
- View and analyze business metrics
- Manage day-to-day operations (customers, products, sales)
- Generate and export reports
- Monitor business performance
- Cannot modify system settings or manage users

**Route Prefix**: `/dashboard/manager`

---

### 3. STAFF

**Purpose**: Day-to-day operational tasks

**Access Level**: ⚠️ **Operational Access** - Limited analytics, focus on operations

**Accessible Features:**
- ✅ Dashboard (basic overview)
- ✅ Customer Insights (basic customer analysis only)
- ✅ Customers Management (full CRUD)
- ✅ Products Management (full CRUD)
- ✅ Sales Management (full CRUD)
- ❌ **Sales Analytics** - No Access
- ❌ **Customer Segments** - No Access
- ❌ **Reports** - No Access
- ❌ **Settings** - No Access
- ❌ **User Management** - No Access

**Key Responsibilities:**
- Perform daily operations (add customers, products, record sales)
- View basic customer information and insights
- Manage inventory and sales transactions
- Cannot access advanced analytics or reports
- Cannot modify system settings

**Route Prefix**: `/dashboard/staff`

---

## 📊 Permission Comparison Matrix

| Feature | ADMIN | MANAGER | STAFF |
|---------|:-----:|:-------:|:-----:|
| Dashboard | ✅ Full | ✅ Full | ✅ Basic |
| Customer Insights | ✅ Full | ✅ Full | ✅ Basic Only |
| Sales Analytics | ✅ | ✅ | ❌ |
| Customer Segments | ✅ | ✅ | ❌ |
| Customers (CRUD) | ✅ | ✅ | ✅ |
| Products (CRUD) | ✅ | ✅ | ✅ |
| Sales (CRUD) | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |

---

## 🔗 Relationships and Communication Flow

### **Current System Architecture: NO EXPLICIT HIERARCHICAL RELATIONSHIPS**

#### 1. **User Model Structure**
```prisma
model User {
  id            String    @id
  name          String
  email         String    @unique
  role          UserRole  @default(STAFF)
  businessName  String    // Business affiliation (text field only)
  // ... other fields
  
  // NO managerId, assignedTo, or direct user relationships
}
```

**Key Finding**: There is **NO database relationship** between ADMIN, MANAGER, and STAFF users. They are independent user accounts.

#### 2. **Data Isolation Model**

All business data is isolated by `ownerId` (which links to a User):

- **Customers**: `ownerId` → User
- **Products**: `ownerId` → User  
- **Sales**: `ownerId` → User (business owner)
- **Notifications**: `ownerId` → User
- **All business data**: `ownerId` → User

**What this means:**
- Each user (regardless of role) owns their own business data
- Users with the same `businessName` (e.g., "Sunrise Electronics") still have separate data silos
- There is **NO shared data pool** - each user account is independent

#### 3. **Sale Tracking (Closest to Relationship)**

Sales have two user references:
```prisma
model Sale {
  ownerId String  // Business owner (who owns the sale)
  soldById String // Staff/Manager who made the sale
}
```

This allows tracking:
- **ownerId**: Which business/user account owns this sale
- **soldById**: Which specific user (Staff/Manager) processed the sale

**Example:**
- Admin creates a sale → `ownerId = admin.id`, `soldById = admin.id`
- Staff creates a sale → `ownerId = staff.id` (their own business), `soldById = staff.id`
- Manager creates a sale → `ownerId = manager.id` (their own business), `soldById = manager.id`

⚠️ **Important**: Even if Staff and Manager have the same `businessName`, their sales are still owned by different `ownerId` values.

#### 4. **Communication Flow: NONE**

**Current State**: There is **NO direct communication system** between users.

- ❌ No messaging system between ADMIN, MANAGER, and STAFF
- ❌ No assignment system (Admin cannot assign tasks to Staff)
- ❌ No approval workflows
- ❌ No notification routing between users

**What exists:**
- ✅ **Notifications**: Each user receives notifications for their own business (`ownerId`-based)
  - Low stock alerts
  - Payment overdue
  - New customers
  - Big sales
  - System alerts
  - Customer churn risk

**Example Notification Flow:**
1. Admin creates a product → Admin receives notifications about that product
2. Staff creates a sale → Staff receives notifications about that sale
3. **They do NOT see each other's notifications**

---

## 🏢 Business Affiliation (BusinessName)

### Current Implementation

Users can have the same `businessName` (text field), but this is **NOT a structural relationship**:

**Seed Data Example:**
```typescript
// All three users have same businessName but are separate accounts
{
  email: 'mohamed@sunriseelectronics.com',
  role: 'ADMIN',
  businessName: 'Sunrise Electronics'
}
{
  email: 'manager@demo.com',
  role: 'MANAGER',
  businessName: 'Sunrise Electronics'  // Same name
}
{
  email: 'staff@demo.com',
  role: 'STAFF',
  businessName: 'Sunrise Electronics'  // Same name
}
```

**Reality:**
- They share the same `businessName` string, but:
  - Their data is **completely separate** (`ownerId` is different)
  - They **cannot see each other's data**
  - They **cannot communicate** with each other
  - They operate as **independent businesses**

---

## 📈 Role Hierarchy (Permission-Based Only)

### Visual Hierarchy (Access Level)

```
                    ┌─────────┐
                    │  ADMIN  │ ← Full Access (All Features)
                    └─────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
    ┌─────────┐                   ┌─────────┐
    │ MANAGER │                   │  STAFF  │
    └─────────┘                   └─────────┘
    Management                     Operational
    Access                         Access
    (Analytics ✓)                  (No Analytics)
    (No Settings)                  (No Reports)
```

### Actual Database Structure

```
User (ADMIN)          User (MANAGER)         User (STAFF)
    │                      │                      │
    ├─ ownerId → Customers │                      │
    ├─ ownerId → Products  │                      │
    ├─ ownerId → Sales     │                      │
    └─ ownerId → Notifications
                            ├─ ownerId → Customers
                            ├─ ownerId → Products
                            ├─ ownerId → Sales
                            └─ ownerId → Notifications
                                                
                                                ├─ ownerId → Customers
                                                ├─ ownerId → Products
                                                ├─ ownerId → Sales
                                                └─ ownerId → Notifications
```

**No connections between users** - they are completely independent.

---

## 🚫 Limitations and Gaps

### Missing Features (Current System)

1. **No Multi-User Business Model**
   - Cannot have multiple users working on the same business
   - Each user account = separate business instance

2. **No Communication System**
   - No messaging between users
   - No task assignment
   - No approval workflows

3. **No Role Hierarchy Enforcement**
   - No manager-staff relationships
   - No admin-manager-staff chain of command
   - Roles are only for permission control

4. **No Shared Data**
   - Each user's data is isolated
   - Cannot collaborate on the same customers/products/sales

---

## 💡 Recommended Enhancements (Future)

### 1. Multi-User Business Model

```prisma
model Business {
  id          String @id
  name        String
  ownerId     String  // ADMIN user
  
  // Allow multiple users per business
  members     BusinessMember[]
}

model BusinessMember {
  id          String @id
  businessId  String
  userId      String
  role        UserRole
  // Relations...
}
```

### 2. Communication System

- Internal messaging between users in same business
- Task assignment from Admin/Manager to Staff
- Approval workflows for sensitive operations
- Activity feed showing what each user is doing

### 3. Hierarchical Relationships

- Admin can assign Managers
- Managers can assign Staff
- Managers can oversee Staff activities
- Admin can see all business activities

### 4. Shared Data Pool

- All users in same business see same customers/products
- Sales tracked by `soldById` but owned by `businessId`
- Notifications routed appropriately by role

---

## 📝 Summary

### Current State

✅ **What Works:**
- Clear role-based permission system
- Each role has appropriate access levels
- Data isolation ensures security
- Role-specific dashboards and routes

❌ **What's Missing:**
- No structural relationships between users
- No communication between users
- No multi-user business model
- No collaborative features

### Key Takeaway

**Admin, Manager, and Staff are permission levels, not relationships.** They define what a user can do, not who they work with. Currently, each user account operates as an independent business, even if they share the same `businessName`.

---

## 🔍 Testing Different Roles

### Demo Credentials

**ADMIN:**
- Email: `mohamed@sunriseelectronics.com`
- Password: `password123`
- Dashboard: `/dashboard/admin`

**MANAGER:**
- Email: `manager@demo.com`
- Password: `password123`
- Dashboard: `/dashboard/manager`

**STAFF:**
- Email: `staff@demo.com`
- Password: `password123`
- Dashboard: `/dashboard/staff`

### What to Notice When Testing

1. Each role sees a **different sidebar** (fewer items for Staff)
2. Each role has a **different dashboard path** (`/dashboard/{role}`)
3. Each role's data is **completely isolated** (they don't see each other's customers/products)
4. Admin is the **only role** with "Settings" and "User Management" menu items

---

**Document Version**: 1.0  
**Last Updated**: Based on current schema and implementation  
**Next Steps**: Consider implementing multi-user business model for true collaboration

