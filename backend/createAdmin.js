require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const name = "Amlandeep";
const email = "admin@blueisle.com";
const plainPassword = "ChangeMe123!";
const role = "admin";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log("Connected");

  await User.deleteOne({ email: email.toLowerCase() });

  const password = await bcrypt.hash(plainPassword, 10);
  const user = await User.create({ name, email, password, role, active: true });

  const test = await bcrypt.compare(plainPassword, user.password);
  console.log("✅ Created:", user.email, "| role:", user.role);
  console.log("🔑 Password compare test:", test ? "PASS ✅" : "FAIL ❌");

  process.exit(0);
};

run().catch(e => { console.error("❌", e.message); process.exit(1); });