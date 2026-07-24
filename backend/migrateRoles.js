// One-off migration: rename legacy 'director' role to 'admin'.
// Run once after deploying the operations/admin approval flow:  node migrateRoles.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log('Connected.\n');

  const before = await User.find().select('name email role active').sort({ createdAt: 1 });
  console.log('Users before migration:');
  before.forEach((u) => console.log(`  ${u.email.padEnd(35)} ${u.role.padEnd(12)} ${u.active ? '' : '(inactive)'}`));

  const result = await User.updateMany({ role: 'director' }, { $set: { role: 'admin' } });
  console.log(`\nPromoted ${result.modifiedCount} 'director' user(s) to 'admin'.`);

  const after = await User.find().select('name email role').sort({ createdAt: 1 });
  console.log('\nUsers after migration:');
  after.forEach((u) => console.log(`  ${u.email.padEnd(35)} ${u.role}`));

  process.exit(0);
};

run().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
