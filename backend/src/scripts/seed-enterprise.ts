import { db, closeConnection } from "@/db/connection";
import {
    users, stores, products, productVariants, inventory, orders,
    deliveryTasks, riders, coupons, masterMerchants,
       addresses
} from "@/db/schema";
import { generateId, hashPassword } from "@/utils";
import { logger } from "@/shared/logger";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";

// Configuration
const NUM_STORES = 5;
const NUM_CUSTOMERS = 10;
const NUM_RIDERS = 5;
const ORDERS_PER_CUSTOMER = 3;

async function seedEnterprise() {
    logger.info("🌱 Starting Enterprise Seeding...");

    try {
        // reuse existing roles logic or ensure they exist (skipped for brevity, assuming standard seed ran)

        // 1. Create Master Merchant
        const masterOwnerId = generateId();
        const masterPass = await hashPassword("master123");
        await db.insert(users).values({
            id: masterOwnerId,
            email: "master@group.com",
            phone: "9800000000",
            passwordHash: masterPass,
            isPhoneVerified: true
        });

        const masterId = generateId();
        await db.insert(masterMerchants).values({
            id: masterId,
            name: "Nepal Retail Group",
            ownerId: masterOwnerId,
            branchIds: [] // will update later
        });
        logger.info("✅ Created Master Merchant: Nepal Retail Group");

        // 2. Create Stores (Branches)
        const branchIds: string[] = [];
        for (let i = 0; i < NUM_STORES; i++) {
            const ownerId = generateId();
            await db.insert(users).values({
                id: ownerId,
                email: `store${i}@group.com`,
                phone: `980100000${i}`,
                passwordHash: masterPass, // same pass
                isPhoneVerified: true
            });

            const storeId = generateId();
            const storeName = `Retail Branch #${i + 1}`;
            await db.insert(stores).values({
                id: storeId,
                ownerId,
                name: storeName,
                slug: `branch-${i + 1}`,
                status: "ACTIVE",
                masterMerchantId: masterId, // Link to master
                latitude: 27.7 + (Math.random() * 0.1),
                longitude: 85.3 + (Math.random() * 0.1),
                address: faker.location.streetAddress()
            });
            branchIds.push(storeId);
            logger.info(`   - Created Store: ${storeName}`);

            // Products for Store
            for (let j = 0; j < 5; j++) {
                const prodId = generateId();
                await db.insert(products).values({
                    id: prodId,
                    storeId,
                    categoryId: "cat_123", // Assuming exists or null
                    name: faker.commerce.productName(),
                    slug: faker.helpers.slugify(faker.commerce.productName() + i + j).toLowerCase(),
                    basePrice: faker.commerce.price(),
                    isActive: true
                }).returning();

                // Variant
                const varId = generateId();
                await db.insert(productVariants).values({
                    id: varId,
                    productId: prodId,
                    name: "Standard",
                    priceOffset: "0",
                    isActive: true
                });

                // Stock
                await db.insert(inventory).values({
                    id: generateId(),
                    variantId: varId,
                    quantity: 50
                });
            }
        }

        // Update Master Merchant Branches
        await db.update(masterMerchants).set({ branchIds }).where(eq(masterMerchants.id, masterId));

        // 3. Create Riders (Tiered)
        const riderIds: string[] = [];
        for (let i = 0; i < NUM_RIDERS; i++) {
            const riderUserId = generateId();
            await db.insert(users).values({
                id: riderUserId,
                email: `rider${i}@gopasal.com`,
                phone: `981000000${i}`,
                passwordHash: masterPass,
                isPhoneVerified: true
            });

            const riderId = generateId();
            const tier = i === 0 ? "DIAMOND" : i === 1 ? "GOLD" : "BRONZE";
            await db.insert(riders).values({
                id: riderId,
                userId: riderUserId,
                vehicleType: "BIKE",
                licensePlate: `BA ${i} PA 1234`,
                status: "ONLINE",
                tier: tier as any,
                earnings: "0",
                isVerified: true
            });
            riderIds.push(riderId);
        }
        logger.info(`✅ Created ${NUM_RIDERS} Riders with Tiers`);

        // 4. Create Coupons
        await db.insert(coupons).values({
            id: generateId(),
            code: "WELCOME50",
            type: "PERCENT",
            value: "50",
            maxDiscount: "500",
            minOrderValue: "1000",
            status: "ACTIVE",
            storeId: "store_01",
            startDate: new Date(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        });
        logger.info("✅ Created Global Coupon: WELCOME50");

        // 5. Simulate Orders
        logger.info("⏳ Simulating Orders...");
        for (let i = 0; i < NUM_CUSTOMERS; i++) {
            const userId = generateId();
            await db.insert(users).values({
                id: userId,
                email: `cust${i}@mail.com`,
                phone: `982000000${i}`, // 982...
                passwordHash: masterPass,
                isPhoneVerified: true
            });

            for (let k = 0; k < ORDERS_PER_CUSTOMER; k++) {
                const storeId = branchIds[k % branchIds.length];
                const orderId = generateId();
                const total = faker.number.int({ min: 500, max: 5000 }).toString();

                // Create Address
                const addressId = generateId();
                await db.insert(addresses).values({
                    id: addressId,
                    userId,
                    label: "Home",
                    addressLine: faker.location.streetAddress(),
                    city: "Kathmandu",
                    latitude: 27.7,
                    longitude: 85.3
                });

                // Random Status
                const statuses = ["DELIVERED", "COMPLETED", "CANCELLED", "PENDING"];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                await db.insert(orders).values({
                    id: orderId,
                    userId,
                    storeId,
                    totalAmount: total,
                    status: status as any,
                    paymentStatus: status === "DELIVERED" ? "PAID" : "PENDING",
                    paymentMethod: "COD",
                    deliveryAddressId: addressId
                });

                if (status === "DELIVERED") {
                    // Create Delivery Task
                    const riderId = riderIds[i % riderIds.length];
                    await db.insert(deliveryTasks).values({
                        id: generateId(),
                        orderId,
                        riderId,
                        status: "DELIVERED",
                        codCollected: true,
                        codAmount: total
                    });
                }
            }
        }

        logger.info("✅ Database Seeding Completed Successfully!");
    } catch (err) {
        logger.error({ err }, "Seeding Failed");
    } finally {
        await closeConnection();
    }
}

seedEnterprise();
