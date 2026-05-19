import dotenv from 'dotenv';
dotenv.config();

async function testUpdateAPI() {
  try {
    // First, login to get a token
    const loginRes = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bookbazaar.com', 
        password: 'adminpassword'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Logged in:", token ? token.substring(0, 10) : 'FAILED');

    // Get a product
    const prodRes = await fetch('http://localhost:5000/api/products?limit=1');
    const prodData = await prodRes.json();
    const product = prodData.products[0];
    console.log("Product:", product._id);

    // Update
    const updateRes = await fetch(`http://localhost:5000/api/products/${product._id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        seoTitle: 'New Title',
        seoKeywords: ['test1', 'test2']
      })
    });
    
    if (!updateRes.ok) {
        const errData = await updateRes.json();
        console.error("Update Failed:", errData);
    } else {
        console.log("Update Success!");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testUpdateAPI();
