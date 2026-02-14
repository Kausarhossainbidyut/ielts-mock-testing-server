/**
 * Utility script to create an initial admin user
 * Run this script separately to create an admin account
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
    
    // Admin user data
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'AdminPassword123',
      role: 'admin',
      verified: true
    };
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    // Create admin user
    const adminUser = new User({
      ...adminData,
      password: hashedPassword
    });
    
    const savedAdmin = await adminUser.save();
    console.log('Admin user created successfully:', savedAdmin.email);
    console.log('Please change the default credentials after first login.');
    
    // Close the connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

// Run the function
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };