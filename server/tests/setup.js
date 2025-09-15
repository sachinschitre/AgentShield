const mongoose = require('mongoose');

// Setup test environment
beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agentshield_test');
});

afterAll(async () => {
  // Clean up test database
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
