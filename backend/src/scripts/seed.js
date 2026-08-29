/**
 * Seeds demo accounts so judges can explore user and admin flows immediately.
 * Admin is an operator only — no opening wallet balance.
 */
require('../config/env');
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/db');
const User = require('../models/User');
const { ROLES, INITIAL_BALANCE } = require('../config/constants');

const DEMO_USERS = [
  {
    name: 'SecurePay Admin',
    email: 'admin@securepay.com',
    password: 'Admin@12345',
    role: ROLES.ADMIN,
    walletBalance: 0,
  },
  {
    name: 'Rahim Ahmed',
    email: 'rahim@securepay.com',
    password: 'User@12345',
    role: ROLES.USER,
    walletBalance: INITIAL_BALANCE,
  },
  {
    name: 'Karim Hassan',
    email: 'karim@securepay.com',
    password: 'User@12345',
    role: ROLES.USER,
    walletBalance: INITIAL_BALANCE,
  },
  {
    name: 'Sadia Rahman',
    email: 'sadia@securepay.com',
    password: 'User@12345',
    role: ROLES.USER,
    walletBalance: INITIAL_BALANCE,
  },
];

async function seed() {
  await connectDatabase();

  for (const entry of DEMO_USERS) {
    const exists = await User.findOne({ email: entry.email });
    if (exists) {
      if (entry.role === ROLES.ADMIN && exists.walletBalance !== 0) {
        exists.walletBalance = 0;
        await exists.save();
        console.log(`Reset ${exists.email} wallet to 0 BDT`);
      } else {
        console.log(`Skip ${entry.email} (already exists)`);
      }
      continue;
    }
    const user = await User.create(entry);
    console.log(`Created ${user.email}  wallet=${user.walletId}  role=${user.role}  balance=${user.walletBalance}`);
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
