// One-off: seed the managed Category & Project lists.
// Categories = the original hardcoded set; Projects = distinct values already
// used in existing requests. Idempotent — safe to run more than once.
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Project = require('./models/Project');
const Request = require('./models/Request');

const CATEGORIES = ['Site Material', 'Labour', 'Subcontractor', 'Office', 'Marketing', 'Travel', 'Misc'];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4 });
  console.log('Connected.\n');

  let cAdded = 0;
  for (const name of CATEGORIES) {
    const r = await Category.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
    if (r.upsertedCount) cAdded++;
  }
  console.log(`Categories: ${cAdded} added (${CATEGORIES.length} total in list).`);

  const projectNames = (await Request.distinct('project')).filter((p) => p && p.trim());
  let pAdded = 0;
  for (const name of projectNames) {
    const r = await Project.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
    if (r.upsertedCount) pAdded++;
  }
  console.log(`Projects: ${pAdded} added from existing requests (${projectNames.length} distinct found).`);

  process.exit(0);
};

run().catch((e) => { console.error('Seed failed:', e.message); process.exit(1); });
