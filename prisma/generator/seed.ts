/*
  Prisma seed for merchant/restaurant platform (Saudi Arabia-focused sample data).
  - Creates demo merchants (restaurants, cafes, coffee shops) with realistic seed data.
  - Idempotent: uses upsert or find-or-create patterns and createMany with skipDuplicates.
*/

import { PrismaClient, UserRole, MerchantType, OrderStatus, PaymentMethod, PaymentStatus, TableSection, TableStatus, ReservationStatus, ModifierType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

type MerchantSeedInput = {
  domain: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  type: MerchantType;
  cuisine: string;
  city: string;
  address: string;
};

const SAUDI_MERCHANTS: MerchantSeedInput[] = [
  {
    domain: "albaik",
    name: "AlBaik Express",
    nameAr: "البيك إكسبرس",
    email: "info@albaik.sa",
    phone: "+966501234567",
    type: "FAST_FOOD",
    cuisine: "Saudi Fast Food",
    city: "Jeddah",
    address: "King Abdulaziz Road, Al Hamra District",
  },
  {
    domain: "najd",
    name: "Najd Village Restaurant",
    nameAr: "مطعم قرية نجد",
    email: "info@najdvillage.sa",
    phone: "+966502345678",
    type: "RESTAURANT",
    cuisine: "Traditional Saudi",
    city: "Riyadh",
    address: "Prince Mohammed bin Abdulaziz Road, Al Olaya",
  },
  {
    domain: "brew92",
    name: "Brew92 Coffee",
    nameAr: "بريو ٩٢",
    email: "info@brew92.sa",
    phone: "+966503456789",
    type: "COFFEE_SHOP",
    cuisine: "Specialty Coffee",
    city: "Riyadh",
    address: "King Fahd Road, Al Nakheel District",
  },
  {
    domain: "shobak",
    name: "Shobak Lounge",
    nameAr: "شوباك لاونج",
    email: "info@shobak.sa",
    phone: "+966504567890",
    type: "CAFE",
    cuisine: "International Cafe",
    city: "Dammam",
    address: "Prince Turki Street, Al Faisaliyah",
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Create Platform Admin
  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@menucloud.sa" },
    update: {},
    create: {
      email: "admin@menucloud.sa",
      username: "platform_admin",
      password: await bcrypt.hash("Admin123!", 10),
      emailVerified: new Date(),
      role: "PLATFORM_ADMIN",
    },
  });

  console.log("✅ Platform admin created");

  // 2. Create Merchants with Owners
  for (const merchantData of SAUDI_MERCHANTS) {
    // Create owner user
    const owner = await prisma.user.upsert({
      where: { email: merchantData.email },
      update: {},
      create: {
        email: merchantData.email,
        username: merchantData.domain + "_owner",
        password: await bcrypt.hash("Owner123!", 10),
        emailVerified: new Date(),
        role: "OWNER",
        phone: merchantData.phone,
        phoneVerified: true,
      },
    });

    // Create merchant
    const merchant = await prisma.merchant.upsert({
      where: { id: merchantData.domain }, // Using domain as ID for predictable seeding
      update: {},
      create: {
        id: merchantData.domain,
        name: merchantData.name,
        nameAr: merchantData.nameAr,
        email: merchantData.email,
        phone: merchantData.phone,
        type: merchantData.type,
        cuisine: merchantData.cuisine,
        city: merchantData.city,
        address: merchantData.address,
        addressAr: merchantData.address, // For demo, using same as English
        country: "SA",
        ownerId: owner.id,
        commercialRegister: faker.string.alphanumeric(10).toUpperCase(),
        vatNumber: faker.string.numeric(15),
        subscriptionTier: "PROFESSIONAL",
        subscriptionStatus: "ACTIVE",
      },
    });

    console.log(`✅ Created merchant: ${merchant.name}`);

    // Create main branch
    const mainBranch = await prisma.branch.create({
      data: {
        merchantId: merchant.id,
        name: "Main Branch",
        nameAr: "الفرع الرئيسي",
        address: merchantData.address,
        addressAr: merchantData.address,
        phone: merchantData.phone,
        isMainBranch: true,
        isActive: true,
      },
    });

    // Create staff users
    const manager = await prisma.user.create({
      data: {
        email: `manager@${merchantData.domain}.sa`,
        username: `${merchantData.domain}_manager`,
        password: await bcrypt.hash("Manager123!", 10),
        emailVerified: new Date(),
        role: "MANAGER",
        merchantId: merchant.id,
      },
    });

    const cashier = await prisma.user.create({
      data: {
        email: `cashier@${merchantData.domain}.sa`,
        username: `${merchantData.domain}_cashier`,
        password: await bcrypt.hash("Cashier123!", 10),
        emailVerified: new Date(),
        role: "CASHIER",
        merchantId: merchant.id,
      },
    });

    // Create menu
    const menu = await prisma.menu.create({
      data: {
        merchantId: merchant.id,
        name: "Main Menu",
        nameAr: "القائمة الرئيسية",
        description: "Our signature dishes and beverages",
        descriptionAr: "أطباقنا ومشروباتنا المميزة",
        isActive: true,
        isDefault: true,
      },
    });

    // Create categories based on merchant type
    const categories = merchantData.type === "COFFEE_SHOP" || merchantData.type === "CAFE"
      ? [
          { name: "Hot Beverages", nameAr: "مشروبات ساخنة", sortOrder: 1 },
          { name: "Cold Beverages", nameAr: "مشروبات باردة", sortOrder: 2 },
          { name: "Pastries", nameAr: "معجنات", sortOrder: 3 },
          { name: "Desserts", nameAr: "حلويات", sortOrder: 4 },
        ]
      : [
          { name: "Appetizers", nameAr: "المقبلات", sortOrder: 1 },
          { name: "Main Dishes", nameAr: "الأطباق الرئيسية", sortOrder: 2 },
          { name: "Beverages", nameAr: "المشروبات", sortOrder: 3 },
          { name: "Desserts", nameAr: "الحلويات", sortOrder: 4 },
        ];

    for (const catData of categories) {
      const category = await prisma.category.create({
        data: {
          menuId: menu.id,
          ...catData,
          isActive: true,
        },
      });

      // Create 3-5 items per category
      const itemCount = faker.number.int({ min: 3, max: 5 });
      for (let i = 0; i < itemCount; i++) {
        const menuItem = await prisma.menuItem.create({
          data: {
            menuId: menu.id,
            categoryId: category.id,
            name: faker.commerce.productName(),
            nameAr: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.number.float({ min: 10, max: 150, fractionDigits: 2 }),
            calories: faker.number.int({ min: 100, max: 800 }),
            prepTime: faker.number.int({ min: 5, max: 30 }),
            isAvailable: true,
            isHalal: true,
            sortOrder: i,
          },
        });

        // Add modifiers for some items
        if (faker.datatype.boolean()) {
          const modifier = await prisma.modifier.create({
            data: {
              menuItemId: menuItem.id,
              name: "Size",
              nameAr: "الحجم",
              type: "SINGLE",
              required: true,
              minSelection: 1,
              maxSelection: 1,
            },
          });

          const sizes = [
            { name: "Small", nameAr: "صغير", price: 0 },
            { name: "Medium", nameAr: "وسط", price: 5 },
            { name: "Large", nameAr: "كبير", price: 10 },
          ];

          for (const size of sizes) {
            await prisma.modifierOption.create({
              data: {
                modifierId: modifier.id,
                ...size,
                isDefault: size.name === "Medium",
              },
            });
          }
        }
      }
    }

    // Create tables for restaurants
    if (merchantData.type === "RESTAURANT" || merchantData.type === "FAST_FOOD") {
      const tableCount = faker.number.int({ min: 10, max: 20 });
      for (let i = 1; i <= tableCount; i++) {
        await prisma.table.create({
          data: {
            merchantId: merchant.id,
            number: `T${i.toString().padStart(2, '0')}`,
            capacity: faker.helpers.arrayElement([2, 4, 6, 8]),
            section: faker.helpers.arrayElement(["FAMILY", "SINGLES", "MIXED"]),
            status: "AVAILABLE",
            qrCode: `${merchant.id}-table-${i}`,
          },
        });
      }
    }

    // Create some customers
    const customerCount = faker.number.int({ min: 5, max: 10 });
    for (let i = 0; i < customerCount; i++) {
      const customer = await prisma.customer.create({
        data: {
          merchantId: merchant.id,
          name: faker.person.fullName(),
          phone: `+9665${faker.string.numeric(8)}`,
          email: faker.internet.email(),
          language: faker.helpers.arrayElement(["ar", "en"]),
          loyaltyPoints: faker.number.int({ min: 0, max: 500 }),
          totalOrders: faker.number.int({ min: 1, max: 20 }),
          totalSpent: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
        },
      });

      // Create some orders for each customer
      const orderCount = faker.number.int({ min: 1, max: 3 });
      for (let j = 0; j < orderCount; j++) {
        const order = await prisma.order.create({
          data: {
            merchantId: merchant.id,
            orderNumber: `ORD-${faker.string.alphanumeric(6).toUpperCase()}`,
            customerId: customer.id,
            type: faker.helpers.arrayElement(["DINE_IN", "PICKUP", "DELIVERY"]),
            status: faker.helpers.arrayElement(["COMPLETED", "PREPARING", "READY"]),
            paymentMethod: faker.helpers.arrayElement(["CASH", "MADA", "CREDIT_CARD", "APPLE_PAY"]),
            paymentStatus: "PAID",
            subtotal: faker.number.float({ min: 50, max: 300, fractionDigits: 2 }),
            tax: faker.number.float({ min: 5, max: 30, fractionDigits: 2 }),
            discount: faker.number.float({ min: 0, max: 20, fractionDigits: 2 }),
            tip: faker.number.float({ min: 0, max: 20, fractionDigits: 2 }),
            total: faker.number.float({ min: 60, max: 350, fractionDigits: 2 }),
          },
        });

        // Add order items
        const menuItems = await prisma.menuItem.findMany({
          where: { menuId: menu.id },
          take: faker.number.int({ min: 1, max: 4 }),
        });

        for (const item of menuItems) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              menuItemId: item.id,
              quantity: faker.number.int({ min: 1, max: 3 }),
              price: item.price,
              total: item.price * faker.number.int({ min: 1, max: 3 }),
            },
          });
        }
      }
    }

    // Add merchant features
    const features = ["QR_MENU", "WHATSAPP_ORDERING", "ONLINE_PAYMENTS", "ANALYTICS"];
    for (const feature of features) {
      await prisma.merchantFeature.create({
        data: {
          merchantId: merchant.id,
          feature: feature as any,
          enabled: true,
        },
      });
    }

    console.log(`✅ Completed setup for ${merchant.name}`);
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📝 Login Credentials:");
  console.log("Platform Admin: admin@menucloud.sa / Admin123!");
  for (const merchant of SAUDI_MERCHANTS) {
    console.log(`${merchant.name} Owner: ${merchant.email} / Owner123!`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });