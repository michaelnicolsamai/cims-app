// prisma/seed.ts
import { PrismaClient, UserRole, CustomerType, PaymentMethod, PaymentStatus, SaleStatus, RegionSierraLeone, ProductStatus, DistrictType, LocationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed data creation...');

    // Clear existing data in correct order to avoid foreign key constraints
    const models = [
        'saleItem', 'sale', 'customerInteraction', 'customer', 'product',
        'expense', 'file', 'notification', 'analyticsLog', 'dataExport',
        'smsLog', 'auditLog', 'userSettings', 'account', 'session',
        'emailVerificationToken', 'passwordResetToken', 'user',
        'location', 'chiefdom', 'district', 'region', 'country'
    ];

    for (const model of models) {
        try {
            await (prisma as any)[model].deleteMany();
        } catch (error) {
            // Model might not exist yet, continue
        }
    }

    // 1. Create Sierra Leone country
    const sierraLeone = await prisma.country.create({
        data: {
            name: 'Sierra Leone',
            isoCode: 'SL',
            phoneCode: '+232',
            currency: 'SLL',
            timezone: 'Africa/Freetown',
        }
    });

    // 2. Create Regions
    const regions = await prisma.region.createManyAndReturn({
        data: [
            {
                name: 'Eastern Province',
                code: 'E',
                capital: 'Kenema',
                population: 1600000,
                area: 15553,
                description: 'Eastern region known for diamond mining and agriculture',
                countryId: sierraLeone.id,
            },
            {
                name: 'Northern Province',
                code: 'N',
                capital: 'Makeni',
                population: 2500000,
                area: 35936,
                description: 'Largest region by area, agricultural and mining activities',
                countryId: sierraLeone.id,
            },
            {
                name: 'North West Province',
                code: 'NW',
                capital: 'Port Loko',
                population: 1200000,
                area: 21291,
                description: 'Coastal region with fishing and agricultural activities',
                countryId: sierraLeone.id,
            },
            {
                name: 'Southern Province',
                code: 'S',
                capital: 'Bo',
                population: 1400000,
                area: 19694,
                description: 'Known for its beaches and agricultural production',
                countryId: sierraLeone.id,
            },
            {
                name: 'Western Area',
                code: 'W',
                capital: 'Freetown',
                population: 1700000,
                area: 557,
                description: 'Urban center containing the capital city Freetown',
                countryId: sierraLeone.id,
            },
        ],
    });

    // 3. Create Districts for each region
    const easternRegion = regions.find(r => r.code === 'E')!;
    const northernRegion = regions.find(r => r.code === 'N')!;
    const northWestRegion = regions.find(r => r.code === 'NW')!;
    const southernRegion = regions.find(r => r.code === 'S')!;
    const westernRegion = regions.find(r => r.code === 'W')!;

    const districts = await prisma.district.createManyAndReturn({
        data: [
            // Eastern Province Districts
            {
                name: 'Kailahun',
                code: 'KAI',
                capital: 'Kailahun',
                population: 525000,
                area: 3850,
                districtType: DistrictType.MIXED,
                description: 'Easternmost district, borders Guinea and Liberia',
                regionId: easternRegion.id,
            },
            {
                name: 'Kenema',
                code: 'KEN',
                capital: 'Kenema',
                population: 609000,
                area: 6003,
                districtType: DistrictType.URBAN,
                description: 'Commercial center for diamond trading',
                regionId: easternRegion.id,
            },
            {
                name: 'Kono',
                code: 'KON',
                capital: 'Koidu',
                population: 506000,
                area: 5700,
                districtType: DistrictType.MIXED,
                description: 'Major diamond mining district',
                regionId: easternRegion.id,
            },

            // Northern Province Districts
            {
                name: 'Bombali',
                code: 'BOM',
                capital: 'Makeni',
                population: 606000,
                area: 7939,
                districtType: DistrictType.URBAN,
                description: 'Contains regional capital Makeni',
                regionId: northernRegion.id,
            },
            {
                name: 'Kambia',
                code: 'KAM',
                capital: 'Kambia',
                population: 343000,
                area: 3108,
                districtType: DistrictType.RURAL,
                description: 'Borders Guinea, known for rice production',
                regionId: northernRegion.id,
            },
            {
                name: 'Koinadugu',
                code: 'KOI',
                capital: 'Kabala',
                population: 409000,
                area: 12000,
                districtType: DistrictType.RURAL,
                description: 'Largest district by area, mountainous region',
                regionId: northernRegion.id,
            },
            {
                name: 'Port Loko',
                code: 'PLK',
                capital: 'Port Loko',
                population: 614000,
                area: 5719,
                districtType: DistrictType.MIXED,
                description: 'Coastal district with fishing communities',
                regionId: northernRegion.id,
            },
            {
                name: 'Tonkolili',
                code: 'TON',
                capital: 'Magburaka',
                population: 530000,
                area: 7003,
                districtType: DistrictType.MIXED,
                description: 'Known for iron ore mining',
                regionId: northernRegion.id,
            },

            // North West Province Districts
            {
                name: 'Falaba',
                code: 'FAL',
                capital: 'Bendugu',
                population: 205000,
                area: 4100,
                districtType: DistrictType.RURAL,
                description: 'Newest district, created in 2017',
                regionId: northWestRegion.id,
            },

            // Southern Province Districts
            {
                name: 'Bo',
                code: 'BO',
                capital: 'Bo',
                population: 575000,
                area: 5152,
                districtType: DistrictType.URBAN,
                description: 'Second largest city in Sierra Leone',
                regionId: southernRegion.id,
            },
            {
                name: 'Bonthe',
                code: 'BON',
                capital: 'Bonthe',
                population: 140000,
                area: 3500,
                districtType: DistrictType.RURAL,
                description: 'Island district in the Atlantic Ocean',
                regionId: southernRegion.id,
            },
            {
                name: 'Moyamba',
                code: 'MOY',
                capital: 'Moyamba',
                population: 319000,
                area: 6800,
                districtType: DistrictType.MIXED,
                description: 'Known for its cultural heritage',
                regionId: southernRegion.id,
            },
            {
                name: 'Pujehun',
                code: 'PUJ',
                capital: 'Pujehun',
                population: 346000,
                area: 4100,
                districtType: DistrictType.RURAL,
                description: 'Borders Liberia, agricultural district',
                regionId: southernRegion.id,
            },

            // Western Area Districts
            {
                name: 'Western Area Urban',
                code: 'WAU',
                capital: 'Freetown',
                population: 1200000,
                area: 150,
                districtType: DistrictType.URBAN,
                description: 'Contains Freetown metropolitan area',
                regionId: westernRegion.id,
            },
            {
                name: 'Western Area Rural',
                code: 'WAR',
                capital: 'Waterloo',
                population: 500000,
                area: 407,
                districtType: DistrictType.MIXED,
                description: 'Suburban and rural areas around Freetown',
                regionId: westernRegion.id,
            },
        ],
    });

    // 4. Create Chiefdoms
    const westernUrbanDistrict = districts.find(d => d.code === 'WAU')!;
    const westernRuralDistrict = districts.find(d => d.code === 'WAR')!;
    const boDistrict = districts.find(d => d.code === 'BO')!;
    const bombaliDistrict = districts.find(d => d.code === 'BOM')!;
    const kenemaDistrict = districts.find(d => d.code === 'KEN')!;

    const chiefdoms = await prisma.chiefdom.createManyAndReturn({
        data: [
            {
                name: 'Freetown Central',
                chiefName: 'Paramount Chief Thomas',
                population: 300000,
                description: 'Central business district of Freetown',
                districtId: westernUrbanDistrict.id,
            },
            {
                name: 'East End',
                chiefName: 'Paramount Chief Kamara',
                population: 400000,
                description: 'Eastern neighborhoods of Freetown',
                districtId: westernUrbanDistrict.id,
            },
            {
                name: 'West End',
                chiefName: 'Paramount Chief Bangura',
                population: 200000,
                description: 'Western peninsula area',
                districtId: westernUrbanDistrict.id,
            },
            {
                name: 'Waterloo',
                chiefName: 'Paramount Chief Sesay',
                population: 150000,
                description: 'Major town in Western Rural',
                districtId: westernRuralDistrict.id,
            },
            {
                name: 'Bo Central',
                chiefName: 'Paramount Chief Kposowa',
                population: 200000,
                description: 'Central area of Bo city',
                districtId: boDistrict.id,
            },
            {
                name: 'Makeni Central',
                chiefName: 'Paramount Chief Koroma',
                population: 180000,
                description: 'Central area of Makeni city',
                districtId: bombaliDistrict.id,
            },
            {
                name: 'Kenema Central',
                chiefName: 'Paramount Chief Kanneh',
                population: 150000,
                description: 'Central area of Kenema city',
                districtId: kenemaDistrict.id,
            },
        ],
    });

    // 5. Create Locations
    const freetownCentral = chiefdoms.find(c => c.name === 'Freetown Central')!;
    const eastEnd = chiefdoms.find(c => c.name === 'East End')!;
    const waterloo = chiefdoms.find(c => c.name === 'Waterloo')!;
    const boCentral = chiefdoms.find(c => c.name === 'Bo Central')!;
    const makeniCentral = chiefdoms.find(c => c.name === 'Makeni Central')!;
    const kenemaCentral = chiefdoms.find(c => c.name === 'Kenema Central')!;

    const locations = await prisma.location.createManyAndReturn({
        data: [
            {
                name: 'Central Business District',
                latitude: 8.4841,
                longitude: -13.2299,
                population: 50000,
                description: 'Central commercial area with banks and offices',
                chiefdomId: freetownCentral.id,
            },
            {
                name: 'Lumley',
                latitude: 8.4460,
                longitude: -13.2714,
                population: 80000,
                description: 'Beachside residential and commercial area',
                chiefdomId: freetownCentral.id,
            },
            {
                name: 'Calaba Town',
                latitude: 8.4500,
                longitude: -13.2000,
                population: 120000,
                description: 'Densely populated eastern suburb',
                chiefdomId: eastEnd.id,
            },
            {
                name: 'Waterloo Town',
                latitude: 8.3389,
                longitude: -13.0708,
                population: 50000,
                description: 'Main town center of Waterloo',
                chiefdomId: waterloo.id,
            },
            {
                name: 'Bo Town Center',
                latitude: 7.9647,
                longitude: -11.7383,
                population: 80000,
                description: 'Central commercial area of Bo',
                chiefdomId: boCentral.id,
            },
            {
                name: 'Makeni Town Center',
                latitude: 8.8844,
                longitude: -12.0444,
                population: 70000,
                description: 'Central commercial area of Makeni',
                chiefdomId: makeniCentral.id,
            },
            {
                name: 'Kenema Town Center',
                latitude: 7.8764,
                longitude: -11.1903,
                population: 60000,
                description: 'Central commercial area of Kenema',
                chiefdomId: kenemaCentral.id,
            },
        ],
    });

    // 6. Create Users (SME Businesses)
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = await prisma.user.createManyAndReturn({
        data: [
            {
                name: 'Mohamed Bangura',
                email: 'mohamed@sunriseelectronics.com',
                password: hashedPassword,
                role: UserRole.ADMIN,
                businessName: 'Sunrise Electronics',
                phone: '+232-76-123456',
                businessType: 'Electronics Retail',
                location: RegionSierraLeone.WESTERN_AREA,
                countryId: sierraLeone.id,
                regionId: westernRegion.id,
                districtId: westernUrbanDistrict.id,
                emailVerified: new Date(),
            },
            {
                name: 'Fatmata Kamara',
                email: 'fatmata@freshmart.com',
                password: hashedPassword,
                role: UserRole.ADMIN,
                businessName: 'Freetown Fresh Mart',
                phone: '+232-77-654321',
                businessType: 'Grocery Store',
                location: RegionSierraLeone.WESTERN_AREA,
                countryId: sierraLeone.id,
                regionId: westernRegion.id,
                districtId: westernUrbanDistrict.id,
                emailVerified: new Date(),
            },
            {
                name: 'Alusine Sesay',
                email: 'alusine@buildersdepot.com',
                password: hashedPassword,
                role: UserRole.ADMIN,
                businessName: 'Builders Depot SL',
                phone: '+232-88-112233',
                businessType: 'Construction Materials',
                location: RegionSierraLeone.NORTHERN,
                countryId: sierraLeone.id,
                regionId: northernRegion.id,
                districtId: bombaliDistrict.id,
                emailVerified: new Date(),
            },
        ],
    });

    // Create user settings for each user
    for (const user of users) {
        await prisma.userSettings.create({
            data: {
                userId: user.id,
                currency: 'SLL',
                timezone: 'Africa/Freetown',
                dateFormat: 'DD/MM/YYYY',
                emailNotifications: true,
                lowStockAlerts: true,
                paymentReminders: true,
                smsNotifications: false,
            },
        });
    }

    // 7. Create Products for each business
    const sunriseElectronics = users[0];
    const freshMart = users[1];
    const buildersDepot = users[2];

    const electronicsProducts = await prisma.product.createManyAndReturn({
        data: [
            {
                sku: 'ELEC-001',
                name: 'Smartphone Android 4G',
                category: 'Mobile Phones',
                description: 'Latest Android smartphone with 4G capability',
                costPrice: 450000,
                sellingPrice: 650000,
                currentStock: 25,
                lowStockAlert: 5,
                unit: 'piece',
                status: ProductStatus.ACTIVE,
                ownerId: sunriseElectronics.id,
            },
            {
                sku: 'ELEC-002',
                name: '32-inch LED TV',
                category: 'Televisions',
                description: 'HD Ready LED Television',
                costPrice: 800000,
                sellingPrice: 1200000,
                currentStock: 12,
                lowStockAlert: 3,
                unit: 'piece',
                status: ProductStatus.ACTIVE,
                ownerId: sunriseElectronics.id,
            },
            {
                sku: 'ELEC-003',
                name: 'Bluetooth Speaker',
                category: 'Audio',
                description: 'Portable Bluetooth speaker with bass',
                costPrice: 150000,
                sellingPrice: 250000,
                currentStock: 40,
                lowStockAlert: 10,
                unit: 'piece',
                status: ProductStatus.ACTIVE,
                ownerId: sunriseElectronics.id,
            },
        ],
    });

    const groceryProducts = await prisma.product.createManyAndReturn({
        data: [
            {
                sku: 'GROC-001',
                name: 'Basmati Rice 5kg',
                category: 'Grains',
                description: 'Premium basmati rice',
                costPrice: 75000,
                sellingPrice: 95000,
                currentStock: 100,
                lowStockAlert: 20,
                unit: 'bag',
                status: ProductStatus.ACTIVE,
                ownerId: freshMart.id,
            },
            {
                sku: 'GROC-002',
                name: 'Cooking Oil 1L',
                category: 'Cooking Essentials',
                description: 'Pure vegetable cooking oil',
                costPrice: 18000,
                sellingPrice: 25000,
                currentStock: 80,
                lowStockAlert: 15,
                unit: 'bottle',
                status: ProductStatus.ACTIVE,
                ownerId: freshMart.id,
            },
        ],
    });

    const constructionProducts = await prisma.product.createManyAndReturn({
        data: [
            {
                sku: 'CONS-001',
                name: 'Cement 50kg',
                category: 'Building Materials',
                description: 'Premium construction cement',
                costPrice: 65000,
                sellingPrice: 80000,
                currentStock: 200,
                lowStockAlert: 50,
                unit: 'bag',
                status: ProductStatus.ACTIVE,
                ownerId: buildersDepot.id,
            },
        ],
    });

    // 8. Create Customers for each business
    const centralBusinessDistrict = locations.find(l => l.name === 'Central Business District')!;
    const lumleyLocation = locations.find(l => l.name === 'Lumley')!;
    const makeniLocation = locations.find(l => l.name === 'Makeni Town Center')!;

    const electronicsCustomers = await prisma.customer.createManyAndReturn({
        data: [
            {
                customerCode: 'CUST-ELEC-001',
                name: 'James Koroma',
                phone: '+232-76-111111',
                email: 'james.koroma@email.com',
                address: '12 Wilkinson Road, Freetown',
                city: 'Freetown',
                regionOld: RegionSierraLeone.WESTERN_AREA,
                countryId: sierraLeone.id,
                regionId: westernRegion.id,
                districtId: westernUrbanDistrict.id,
                locationId: lumleyLocation.id,
                type: CustomerType.REGULAR,
                tags: ['VIP', 'Prompt Payer'],
                totalSpent: 2450000,
                totalVisits: 8,
                loyaltyScore: 85,
                lastVisit: new Date('2024-01-15'),
                firstVisit: new Date('2023-06-10'),
                ownerId: sunriseElectronics.id,
            },
        ],
    });

    const groceryCustomers = await prisma.customer.createManyAndReturn({
        data: [
            {
                customerCode: 'CUST-GROC-001',
                name: 'Mariatu Bangura',
                phone: '+232-76-444444',
                email: null,
                address: 'Kissy Road, Freetown',
                city: 'Freetown',
                regionOld: RegionSierraLeone.WESTERN_AREA,
                countryId: sierraLeone.id,
                regionId: westernRegion.id,
                districtId: westernUrbanDistrict.id,
                locationId: centralBusinessDistrict.id,
                type: CustomerType.REGULAR,
                tags: ['Family', 'Weekly Shopper'],
                totalSpent: 1250000,
                totalVisits: 45,
                loyaltyScore: 88,
                lastVisit: new Date('2024-01-19'),
                firstVisit: new Date('2023-01-15'),
                ownerId: freshMart.id,
            },
        ],
    });

    const constructionCustomers = await prisma.customer.createManyAndReturn({
        data: [
            {
                customerCode: 'CUST-CONS-001',
                name: 'Makeni Construction Ltd',
                phone: '+232-88-666666',
                email: 'info@makeniconstruction.com',
                address: 'Makeni Highway',
                city: 'Makeni',
                regionOld: RegionSierraLeone.NORTHERN,
                countryId: sierraLeone.id,
                regionId: northernRegion.id,
                districtId: bombaliDistrict.id,
                locationId: makeniLocation.id,
                type: CustomerType.CORPORATE,
                tags: ['Construction', 'Bulk Order'],
                totalSpent: 12500000,
                totalVisits: 15,
                loyaltyScore: 90,
                lastVisit: new Date('2024-01-17'),
                firstVisit: new Date('2023-05-20'),
                ownerId: buildersDepot.id,
            },
        ],
    });

    // 9. Create Sales with Sale Items
    const salesData = [
        {
            invoiceNumber: 'INV-ELEC-2024-001',
            customerId: electronicsCustomers[0].id,
            subtotal: 650000,
            discount: 0,
            tax: 0,
            totalAmount: 650000,
            amountPaid: 650000,
            balanceDue: 0,
            paymentMethod: PaymentMethod.MOBILE_MONEY,
            paymentStatus: PaymentStatus.PAID,
            status: SaleStatus.COMPLETED,
            saleDate: new Date('2024-01-15'),
            saleRegionId: westernRegion.id,
            saleDistrictId: westernUrbanDistrict.id,
            ownerId: sunriseElectronics.id,
            soldById: sunriseElectronics.id,
            items: [
                { productId: electronicsProducts[0].id, productName: 'Smartphone Android 4G', quantity: 1, unitPrice: 650000, totalPrice: 650000 }
            ]
        },
        {
            invoiceNumber: 'INV-GROC-2024-001',
            customerId: groceryCustomers[0].id,
            subtotal: 190000,
            discount: 5000,
            tax: 0,
            totalAmount: 185000,
            amountPaid: 185000,
            balanceDue: 0,
            paymentMethod: PaymentMethod.CASH,
            paymentStatus: PaymentStatus.PAID,
            status: SaleStatus.COMPLETED,
            saleDate: new Date('2024-01-19'),
            saleRegionId: westernRegion.id,
            saleDistrictId: westernUrbanDistrict.id,
            ownerId: freshMart.id,
            soldById: freshMart.id,
            items: [
                { productId: groceryProducts[0].id, productName: 'Basmati Rice 5kg', quantity: 2, unitPrice: 95000, totalPrice: 190000 }
            ]
        },
    ];

    for (const saleData of salesData) {
        const { items, ...saleInfo } = saleData;
        const sale = await prisma.sale.create({
            data: saleInfo
        });

        for (const item of items) {
            await prisma.saleItem.create({
                data: {
                    ...item,
                    saleId: sale.id
                }
            });
        }
    }

    // 10. Create Sample Notifications
    await prisma.notification.createMany({
        data: [
            {
                type: 'LOW_STOCK',
                title: 'Low Stock Alert',
                message: 'Power Bank 10000mAh is running low (8 units left)',
                isRead: false,
                actionUrl: '/products',
                ownerId: sunriseElectronics.id,
            },
            {
                type: 'BIG_SALE',
                title: 'Large Sale Completed',
                message: 'Restaurant Delight made a purchase of Le 475,000',
                isRead: true,
                actionUrl: '/sales',
                ownerId: freshMart.id,
            },
        ],
    });

    console.log('✅ Seed completed successfully!');
    console.log('📧 Login emails:');
    users.forEach(user => {
        console.log(`   ${user.email} - Password: password123`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });