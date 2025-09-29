import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Check if database is already initialized
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      console.log('Database already initialized with', userCount, 'users');
      return;
    }

    console.log('Creating default data...');

    // Create default locations
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          id: 'loc-hq',
          name: 'Headquarters',
          address: '123 Main St, City',
          capacity: 50
        }
      }),
      prisma.location.create({
        data: {
          id: 'loc-01',
          name: 'Downtown Parking',
          address: '456 Park Ave, City',
          capacity: 100
        }
      }),
      prisma.location.create({
        data: {
          id: 'loc-02',
          name: 'Airport Parking',
          address: '789 Airport Rd, City',
          capacity: 200
        }
      })
    ]);

    console.log('Created', locations.length, 'locations');

    // Create default users with hashed passwords
    const ownerPassword = await bcrypt.hash('Owner@123', 10);
    const managerPassword = await bcrypt.hash('Manager@123', 10);
    const attendantPassword = await bcrypt.hash('Attendant@123', 10);

    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'owner@go2parking.com',
          passwordHash: ownerPassword,
          name: 'System Owner',
          role: 'OWNER',
          locationId: 'loc-hq'
        }
      }),
      prisma.user.create({
        data: {
          email: 'manager@go2parking.com',
          passwordHash: managerPassword,
          name: 'Site Manager',
          role: 'MANAGER',
          locationId: 'loc-01'
        }
      }),
      prisma.user.create({
        data: {
          email: 'attendant1@go2parking.com',
          passwordHash: attendantPassword,
          name: 'John Attendant',
          role: 'ATTENDANT',
          locationId: 'loc-01'
        }
      }),
      prisma.user.create({
        data: {
          email: 'attendant2@go2parking.com',
          passwordHash: attendantPassword,
          name: 'Jane Attendant',
          role: 'ATTENDANT',
          locationId: 'loc-02'
        }
      })
    ]);

    console.log('Created', users.length, 'users');

    // Create default pricing rules
    const pricingRules = await prisma.pricingRule.createMany({
      data: [
        {
          locationId: 'loc-01',
          vehicleType: 'CAR',
          basePrice: 5,
          hourlyRate: 3,
          dailyMax: 30,
          gracePeriod: 15
        },
        {
          locationId: 'loc-01',
          vehicleType: 'MOTORCYCLE',
          basePrice: 3,
          hourlyRate: 2,
          dailyMax: 20,
          gracePeriod: 15
        },
        {
          locationId: 'loc-01',
          vehicleType: 'TRUCK',
          basePrice: 10,
          hourlyRate: 5,
          dailyMax: 50,
          gracePeriod: 15
        },
        {
          locationId: 'loc-02',
          vehicleType: 'CAR',
          basePrice: 10,
          hourlyRate: 5,
          dailyMax: 60,
          gracePeriod: 30
        },
        {
          locationId: 'loc-02',
          vehicleType: 'MOTORCYCLE',
          basePrice: 5,
          hourlyRate: 3,
          dailyMax: 30,
          gracePeriod: 30
        },
        {
          locationId: 'loc-02',
          vehicleType: 'TRUCK',
          basePrice: 15,
          hourlyRate: 8,
          dailyMax: 80,
          gracePeriod: 30
        }
      ]
    });

    console.log('Created', pricingRules.count, 'pricing rules');

    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('Default credentials:');
    console.log('-------------------');
    console.log('Owner: owner@go2parking.com / Owner@123');
    console.log('Manager: manager@go2parking.com / Manager@123');
    console.log('Attendant 1: attendant1@go2parking.com / Attendant@123');
    console.log('Attendant 2: attendant2@go2parking.com / Attendant@123');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw error to prevent deployment failure
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initDatabase();
}

export default initDatabase;