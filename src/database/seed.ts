import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create locations
  const hqLocation = await prisma.location.create({
    data: {
      id: 'loc-hq',
      name: 'Headquarters',
      address: '123 Main St, City',
      capacity: 50
    }
  });

  const lot1 = await prisma.location.create({
    data: {
      id: 'loc-01',
      name: 'Downtown Parking',
      address: '456 Park Ave, City',
      capacity: 100
    }
  });

  const lot2 = await prisma.location.create({
    data: {
      id: 'loc-02',
      name: 'Airport Parking',
      address: '789 Airport Rd, City',
      capacity: 200
    }
  });

  // Create users
  const ownerPassword = await bcrypt.hash('Owner@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const attendantPassword = await bcrypt.hash('Attendant@123', 10);

  await prisma.user.create({
    data: {
      email: 'owner@go2parking.com',
      passwordHash: ownerPassword,
      name: 'System Owner',
      role: 'OWNER',
      locationId: hqLocation.id
    }
  });

  await prisma.user.create({
    data: {
      email: 'manager@go2parking.com',
      passwordHash: managerPassword,
      name: 'Site Manager',
      role: 'MANAGER',
      locationId: lot1.id
    }
  });

  await prisma.user.create({
    data: {
      email: 'attendant1@go2parking.com',
      passwordHash: attendantPassword,
      name: 'John Attendant',
      role: 'ATTENDANT',
      locationId: lot1.id
    }
  });

  await prisma.user.create({
    data: {
      email: 'attendant2@go2parking.com',
      passwordHash: attendantPassword,
      name: 'Jane Attendant',
      role: 'ATTENDANT',
      locationId: lot2.id
    }
  });

  // Create pricing rules
  await prisma.pricingRule.createMany({
    data: [
      {
        locationId: lot1.id,
        vehicleType: 'CAR',
        basePrice: 5,
        hourlyRate: 3,
        dailyMax: 30,
        gracePeriod: 15
      },
      {
        locationId: lot1.id,
        vehicleType: 'MOTORCYCLE',
        basePrice: 3,
        hourlyRate: 2,
        dailyMax: 20,
        gracePeriod: 15
      },
      {
        locationId: lot1.id,
        vehicleType: 'TRUCK',
        basePrice: 10,
        hourlyRate: 5,
        dailyMax: 50,
        gracePeriod: 15
      },
      {
        locationId: lot2.id,
        vehicleType: 'CAR',
        basePrice: 10,
        hourlyRate: 5,
        dailyMax: 60,
        gracePeriod: 30
      },
      {
        locationId: lot2.id,
        vehicleType: 'MOTORCYCLE',
        basePrice: 5,
        hourlyRate: 3,
        dailyMax: 30,
        gracePeriod: 30
      },
      {
        locationId: lot2.id,
        vehicleType: 'TRUCK',
        basePrice: 15,
        hourlyRate: 8,
        dailyMax: 80,
        gracePeriod: 30
      }
    ]
  });

  console.log('Database seeded successfully!');
  console.log('');
  console.log('Default credentials:');
  console.log('Owner: owner@go2parking.com / Owner@123');
  console.log('Manager: manager@go2parking.com / Manager@123');
  console.log('Attendant 1: attendant1@go2parking.com / Attendant@123');
  console.log('Attendant 2: attendant2@go2parking.com / Attendant@123');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });