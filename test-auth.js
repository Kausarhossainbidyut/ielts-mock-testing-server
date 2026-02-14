/**
 * Test script for authentication endpoints
 * This demonstrates how to use the registration and login APIs
 */

const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:5000/api/auth';

// Test user data
const testUserData = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123',
  targetBand: 7,
  currentLevel: 'intermediate',
  examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
};

async function testAuthentication() {
  console.log('Testing Authentication API...\n');
  
  try {
    // Test registration
    console.log('1. Testing Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUserData);
    console.log('Registration Response:', registerResponse.data);
    
    // Test login
    console.log('\n2. Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUserData.email,
      password: testUserData.password
    });
    console.log('Login Response:', loginResponse.data);
    
    // Extract token from login response
    const token = loginResponse.data.token;
    
    // Test getting current user (protected route)
    console.log('\n3. Testing Protected Route (Get Current User)...');
    const userResponse = await axios.get(`${BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': `accessToken=${token}`
      }
    });
    console.log('Current User Response:', userResponse.data);
    
    // Test logout
    console.log('\n4. Testing Logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/logout`);
    console.log('Logout Response:', logoutResponse.data);
    
    console.log('\n✓ All authentication tests passed!');
  } catch (error) {
    console.error('❌ Error during testing:', error.response?.data || error.message);
  }
}

// Run the test
testAuthentication();

module.exports = { testUserData };