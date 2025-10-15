const axios = require('axios');

async function testAIEndpoint() {
  try {
    console.log('Testing AI Chat endpoint...');
    
    const response = await axios.post('http://localhost:8000/api/v1/ai/chat', {
      message: 'What information do you have about Zubaer?',
      limit: 3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but we can see if the endpoint is reachable
      }
    });
    
    console.log('Success! Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('Error Response Status:', error.response.status);
      console.log('Error Response Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received. Server might not be running.');
    } else {
      console.log('Error:', error.message);
    }
  }
}

testAIEndpoint();
