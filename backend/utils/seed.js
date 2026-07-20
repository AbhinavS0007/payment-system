// Run once: npm run seed
// Creates the first director account so you can log in and add your team.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();
  } catch (e) {
    console.error('Could not connect to MongoDB. Check MONGO_URI in backend/.env');
    process.exit(1);
  }
  const email = 'amlandeep@blueisleinteriors.com';
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Director account already exists:', email);
  } else {
    await User.create({
      name: 'Amlandeep Saikia',
      email,
      password: await bcrypt.hash('ChangeMe@123', 10),
      role: 'director'
    });
    console.log('Director account created:');
    console.log('  Email   :', email);
    console.log('  Password: ChangeMe@123  (change it after first login)');
  }
  process.exit(0);
})();
