# Role-Based Access Control (RBAC)

## User Roles

The system supports three user roles with different access levels:

### 1. ADMIN (SME Owner/Manager)
**Full Access** - Can access all features and manage the entire system.

**Accessible Features:**
- ✅ Dashboard
- ✅ Customer Insights
- ✅ Sales Analytics
- ✅ Customer Segments
- ✅ Customers Management
- ✅ Products Management
- ✅ Sales Management
- ✅ Reports
- ✅ Settings
- ✅ User Management

**Permissions:**
- View all analytics and insights
- Manage all customers, products, and sales
- Configure system settings
- Create and manage user accounts
- Access all reports and exports

---

### 2. MANAGER
**Management Access** - Can view analytics and manage operations, but cannot change system settings.

**Accessible Features:**
- ✅ Dashboard
- ✅ Customer Insights
- ✅ Sales Analytics
- ✅ Customer Segments
- ✅ Customers Management
- ✅ Products Management
- ✅ Sales Management
- ✅ Reports
- ❌ Settings (No Access)
- ❌ User Management (No Access)

**Permissions:**
- View all analytics and insights
- Manage customers, products, and sales
- Generate and view reports
- Cannot modify system settings
- Cannot manage users

---

### 3. STAFF
**Operational Access** - Can perform day-to-day operations but has limited analytics access.

**Accessible Features:**
- ✅ Dashboard
- ✅ Customer Insights
- ✅ Customers Management
- ✅ Products Management
- ✅ Sales Management
- ❌ Sales Analytics (No Access)
- ❌ Customer Segments (No Access)
- ❌ Reports (No Access)
- ❌ Settings (No Access)
- ❌ User Management (No Access)

**Permissions:**
- View basic dashboard
- View customer insights
- Manage customers, products, and sales
- Cannot access advanced analytics
- Cannot view reports
- Cannot modify settings

---

## Implementation Details

### Sidebar Navigation
The sidebar automatically filters menu items based on the user's role. Each navigation item has a `roles` array that specifies which roles can access it.

### API Routes
All API routes use `requireAuth()` to ensure the user is authenticated. For role-specific routes, use:
- `requireRole([UserRole.ADMIN, UserRole.MANAGER])` - For routes accessible by specific roles
- `requireAdmin()` - For admin-only routes

### Frontend Components
Components check the user's role from the session to conditionally render features:
```typescript
const { data: session } = useSession();
const userRole = session?.user?.role;

// Conditionally render based on role
{userRole === 'ADMIN' && <AdminOnlyComponent />}
```

---

## Default Test Users

After seeding the database, you can test different roles:

### ADMIN User
- Email: `mohamed@sunriseelectronics.com`
- Password: `password123`
- Role: ADMIN

### Creating Additional Users
You can create users with different roles through the registration API or directly in the database. The first registered user is automatically assigned the ADMIN role.

---

## Security Notes

1. **Server-Side Validation**: Always validate user roles on the server side, not just the client
2. **API Protection**: All API routes should check user roles before processing requests
3. **Data Isolation**: Users can only see data from their own business (ownerId filtering)
4. **Session Management**: User roles are stored in the JWT session token

---

## Future Enhancements

Potential improvements for role-based access:
- Granular permissions (e.g., "view_reports", "edit_customers")
- Role hierarchy system
- Custom role creation
- Permission-based UI rendering
- Audit logs for role-based actions

