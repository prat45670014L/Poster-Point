// Minimal Express server demonstrating Razorpay order creation (test/demo only)
// Usage: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment, then `node server.js`

const express = require('express');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');

const app = express();
app.use(bodyParser.json());

// Simple CORS allow for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let rz = null;
if(KEY_ID && KEY_SECRET){
  rz = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  console.log('Razorpay configured with key id', KEY_ID.slice(0,6) + '...');
} else {
  console.warn('Razorpay keys not set. Server will return simulated orders for local testing.');
}

app.post('/create-order', async (req, res) => {
  try{
    const { amount, currency, receipt } = req.body;
    if(!amount) return res.status(400).json({ error: 'amount required' });

    if(rz){
      const options = { amount: amount, currency: currency || 'INR', receipt: receipt || 'rcpt_' + Date.now() };
      const order = await rz.orders.create(options);
      return res.json({ order, key_id: KEY_ID });
    }

    // fallback: return a simulated order object so client can still open checkout.js in test mode
    const fakeOrder = {
      id: 'order_fake_' + Date.now(),
      amount: amount,
      currency: currency || 'INR',
      receipt: receipt || 'rcpt_' + Date.now(),
      status: 'created'
    };
    return res.json({ order: fakeOrder, key_id: '' });
  }catch(err){
    console.error('create-order error', err);
    return res.status(500).json({ error: 'could not create order', details: String(err && err.message ? err.message : err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server listening on http://localhost:' + PORT));
