// Read cart from localStorage and render
(function(){
  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function formatINR(n){ return '₹' + n.toFixed(0); }

  const body = document.getElementById('checkout-body');
  const totalEl = document.getElementById('checkout-total');
  const payBtn = document.getElementById('pay-btn');

  let cart = {};
  try{ cart = JSON.parse(localStorage.getItem('posterpoint_cart')|| '{}'); }catch(e){ cart = {}; }
  const entries = Object.values(cart);
  if(entries.length === 0){
    body.innerHTML = '<div class="empty">No items in cart — go back and add some posters.</div>';
    payBtn.disabled = true;
    return;
  }

  // render entries
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '12px';
  entries.forEach(item=>{
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${encodeURI(item.file)}" alt="${escapeHtml(item.name)}">
      <div class="meta">
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="line">${formatINR(item.price)} × ${item.qty} = ${formatINR(item.price*item.qty)}</div>
      </div>
    `;
    list.appendChild(row);
  });
  body.appendChild(list);

  const total = entries.reduce((s,i)=>s + i.price * i.qty, 0);
  totalEl.textContent = formatINR(total);

  // Minimum order enforcement
  const MIN_ORDER = 250;
  const minNote = document.getElementById('min-order-note');
  function refreshMinStatus(){
    if(total < MIN_ORDER){
      payBtn.disabled = true;
      if(minNote) minNote.style.display = 'block';
    } else {
      payBtn.disabled = false;
      if(minNote) minNote.style.display = 'none';
    }
  }
  refreshMinStatus();

  payBtn.addEventListener('click', ()=>{
    // Prevent programmatic bypass
    if(total < MIN_ORDER){
      alert('Minimum order amount is ₹' + MIN_ORDER + '. Please add more items to your cart to proceed.');
      return;
    }
    // server-backed order creation flow
    const amountPaise = Math.round(total * 100);
    const payload = { amount: amountPaise, currency: 'INR', receipt: 'rcpt_' + Date.now() };

    // POST to local server to create an order. Server should return { order, key_id }
    fetch('http://localhost:3000/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r=> r.json())
      .then(data => {
        // support both { order, key_id } and direct order responses
        const order = data.order || data;
        const key = data.key_id || data.key_id || 'YOUR_RAZORPAY_KEY_HERE';

        const options = {
          key,
          amount: amountPaise,
          currency: 'INR',
    name: 'Poster Point',
          description: 'Anime posters purchase',
          order_id: order && (order.id || order.order_id) ? (order.id || order.order_id) : undefined,
          handler: function(response){
            // Save receipt and redirect to receipt page
            const receipt = { payment_id: response.razorpay_payment_id, order_id: response.razorpay_order_id || null, items: entries, total };
            try{ localStorage.setItem('posterpoint_receipt', JSON.stringify(receipt)); }catch(e){}
            localStorage.removeItem('posterpoint_cart');
            window.location.href = 'receipt.html';
          },
          prefill: { name: '', email: '' },
          notes: { items: entries.map(i=>`${i.name} x ${i.qty}`).join(', ') }
        };

        if(typeof Razorpay !== 'undefined'){
          try{
            const rzp = new Razorpay(options);
            rzp.open();
          }catch(err){
            console.error('Razorpay open error', err);
            alert('Could not open Razorpay. The server may be down or key is invalid. Simulating payment.');
            localStorage.removeItem('posterpoint_cart');
            window.location.href = 'index.html';
          }
        } else {
          // If the SDK is not loaded, simulate success for local testing
          console.warn('Razorpay SDK not available; simulating payment.');
          localStorage.removeItem('posterpoint_cart');
          window.location.href = 'receipt.html';
        }
      })
      .catch(err => {
        console.error('Order creation failed', err);
        alert('Could not create order on the server. Simulating payment for testing.');
        localStorage.removeItem('posterpoint_cart');
        window.location.href = 'index.html';
      });
  });

  // Close/back button: use history.back() if available, otherwise go to index.html
  function goBackOrHome(){
    try{
      if(window.history && window.history.length > 1){
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    }catch(e){ window.location.href = 'index.html'; }
  }

  const closeBtn = document.getElementById('checkout-close-btn');
  if(closeBtn){
    closeBtn.addEventListener('click', goBackOrHome);
  }

  // Allow Escape key to close the checkout page
  window.addEventListener('keydown', (ev)=>{
    if(ev.key === 'Escape') goBackOrHome();
  });
})();
