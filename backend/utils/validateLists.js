const Category = require('../models/Category');
const Project = require('../models/Project');

// Ensures the chosen category and project exist in the managed lists.
// Returns an error message string, or null if both are valid.
module.exports = async function validateLists(category, project) {
  const [cat, proj] = await Promise.all([
    Category.findOne({ name: category }),
    Project.findOne({ name: project })
  ]);
  if (!cat) return 'Please choose a valid category.';
  if (!proj) return 'Please choose a valid project / site.';
  return null;
};
