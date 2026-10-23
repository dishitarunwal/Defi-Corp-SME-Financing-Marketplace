// Seeds demo users, applications and loans. Safe to run repeatedly:
// it does nothing if the demo accounts already exist.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { ensureDemoData } = require('../utils/demoData');

const run = async () => {
  await connectDB();
  const seeded = await ensureDemoData();
  if (!seeded) console.log('Demo accounts already exist - nothing to do.');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seeding failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
