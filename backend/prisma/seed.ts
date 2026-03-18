import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ override: false });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Clear existing data
    console.log('Clearing existing data...');
    
    await prisma.$transaction([
      prisma.shiftAssignment.deleteMany(),
      prisma.shiftRequirement.deleteMany(),
      prisma.shift.deleteMany(),
      prisma.swapRequest.deleteMany(),
      prisma.availability.deleteMany(),
      prisma.certification.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.overtimeWarning.deleteMany(),
      prisma.user.deleteMany(),
      prisma.location.deleteMany(),
      prisma.skill.deleteMany(),
    ]);

    console.log('✅ Database cleared');

    // Create skills
    console.log('Creating skills...');
    const skills = await Promise.all([
      prisma.skill.create({ data: { name: 'Bartender', category: 'Service' } }),
      prisma.skill.create({ data: { name: 'Server', category: 'Service' } }),
      prisma.skill.create({ data: { name: 'Host', category: 'Service' } }),
      prisma.skill.create({ data: { name: 'Line Cook', category: 'Kitchen' } }),
      prisma.skill.create({ data: { name: 'Sous Chef', category: 'Kitchen' } }),
      prisma.skill.create({ data: { name: 'Dishwasher', category: 'Kitchen' } }),
      prisma.skill.create({ data: { name: 'Manager', category: 'Management' } }),
    ]);

    console.log(`✅ Created ${skills.length} skills`);

    // Create locations
    console.log('Creating locations...');
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          name: 'Coastal Eats - Downtown',
          address: '123 Main St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          timezone: 'America/Los_Angeles',
          country: 'USA',
        },
      }),
      prisma.location.create({
        data: {
          name: 'Coastal Eats - Beach',
          address: '456 Ocean Ave',
          city: 'Santa Monica',
          state: 'CA',
          zipCode: '90401',
          timezone: 'America/Los_Angeles',
          country: 'USA',
        },
      }),
      prisma.location.create({
        data: {
          name: 'Coastal Eats - Midtown',
          address: '789 Park Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          timezone: 'America/New_York',
          country: 'USA',
        },
      }),
      prisma.location.create({
        data: {
          name: 'Coastal Eats - Harbor',
          address: '321 Bay St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02110',
          timezone: 'America/New_York',
          country: 'USA',
        },
      }),
    ]);

    console.log(`✅ Created ${locations.length} locations`);

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin
    console.log('Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@coastaleats.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        phone: '555-555-0001',
      },
    });

    // Create managers
    console.log('Creating managers...');
    const managers = await Promise.all([
      prisma.user.create({
        data: {
          email: 'manager.downtown@coastaleats.com',
          password: hashedPassword,
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'MANAGER',
          phone: '555-555-0002',
          managedLocations: { connect: [{ id: locations[0].id }] },
        },
      }),
      prisma.user.create({
        data: {
          email: 'manager.beach@coastaleats.com',
          password: hashedPassword,
          firstName: 'Michael',
          lastName: 'Chen',
          role: 'MANAGER',
          phone: '555-555-0003',
          managedLocations: { connect: [{ id: locations[1].id }] },
        },
      }),
      prisma.user.create({
        data: {
          email: 'manager.midtown@coastaleats.com',
          password: hashedPassword,
          firstName: 'Jessica',
          lastName: 'Martinez',
          role: 'MANAGER',
          phone: '555-555-0004',
          managedLocations: { connect: [{ id: locations[2].id }] },
        },
      }),
    ]);

    console.log(`✅ Created ${managers.length + 1} users`);

    // Create staff
    console.log('Creating staff members...');
    const staffNames = [
      { first: 'John', last: 'Doe', email: 'john.doe@coastaleats.com' },
      { first: 'Jane', last: 'Smith', email: 'jane.smith@coastaleats.com' },
      { first: 'Robert', last: 'Williams', email: 'robert.williams@coastaleats.com' },
      { first: 'Maria', last: 'Garcia', email: 'maria.garcia@coastaleats.com' },
      { first: 'David', last: 'Brown', email: 'david.brown@coastaleats.com' },
      { first: 'Lisa', last: 'Davis', email: 'lisa.davis@coastaleats.com' },
    ];

    const staffMembers = [];
    for (let i = 0; i < staffNames.length; i++) {
      const staff = await prisma.user.create({
        data: {
          email: staffNames[i].email,
          password: hashedPassword,
          firstName: staffNames[i].first,
          lastName: staffNames[i].last,
          role: 'STAFF',
          phone: `555-555-0${100 + i}`,
          desiredHours: 40,
        },
      });
      staffMembers.push(staff);
    }

    console.log(`✅ Created ${staffMembers.length} staff members`);

    // Create certifications for staff
    console.log('Creating certifications...');
    for (const staff of staffMembers) {
      // Give each staff member 2 random certifications
      const shuffledSkills = [...skills].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < 2; i++) {
        if (shuffledSkills[i]) {
          const randomLocation = locations[Math.floor(Math.random() * locations.length)];
          await prisma.certification.create({
            data: {
              userId: staff.id,
              locationId: randomLocation.id,
              skillId: shuffledSkills[i].id,
              certifiedBy: managers[0].id,
            },
          });
        }
      }
    }

    console.log('✅ Certifications created');

    // Create availability for staff
    console.log('Creating availability...');
    for (const staff of staffMembers) {
      // Monday-Friday 9am-5pm
      for (let day = 1; day <= 5; day++) {
        await prisma.availability.create({
          data: {
            userId: staff.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isRecurring: true,
            isAvailable: true,
          },
        });
      }
    }

    console.log('✅ Availability created');

    // Create sample shifts
    console.log('Creating sample shifts...');
    const today = new Date();
    
    for (const location of locations) {
      for (let i = 1; i <= 3; i++) {
        const shiftDate = new Date(today);
        shiftDate.setDate(today.getDate() + i);
        shiftDate.setHours(17, 0, 0, 0);
        
        const endDate = new Date(shiftDate);
        endDate.setHours(23, 0, 0, 0);

        await prisma.shift.create({
          data: {
            locationId: location.id,
            title: 'Evening Shift',
            description: 'Dinner service',
            startTime: shiftDate,
            endTime: endDate,
            status: 'DRAFT',
          },
        });
      }
    }

    console.log('✅ Sample shifts created');
    console.log('🌱 Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });