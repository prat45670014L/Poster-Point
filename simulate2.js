// simulate2.js
// Lightweight simulator: parse images-manifest.js with regex (no eval), build a small cart,
// POST /create-order, simulate payment, write posterpoint_receipt.json and print it.

const fs = require('fs');
const path = require('path');

function parseManifest(manifestPath){
  const txt = fs.readFileSync(manifestPath, 'utf8');
  // remove code fences if present
  const clean = txt.replace(/^\s*```(?:javascript)?\n/, '').replace(/\n```\s*$/, '\n');
  // find categories and their array content using a regex
  const re = /"([^"\\]+)"\s*:\s*\[([\s\S]*?)\]/g;
  const catalog = {};
  let m;
  while((m = re.exec(clean)) !== null){
    const cat = m[1];
    const arrText = m[2];
    // extract quoted items inside the array
    const itemRe = /"((?:\\"|[^"])+)"/g;
    const items = [];
    let it;
    while((it = itemRe.exec(arrText)) !== null){
      items.push(it[1]);
    }
    catalog[cat] = items;
  }
  return catalog;
}

async function run(){
  const manifestPath = path.join(__dirname, 'images-manifest.js');
  if(!fs.existsSync(manifestPath)){
    console.error('manifest not found', manifestPath); process.exit(1);
  }
  const catalog = parseManifest(manifestPath);
  const items = [];
  for(const cat of Object.keys(catalog)){
    const arr = catalog[cat];
    if(Array.isArray(arr) && arr.length>0){
      const fname = arr[0];
      items.push({ id: `${cat.toLowerCase().replace(/\s+/g,'-')}-1`, name: `${cat} Art`, file: `images/PINTEREST IMAGES/${cat}/${fname}`, price:39, qty:1 });
    }
    if(items.length>=4) break;
  }
  if(items.length===0){ console.error('no items parsed'); process.exit(1); }
  const total = items.reduce((s,i)=>s+i.price*i.qty,0);
  const amountPaise = Math.round(total*100);
  console.log('Cart items:', items.map(i=>i.name), 'total', total);

  // POST to server
  const url = 'http://127.0.0.1:3000/create-order';
  let orderResp;
  try{
    const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ amount: amountPaise, currency:'INR', receipt:'sim_rcpt_'+Date.now() }) });
    orderResp = await res.json();
  }catch(e){ console.error('server request failed', e.message); process.exit(1); }

  console.log('orderResp:', orderResp);
  const order = orderResp && (orderResp.order || orderResp);
  const receipt = { payment_id: 'pay_sim_'+Date.now(), order_id: order && (order.id||order.order_id) || null, items, total };
  const out = path.join(__dirname, 'posterpoint_receipt.json');
  fs.writeFileSync(out, JSON.stringify(receipt,null,2),'utf8');
  console.log('Wrote', out);
  console.log(JSON.stringify(receipt,null,2));
}

run();
