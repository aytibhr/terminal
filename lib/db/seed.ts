
import { db } from './drizzle';
import { users, teams, teamMembers, stations, membershipPlans } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  console.log('Creating default stations...');
  await db.insert(stations).values([
    { name: 'PS5 Individual - Station 1', type: 'PS5', ratePerHour: 150, coinsPerHour: 4 },
    { name: 'PS5 Individual - Station 2', type: 'PS5', ratePerHour: 150, coinsPerHour: 4 },
    { name: 'PS5 Individual - Station 3', type: 'PS5', ratePerHour: 150, coinsPerHour: 4 },
    { name: 'PS5 Group Lounge', type: 'Lounge', ratePerHour: 300, coinsPerHour: 8 },
    { name: 'Car Simulator', type: 'Sim', ratePerHour: 250, coinsPerHour: 6 },
    { name: 'Billiards Private Room', type: 'Billiards', ratePerHour: 300, coinsPerHour: 8 },
  ]);
  console.log('Default stations created.');

  console.log('Creating default membership plans...');
  await db.insert(membershipPlans).values([
    { name: 'Silver Membership', price: 999, hoursIncluded: 15, creditsValue: 30 },
    { name: 'Gold Membership', price: 2499, hoursIncluded: 40, creditsValue: 80 },
    { name: 'Platinum Membership', price: 4999, hoursIncluded: 100, creditsValue: 200 },
  ]);
  console.log('Membership plans created.');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
