# Proposed Multi-User Business Model Architecture
## For Customer Insight Management System (CIMS)

---

## 🎯 Overview

**Current Problem**: Users are isolated - no collaboration, no shared data, no communication.

**Proposed Solution**: Implement a **Multi-User Business Model** where:
- Multiple users can belong to the same business
- Data is shared within a business
- Roles define permissions (what they can see/do)
- Communication and workflows exist between users
- Real-world business collaboration is enabled

---

## 📐 Proposed Database Schema Changes

### 1. **Business Entity (New)**

```prisma
model Business {
  id              String    @id @default(cuid())
  name            String
  businessType    String?   // Retail, Wholesale, Service, etc.
  phone           String?
  email           String?
  
  // Location
  countryId       String?
  regionId        String?
  districtId      String?
  
  // Settings
  currency        String    @default("SLL")
  timezone        String    @default("Africa/Freetown")
  dateFormat      String    @default("DD/MM/YYYY")
  
  // Business Status
  isActive        Boolean   @default(true)
  
  // Relations
  owner           User      @relation("BusinessOwner") // The ADMIN who owns this business
  ownerId         String    @unique
  
  members         BusinessMember[]  // All users in this business
  
  // Business Data (shared across all members)
  customers       Customer[]
  products        Product[]
  sales           Sale[]
  notifications   Notification[]
  analyticsLogs   AnalyticsLog[]
  expenses        Expense[]
  files           File[]
  smsLogs         SMSLog[]
  auditLogs       AuditLog[]
  interactions    CustomerInteraction[]
  dataExports     DataExport[]
  
  // Communication
  messages        Message[]
  tasks           Task[]
  activities      Activity[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("businesses")
}
```

### 2. **Business Member (New) - Links Users to Businesses**

```prisma
model BusinessMember {
  id              String    @id @default(cuid())
  
  // Relations
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId      String
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId          String
  
  // Role in this specific business
  role            UserRole  @default(STAFF)  // Can be ADMIN, MANAGER, or STAFF
  
  // Permissions (optional - for granular control)
  permissions     Json?     // Custom permissions per member
  
  // Status
  isActive        Boolean   @default(true)
  invitedBy       String?   // User ID who invited them
  joinedAt        DateTime  @default(now())
  
  // Manager-Staff relationships (if Manager invited the Staff)
  manages         BusinessMember[] @relation("ManagerStaff", fields: [managesId], references: [id])
  managesId       String?
  
  managedBy       BusinessMember?  @relation("ManagerStaff", references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([businessId, userId])
  @@index([businessId])
  @@index([userId])
  @@map("business_members")
}
```

### 3. **Updated User Model**

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique @db.VarChar(255)
  emailVerified DateTime?
  image         String?
  password      String?
  
  // Remove role from User (role is now per-business)
  // role          UserRole  @default(STAFF)  // REMOVE THIS
  
  // Personal Info
  phone         String?
  
  // Relations
  // Remove businessName - now in Business entity
  // businessName String  // REMOVE THIS
  
  // Location (personal location, not business location)
  countryId     String?
  regionId      String?
  districtId    String?
  
  // Authentication
  accounts                Account[]
  sessions                Session[]
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens     PasswordResetToken[]
  userSettings            UserSettings?
  
  // Business Relationships
  ownedBusiness    Business?         @relation("BusinessOwner")  // Business they own (ADMIN)
  businessMemberships BusinessMember[]  // All businesses they're part of
  
  // Communication & Activities
  sentMessages     Message[]         @relation("MessageSender")
  receivedMessages Message[]         @relation("MessageReceiver")
  assignedTasks    Task[]            @relation("TaskAssignee")
  createdTasks     Task[]            @relation("TaskCreator")
  activities       Activity[]        // Activity feed
  
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([countryId])
  @@index([regionId])
  @@index([districtId])
  @@map("users")
}
```

### 4. **Update Existing Models to Use Business Instead of User**

**Customer:**
```prisma
model Customer {
  // ... existing fields ...
  
  // CHANGE: ownerId → businessId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId String
  
  // ADD: Created by tracking
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdById String?
  
  // Remove: ownerId String  // REMOVE THIS
  
  @@index([businessId])  // CHANGE: was ownerId
}
```

**Product:**
```prisma
model Product {
  // ... existing fields ...
  
  // CHANGE: ownerId → businessId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId String
  
  // ADD: Created by tracking
  createdBy   User?    @relation(fields: [createdById], references: [id])
  createdById String?
  
  @@index([businessId])
}
```

**Sale:**
```prisma
model Sale {
  // ... existing fields ...
  
  // CHANGE: ownerId → businessId
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId String
  
  // KEEP: soldById (tracks which user made the sale)
  soldBy     User     @relation(fields: [soldById], references: [id])
  soldById   String
  
  // Remove: ownerId String  // REMOVE THIS
  
  @@index([businessId])
  @@index([soldById])
}
```

**Apply same pattern to:**
- Notification (businessId instead of ownerId)
- AnalyticsLog
- Expense
- File
- SMSLog
- AuditLog
- CustomerInteraction
- DataExport

### 5. **New Communication Models**

```prisma
// Internal Messaging
model Message {
  id            String    @id @default(cuid())
  
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId    String
  
  sender        User      @relation("MessageSender", fields: [senderId], references: [id])
  senderId      String
  
  receiver      User      @relation("MessageReceiver", fields: [receiverId], references: [id])
  receiverId    String
  
  subject       String?
  content       String    @db.Text
  isRead        Boolean   @default(false)
  readAt        DateTime?
  
  createdAt     DateTime  @default(now())
  
  @@index([businessId])
  @@index([senderId])
  @@index([receiverId])
  @@map("messages")
}

// Task Assignment
model Task {
  id            String    @id @default(cuid())
  
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId    String
  
  title         String
  description   String?   @db.Text
  priority      String    @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  
  createdBy     User      @relation("TaskCreator", fields: [createdById], references: [id])
  createdById   String
  
  assignedTo    User      @relation("TaskAssignee", fields: [assignedToId], references: [id])
  assignedToId  String
  
  status        String    @default("PENDING") // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  dueDate       DateTime?
  completedAt   DateTime?
  
  // Related entities
  relatedCustomerId  String?
  relatedProductId   String?
  relatedSaleId      String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([businessId])
  @@index([assignedToId])
  @@index([status])
  @@map("tasks")
}

// Activity Feed
model Activity {
  id            String    @id @default(cuid())
  
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId    String
  
  user          User      @relation(fields: [userId], references: [id])
  userId        String
  
  type          String    // CUSTOMER_CREATED, SALE_COMPLETED, PRODUCT_ADDED, etc.
  description   String
  metadata      Json?     // Additional data (customer name, sale amount, etc.)
  
  // Related entities
  relatedCustomerId  String?
  relatedProductId   String?
  relatedSaleId      String?
  
  createdAt     DateTime  @default(now())
  
  @@index([businessId])
  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("activities")
}
```

---

## 🔄 Data Migration Strategy

### Phase 1: Create Business Entities

1. For each existing user, create a Business entity
2. Link user as Business owner
3. Create BusinessMember for the owner with role ADMIN

### Phase 2: Migrate Data

1. Update all records: `ownerId` → `businessId` (using the user's business)
2. Add `createdById` fields where applicable
3. Keep `soldById` in Sales (already correct)

### Phase 3: Update Application Logic

1. Replace all `ownerId` queries with `businessId`
2. Filter by user's business memberships
3. Implement role-based permissions per business
4. Add communication features

---

## 🔐 Permission Model

### Role Permissions (Per Business)

**ADMIN (Business Owner):**
- ✅ Full access to all business data
- ✅ Manage business settings
- ✅ Invite/remove members
- ✅ Assign roles (Manager, Staff)
- ✅ View all analytics and reports
- ✅ Delete business data

**MANAGER:**
- ✅ View all business data (shared)
- ✅ Create/edit customers, products, sales
- ✅ View analytics and reports
- ✅ Assign tasks to Staff
- ✅ View activity feed
- ❌ Cannot manage business settings
- ❌ Cannot invite/remove members
- ❌ Cannot delete business-critical data

**STAFF:**
- ✅ View customers, products, sales (shared)
- ✅ Create/edit customers, products, sales
- ✅ View basic customer insights
- ✅ Receive assigned tasks
- ✅ View activity feed (limited)
- ❌ Cannot view advanced analytics
- ❌ Cannot view reports
- ❌ Cannot manage business settings

### Multi-Business Support

A user can belong to **multiple businesses** with different roles:
- User might be ADMIN of Business A
- Same user might be STAFF in Business B
- Same user might be MANAGER in Business C

---

## 💬 Communication Flow

### 1. **Notifications (Enhanced)**
- Business-wide notifications (low stock affects all)
- Role-specific notifications (Manager receives analytics alerts)
- User-specific notifications (task assigned to you)

### 2. **Internal Messaging**
- Admin → Manager: Strategic messages
- Manager → Staff: Task assignments, instructions
- Staff → Manager: Updates, questions
- All → All: General business updates

### 3. **Task Assignment**
- Manager creates task → Assigns to Staff
- Staff completes task → Notifies Manager
- Admin can create tasks for anyone

### 4. **Activity Feed**
- Real-time feed of business activities
- "John created a new customer"
- "Sarah completed a sale of Le 500,000"
- "Manager assigned task to Staff"
- Filterable by user, type, date

---

## 📊 Business Data Sharing

### Shared Within Business:

✅ **Customers**: All members see same customers
- Admin creates customer → Manager & Staff can see it
- Staff creates customer → Everyone sees it
- Track who created (`createdById`)

✅ **Products**: All members see same inventory
- Shared stock levels
- All can add/edit products
- Real-time inventory updates

✅ **Sales**: All members see same sales
- Track who made the sale (`soldById`)
- All can view sales history
- Manager/Admin can edit/void sales

✅ **Analytics**: Role-based access
- All members see data contributing to analytics
- Admin & Manager see full analytics
- Staff see basic insights only

---

## 🎯 User Flow Example

### Scenario: Admin Invites Manager and Staff

1. **Admin creates business**: "Sunrise Electronics"
2. **Admin invites Manager**:
   - Sends invitation email
   - Manager accepts → Becomes BusinessMember with role MANAGER
3. **Manager invites Staff**:
   - Manager can invite Staff members
   - Staff accepts → Becomes BusinessMember with role STAFF

### Scenario: Daily Operations

1. **Staff creates a sale**:
   - Sale belongs to Business (businessId)
   - Sale tracked by Staff user (soldById)
   - Activity logged: "Sarah completed sale of Le 500,000"
   - All members see this sale in business dashboard

2. **Manager views analytics**:
   - Sees all sales from all Staff
   - Can generate reports
   - Assigns task to Staff: "Follow up with customer X"

3. **Admin reviews everything**:
   - Sees all activities
   - Views comprehensive reports
   - Manages business settings
   - Can reassign roles if needed

---

## 🔧 Implementation Checklist

### Database & Schema
- [ ] Create Business model
- [ ] Create BusinessMember model
- [ ] Update User model (remove role, add relations)
- [ ] Update all data models (ownerId → businessId)
- [ ] Create Message, Task, Activity models
- [ ] Create migration scripts

### Backend API Changes
- [ ] Update all API routes to use businessId
- [ ] Implement business membership checks
- [ ] Add role-based permission middleware
- [ ] Create business invitation system
- [ ] Implement messaging API
- [ ] Implement task management API
- [ ] Implement activity feed API

### Frontend Changes
- [ ] Business selection/switcher (for multi-business users)
- [ ] Update all data fetching (businessId instead of ownerId)
- [ ] Add messaging interface
- [ ] Add task management interface
- [ ] Add activity feed component
- [ ] Update notifications to be business-aware
- [ ] Add member management (Admin only)

### Features to Add
- [ ] Business creation wizard
- [ ] Member invitation system
- [ ] Role assignment interface
- [ ] Internal messaging system
- [ ] Task assignment & tracking
- [ ] Activity feed dashboard
- [ ] Business settings page
- [ ] Member management page

---

## 🎓 Benefits for Master Thesis

### Real-World Relevance
- ✅ Reflects actual business operations
- ✅ Multi-user collaboration is industry standard
- ✅ Demonstrates understanding of RBAC
- ✅ Shows knowledge of data modeling

### Academic Value
- ✅ Complex relationships to discuss
- ✅ Security considerations (multi-tenancy)
- ✅ Scalability concerns
- ✅ User experience design for collaboration

### Features to Highlight
- ✅ Role-based access control (RBAC)
- ✅ Multi-tenancy architecture
- ✅ Real-time collaboration
- ✅ Activity tracking & audit logs
- ✅ Communication workflows

---

## 🚀 Recommended Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Create Business & BusinessMember models
2. Migrate existing data
3. Update authentication to support business context
4. Basic business membership checks

### Phase 2: Data Sharing (Week 3-4)
1. Update all models to use businessId
2. Update all API routes
3. Update frontend data fetching
4. Test shared data access

### Phase 3: Communication (Week 5-6)
1. Implement messaging system
2. Add task management
3. Create activity feed
4. Enhanced notifications

### Phase 4: Polish (Week 7-8)
1. Member invitation system
2. Role management UI
3. Business settings
4. Testing & documentation

---

## 📝 Summary

**Current System**: Isolated users, no collaboration  
**Proposed System**: Multi-user business model with:
- ✅ Business entities with multiple members
- ✅ Shared data across business members
- ✅ Role-based permissions per business
- ✅ Communication (messaging, tasks)
- ✅ Activity tracking
- ✅ Real-world business collaboration

This architecture will make your Customer Insight Management System **production-ready** and **thesis-worthy**! 🎓

---

**Would you like me to start implementing this architecture?**

