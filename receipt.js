(function(){
  const el = document.getElementById('receipt-body');
  // The checkout flow stores payment data in localStorage under 'posterpoint_receipt' when available
  const receipt = JSON.parse(localStorage.getItem('posterpoint_receipt') || 'null');
  if(!receipt){
    el.innerHTML = '<div class="empty">No receipt found. If you completed payment, make sure the payment handler saved the receipt.</div>';
    return;
  }
  const items = receipt.items || [];
  const list = document.createElement('div');
  list.style.display='flex'; list.style.flexDirection='column'; list.style.gap='10px';
  items.forEach(i=>{
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `<img src="${encodeURI(i.file)}"><div class="meta"><div class="name">${i.name}</div><div class="line">${i.price} × ${i.qty}</div></div>`;
    list.appendChild(row);
  });
  el.appendChild(list);
  const total = receipt.total || 0;
  const t = document.createElement('div');
  t.className='total'; t.style.marginTop='12px'; t.textContent = '₹' + total;
  el.appendChild(t);
  const meta = document.createElement('div'); meta.style.marginTop='12px'; meta.innerHTML = `<div>Payment ID: ${receipt.payment_id || '—'}</div><div>Order ID: ${receipt.order_id || '—'}</div>`;
  el.appendChild(meta);
})();
