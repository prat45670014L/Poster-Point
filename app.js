    // --------- Configure products here ----------
    // We auto-generate product entries from the images folder. Each item has:
    // - id: generated
    // - file: relative path to the image (includes category folder)
    // - name: generated title based on category + short index
    // - price: default price (can be edited)

    // imageCatalog can be provided by external manifest `images-manifest.js` which defines
    // `window.imageCatalog`. If not present, fall back to a small built-in list.
    const defaultCatalog = {
      'ANIME': [ 'f75c9121-71df-4455-a8e1-faeecd64a8ca.jpg', 'ITACHI UCHIHA.jpg', '😎.jpg' ],
      'ASTHETICS': [ '054b4be9-76a8-4bab-a4f0-eb440af13ad4.jpg' ],
      'DC': [ '0cd1aca9-4fac-4320-8fab-e67045858a5b.jpg' ],
      'DEVOTIONAL': [ '0471acf6-bd53-4860-8037-c3c5e84f9730.jpg' ],
      'MARVEL': [ '001 _ IRON MAN.jpg' ],
      'MOVIE POSTERS': []
    };

    const imageCatalog = window.imageCatalog || defaultCatalog;

  // Build products array from catalog. You can tune basePrice.
  const basePrice = 39;
    const products = [];
    Object.keys(imageCatalog).forEach(cat=>{
      imageCatalog[cat].forEach((fname, idx)=>{
        const id = `${cat.toLowerCase().replace(/\s+/g,'-')}-${idx+1}`;
  // Use the category name as the product title (e.g., 'ANIME' -> 'Anime')
  const title = (cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
        const filePath = `images/PINTEREST IMAGES/${cat}/${fname}`;
        products.push({ id, file: filePath, name: title, price: basePrice, category: cat });
      });
    });
    // -------------------------------------------

    // Basic in-memory cart (no backend)
    const cart = {};

    function formatINR(n){ return '₹' + n.toFixed(0); }

    // Render product cards with initial limit (show first 6) and a toggle to show more
    const grid = document.getElementById('product-grid');
    const SHOW_INITIAL = 6;
    let showingAll = false;
    // Size options and prices
    const sizeOptions = [
      { id: 'A4', label: 'A4', price: 39 },
      { id: 'A3', label: 'A3', price: 69 },
      { id: 'A5', label: 'A5', price: 25 },
      { id: '4x6', label: '4*6 inch', price: 19 }
    ];
  // Filtering state
  const types = ['Posters', 'Keychains', 'Stickers', 'Photoframes'];
  // allow preselecting type via ?type= in URL
  const urlParams = new URLSearchParams(window.location.search);
  const preType = urlParams.get('type');
  let selectedType = types.includes(preType) ? preType : 'Posters';
    let selectedSubcat = null; // matches keys from imageCatalog (folders)
    let searchTerm = '';

    // Wire sidebar: populate types and subcategories
    function initSidebar(){
      const typeList = document.getElementById('type-list');
      const subcatList = document.getElementById('subcats');
      if(!typeList || !subcatList) return;
      typeList.innerHTML = '';
      types.forEach(t=>{
        const li = document.createElement('li');
        li.textContent = t;
        li.dataset.type = t;
        if(t === selectedType) li.classList.add('active');
        li.addEventListener('click', ()=>{
          selectedType = t;
          selectedSubcat = null;
          Array.from(typeList.children).forEach(ch=>ch.classList.remove('active'));
          li.classList.add('active');
          populateSubcats();
          applyFilters();
        });
        typeList.appendChild(li);
      });
      populateSubcats();
    }

    function populateSubcats(){
      const subcatList = document.getElementById('subcats');
      if(!subcatList) return;
      subcatList.innerHTML = '';
      if(selectedType === 'Posters'){
        Object.keys(imageCatalog).forEach(catKey=>{
          const li = document.createElement('li');
          li.textContent = catKey;
          li.dataset.cat = catKey;
          if(catKey === selectedSubcat) li.classList.add('active');
          li.addEventListener('click', ()=>{
            if(selectedSubcat === catKey){ selectedSubcat = null; li.classList.remove('active'); }
            else{ selectedSubcat = catKey; Array.from(subcatList.children).forEach(ch=>ch.classList.remove('active')); li.classList.add('active'); }
            applyFilters();
          });
          subcatList.appendChild(li);
        });
      } else {
        const li = document.createElement('li'); li.textContent = 'No categories yet'; li.style.color = 'var(--muted)'; subcatList.appendChild(li);
      }
    }

    // Wire search input
    const searchInput = document.getElementById('search-input');
    if(searchInput){
      searchInput.addEventListener('input', (e)=>{ searchTerm = e.target.value.trim().toLowerCase(); applyFilters(); });
    }

    // Compute filteredProducts from current state
    function getFilteredProducts(){
      let res = products.slice();
      if(selectedType && selectedType !== 'Posters'){
        res = [];
      }
      if(selectedSubcat){
        res = res.filter(p => p.category === selectedSubcat);
      }
      if(searchTerm){
        res = res.filter(p => p.name.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm));
      }
      return res;
    }

    function applyFilters(){
      showingAll = false;
      renderProducts();
      updateUI();
    }

    function renderProducts(){
      grid.innerHTML = '';
      const all = getFilteredProducts();
      if(all.length === 0){
        grid.innerHTML = '<div class="empty">No items found for this selection.</div>';
        const existingToggle = document.getElementById('show-toggle'); if(existingToggle) existingToggle.remove();
        return;
      }
      const list = showingAll ? all : all.slice(0, SHOW_INITIAL);
      list.forEach(p=>{
        const card = document.createElement('div');
          card.className = 'card';
          // build size options html
          const sizeHtml = sizeOptions.map(s=>`<option value="${s.id}" data-price="${s.price}" ${s.id==='A4'?'selected':''}>${s.label} - ₹${s.price}</option>`).join('');
          card.innerHTML = `
            <img class="thumb" src="${encodeURI(p.file)}" alt="${escapeHtml(p.name)}" loading="lazy">
            <div class="badge-a4">A4</div>
            <div class="card-body">
              <div class="product-name">${escapeHtml(p.name)}</div>
              <div class="product-price">${formatINR(sizeOptions[0].price)}</div>
              <div class="muted">Limited edition print • <span class="size-label">A4</span></div>
              <div class="controls">
                <label style="font-size:13px; margin-bottom:6px">Size</label>
                <select class="size-select" data-id="${p.id}">${sizeHtml}</select>
                <div class="controls-row">
                  <div class="qty">Qty: <span style="font-weight:900;margin-left:8px" id="${p.id}-display">0</span></div>
                  <button class="add" data-id="${p.id}">Add to cart</button>
                </div>
              </div>
            </div>
          `;

        // Attach error handler: if the image fails to load, remove this product entirely
        const imgEl = card.querySelector('.thumb');
        imgEl.addEventListener('error', ()=>{
          // remove product from products array
          const idx = products.findIndex(x=>x.id === p.id);
          if(idx !== -1) products.splice(idx, 1);
          // remove from cart if present
          if(cart[p.id]) delete cart[p.id];
          // re-render products & cart UI
          renderProducts();
          updateUI();
        });

        // Append card after wiring handlers
        grid.appendChild(card);
        // update price when size changed
        const sel = card.querySelector('.size-select');
        if(sel){
          sel.addEventListener('change', (ev)=>{
            const opt = sel.selectedOptions[0];
            const price = Number(opt.dataset.price || 0);
            const priceEl = card.querySelector('.product-price');
            const sizeLabel = card.querySelector('.size-label');
            if(priceEl) priceEl.textContent = formatINR(price);
            if(sizeLabel) sizeLabel.textContent = opt.textContent.split(' - ')[0];
          });
        }
      });

      // Show toggle button if there are more than SHOW_INITIAL products
      let toggle = document.getElementById('show-toggle');
      if(!toggle){
        toggle = document.createElement('div');
        toggle.id = 'show-toggle';
        toggle.style.textAlign = 'center';
        toggle.style.marginTop = '18px';
        const btn = document.createElement('button');
        btn.className = 'checkout';
        btn.id = 'toggle-btn';
        btn.textContent = 'Show more';
        btn.style.padding = '8px 12px';
        btn.addEventListener('click', ()=>{
          showingAll = !showingAll;
          btn.textContent = showingAll ? 'Show less' : 'Show more';
          renderProducts();
          updateUI();
        });
        toggle.appendChild(btn);
        grid.parentNode.insertBefore(toggle, grid.nextSibling);
      } else {
        const btn = document.getElementById('toggle-btn');
        if(btn) btn.textContent = showingAll ? 'Show less' : 'Show more';
      }
    }

  // initial render
  initSidebar();
  renderProducts();

    // Utilities
    function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // Add to cart handler: read selected size for the product
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('button.add');
      if(!btn) return;
      const id = btn.getAttribute('data-id');
      // find the select next to this button
      const card = btn.closest('.card');
      let size = 'A4'; let price = 39;
      if(card){
        const sel = card.querySelector('.size-select');
        if(sel){ size = sel.value; price = Number(sel.selectedOptions[0].dataset.price || price); }
      }
      addToCart(id, 1, size, price);
    });

    function addToCart(id, qty=1, size='A4', priceOverride=null){
      const prod = products.find(p=>p.id===id);
      if(!prod) return;
      // Cart key includes size so same image with different sizes are separate items
      const key = `${id}::${size}`;
      if(!cart[key]){
        cart[key] = { ...prod, qty:0, size, price: priceOverride !== null ? priceOverride : prod.price, id: key };
      }
      cart[key].qty += qty;
      updateUI();
    }

    function removeFromCart(id){
      delete cart[id];
      updateUI();
    }

    function changeQty(id, newQty){
      if(newQty <= 0) { removeFromCart(id); return; }
      if(cart[id]) cart[id].qty = newQty;
      updateUI();
    }

    function clearCart(){
      for(const k in cart) delete cart[k];
      updateUI();
    }

    // Render cart UI
    const cartBody = document.getElementById('cart-body');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartEmpty = document.getElementById('cart-empty');

    function updateUI(){
      // update product qty displays (sum across size variants)
      products.forEach(p=>{
        const el = document.getElementById(`${p.id}-display`);
        if(!el) return;
        const sum = Object.values(cart).filter(ci=>String(ci.id).startsWith(p.id + '::') || String(ci.id) === p.id).reduce((s,i)=>s + (i.qty||0),0);
        el.textContent = sum;
      });

      // render items
      const entries = Object.values(cart);
      if(entries.length === 0){
        cartBody.innerHTML = '<div class="empty">Your cart is empty — add some posters!</div>';
        cartCount.textContent = '0 items';
        cartTotal.textContent = '₹0';
        return;
      }

      cartBody.innerHTML = '';
      let total = 0;
      entries.forEach(item=>{
        total += item.price * item.qty;
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <img src="${encodeURI(item.file)}" alt="${escapeHtml(item.name)}">
          <div class="meta">
            <div class="name">${escapeHtml(item.name)} <span style="font-weight:600;color:var(--muted);">(${item.size})</span></div>
            <div class="line">₹${item.price} × ${item.qty} = ₹${item.price*item.qty}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            <div style="display:flex;gap:6px">
              <button class="decrease" data-id="${item.id}" title="Decrease">−</button>
              <button class="increase" data-id="${item.id}" title="Increase">+</button>
            </div>
            <button style="background:transparent;border:none;color:var(--muted);font-size:12px;cursor:pointer" class="remove" data-id="${item.id}">Remove</button>
          </div>
        `;
        cartBody.appendChild(row);
      });
      cartCount.textContent = `${entries.reduce((s,i)=>s+i.qty,0)} items`;
      cartTotal.textContent = '₹' + total.toFixed(0);
    }

    // Cart increase / decrease / remove handlers
    cartBody.addEventListener('click', (e)=>{
      const inc = e.target.closest('button.increase');
      const dec = e.target.closest('button.decrease');
      const rem = e.target.closest('button.remove');
      if(inc){ const id = inc.dataset.id; changeQty(id, (cart[id]?.qty || 1) + 1); }
      if(dec){ const id = dec.dataset.id; changeQty(id, (cart[id]?.qty || 1) - 1); }
      if(rem){ const id = rem.dataset.id; removeFromCart(id); }
    });

    // Clear cart button
    document.getElementById('clear-cart').addEventListener('click', ()=> clearCart());

    // Checkout: navigate to a dedicated checkout page. Cart is persisted to localStorage
    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) checkoutBtn.addEventListener('click', ()=>{
      const entries = Object.values(cart);
      if(entries.length===0){ alert('Your cart is empty. Add items before checkout.'); return; }
      try{
        localStorage.setItem('posterpoint_cart', JSON.stringify(cart));
      }catch(err){ console.warn('Could not save cart to localStorage', err); }
      // Navigate to checkout page
      window.location.href = 'checkout.html';
    });
    // header checkout button
    const navCheckout = document.getElementById('nav-checkout-btn');
    if(navCheckout){
      // toggle cart drawer on header button click
      navCheckout.addEventListener('click', ()=>{
        const drawer = document.getElementById('cart');
        if(!drawer) return;
        const isOpen = drawer.classList.contains('open');
        if(isOpen) closeCart(); else openCart();
      });
    }

    // open / close cart drawer
    function openCart(){
      const drawer = document.getElementById('cart'); if(!drawer) return;
      drawer.classList.add('open');
      updateNavIcon(true);
      updateUI();
    }
    function closeCart(){
      const drawer = document.getElementById('cart'); if(!drawer) return;
      drawer.classList.remove('open');
      updateNavIcon(false);
    }

    // update header nav icon to cross when cart open
    function updateNavIcon(open){
      const nav = document.getElementById('nav-checkout-btn');
      if(!nav) return;
      if(open){
        nav.innerHTML = '✕ <span style="margin-left:6px">Close</span>';
      } else {
        nav.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 6h15l-1.5 9h-12L4 3H2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /><circle cx="10" cy="20" r="1" fill="currentColor" /><circle cx="18" cy="20" r="1" fill="currentColor" /></svg><span style="margin-left:6px">Checkout</span>`;
      }
    }

    // cart close button in drawer
    const cartClose = document.getElementById('cart-close-btn');
    if(cartClose) cartClose.addEventListener('click', ()=> closeCart());

    // init UI
    updateUI();

    // Optional: keyboard shortcuts for testing
    window.addEventListener('keydown', (e)=>{
      if(e.key === 'c' && (e.ctrlKey || e.metaKey)){ // Ctrl/Cmd + C clears cart
        e.preventDefault();
        if(confirm('Clear cart?')) clearCart();
      }
    });

    // END script


