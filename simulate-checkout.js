// simulate-checkout.js
// Minimal script: read images-manifest.js, create a small cart, POST /create-order,
// simulate payment, write posterpoint_receipt.json and print it.

const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadImageCatalog(manifestPath){
  const raw = fs.readFileSync(manifestPath, 'utf8');
  // strip code fences and leading comments
  let txt = raw.replace(/^\s*```(?:javascript)?\n/, '').replace(/\n```\s*$/, '\n');
  txt = txt.replace(/^\/\/.*\n/, '');
  txt = txt.replace(/window\.imageCatalog\s*=\s*/, 'globalThis.imageCatalog = ');
  const sandbox = { globalThis: {} };
  vm.runInNewContext(txt, sandbox, { filename: manifestPath });
  return sandbox.globalThis.imageCatalog || sandbox.imageCatalog;
}

async function run(){
  const manifestPath = path.join(__dirname, 'images-manifest.js');
  if(!fs.existsSync(manifestPath)){
    console.error('images-manifest.js not found at', manifestPath);
    process.exitCode = 1; return;
  }

  let catalog;
  try{ catalog = loadImageCatalog(manifestPath); }catch(e){ console.error('Failed to load manifest:', e.message); process.exitCode = 1; return; }
  if(!catalog || typeof catalog !== 'object'){ console.error('imageCatalog not found in manifest'); process.exitCode = 1; return; }

  const items = [];
  for(const cat of Object.keys(catalog)){
    const arr = catalog[cat];
    if(Array.isArray(arr) && arr.length>0){
      const fname = arr[0];
      items.push({ id: `${cat.toLowerCase().replace(/\s+/g,'-')}-1`, name: `${cat} Art`, file: `images/PINTEREST IMAGES/${cat}/${fname}`, price:39, qty:1 });
    }
    if(items.length >= 4) break;
  }

  const total = items.reduce((s,i)=>s + i.price*i.qty, 0);
  const amountPaise = Math.round(total*100);
  console.log('Simulating cart with', items.length, 'items. Total:', total, 'INR');

  // call server
  const url = 'http://127.0.0.1:3000/create-order';
  let orderResp;
  try{
    const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: 'sim_rcpt_'+Date.now() }) });
    orderResp = await res.json();
  }catch(e){ console.error('Call to /create-order failed:', e.message); process.exitCode = 1; return; }

  console.log('Order response:', orderResp);
  const order = orderResp && (orderResp.order || orderResp);

  const receipt = { payment_id: 'pay_sim_'+Date.now(), order_id: order && (order.id||order.order_id) || null, items, total };
  const out = path.join(__dirname, 'posterpoint_receipt.json');
  fs.writeFileSync(out, JSON.stringify(receipt, null, 2), 'utf8');
  console.log('Wrote', out);
  console.log(JSON.stringify(receipt, null, 2));
}

run();
 b // simulate-checkout.js
// Reads images-manifest.js, builds a small cart, calls /create-order, simulates payment,
// writes posterpoint_receipt.json and prints the receipt.

const fs = require('fs');
const vm = require('vm');
const path = require('path');

async function main(){
  const manifestPath = path.join(__dirname, 'images-manifest.js');
  if(!fs.existsSync(manifestPath)){
    console.error('images-manifest.js not found');
    process.exit(1);
  }

  let txt = fs.readFileSync(manifestPath, 'utf8');
  // strip optional code fences and leading comment
  txt = txt.replace(/^\s*```(?:javascript)?\n/, '').replace(/\n```\s*$/, '\n');
  // simulate-checkout.js
  // Clean single-file script

  const fs = require('fs');
  const vm = require('vm');
  const path = require('path');

  async function main(){
    const manifestPath = path.join(__dirname, 'images-manifest.js');
    if(!fs.existsSync(manifestPath)){
      console.error('images-manifest.js not found');
      process.exit(1);
    }

    let txt = fs.readFileSync(manifestPath, 'utf8');
    // strip optional code fences and leading comment
    txt = txt.replace(/^\s*```(?:javascript)?\n/, '').replace(/\n```\s*$/, '\n');
    txt = txt.replace(/^\/\/.*\n/, '');
    // expose as globalThis.imageCatalog
    txt = txt.replace(/window\.imageCatalog\s*=\s*/, 'globalThis.imageCatalog = ');

    const sandbox = { globalThis: {} };
    try{
      vm.runInNewContext(txt, sandbox, { filename: 'images-manifest.js' });
    }catch(e){
      console.error('Failed to evaluate manifest:', e.message);
      process.exit(1);
    }

    const imageCatalog = (sandbox.globalThis && sandbox.globalThis.imageCatalog) || sandbox.imageCatalog || global.imageCatalog;
    if(!imageCatalog){
      console.error('Could not extract imageCatalog from manifest');
      process.exit(1);
    }

    const items = [];
    for(const cat of Object.keys(imageCatalog)){
      const arr = imageCatalog[cat];
      if(Array.isArray(arr) && arr.length>0){
        const fname = arr[0];
        const filePath = `images/PINTEREST IMAGES/${cat}/${fname}`;
        items.push({ id: `${cat.toLowerCase().replace(/\s+/g,'-')}-1`, name: `${cat} Art`, file: filePath, price: 39, qty: 1 });
      }
      if(items.length >= 4) break;
    }

    if(items.length === 0){
      console.error('No items found to add to cart');
      process.exit(1);
    }

    const total = items.reduce((s,i)=>s + i.price * i.qty, 0);
    const amountPaise = Math.round(total * 100);

    console.log('Cart items:', items.map(i=>i.name));
    console.log('Total INR:', total, 'Amount (paise):', amountPaise);

    // POST to server
    const url = 'http://127.0.0.1:3000/create-order';
    let orderResp = null;
    try{
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: 'sim_rcpt_' + Date.now() }) });
      orderResp = await res.json();
    }catch(e){
      console.error('Failed to call server /create-order:', e.message);
      process.exit(1);
    }

    console.log('Server /create-order response:', orderResp);
    const order = orderResp.order || orderResp;

    // Simulate successful payment response from Razorpay
    const paymentId = 'pay_fake_' + Date.now();
    const receipt = { payment_id: paymentId, order_id: order && (order.id || order.order_id) ? (order.id || order.order_id) : null, items, total };

  const outPath = path.join(__dirname, 'posterpoint_receipt.json');
    fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2), 'utf8');
    console.log('Wrote receipt to', outPath);
    console.log(JSON.stringify(receipt, null, 2));
  }

  main().catch(err=>{ console.error(err); process.exit(1); });
      console.error('images-manifest.js not found');
