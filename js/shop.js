/**
 * MR.FANTASTIC — Shop & Checkout Logic
 * Linked directly to local Django REST Framework API Engine
 * Requires: currency.js (loaded before this file)
 * Requires: https://js.paystack.co/v1/inline.js (in checkout.html head)
 */

document.addEventListener('DOMContentLoaded', () => {
  const shopGrid   = document.getElementById('shopGrid');
  const step1      = document.getElementById('modalStep1');
  const step2      = document.getElementById('modalStep2');
  const buyBtn     = document.getElementById('modalBuyBtn');
  const backBtn    = document.getElementById('modalBackBtn');
  const proceedBtn = document.getElementById('modalProceedBtn');
  const finalPrice = document.getElementById('modalFinalPrice');
  const step2Title = document.getElementById('modalStep2Title');
  const formatOpts = document.querySelectorAll('.format-option');
  const formatSummaryEl = document.getElementById('formatSummary');
  const formatListEl = document.getElementById('formatList');

  let currentItem    = null;
  let selectedFormats = [];
  let baseUSD        = 0;

  /* ── Escape HTML Utility ───────────────────────────── */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ── FETCH LIVE ARTWORKS FROM DJANGO API ─────────────────── */
  async function loadShopCatalog() {
    if (!shopGrid) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/shop/items/');
      if (!response.ok) throw new Error('Failed to fetch shop inventory');
      
      const data = await response.json();
      const items = data.results || data;

      // Wipe out fallback placeholder items seamlessly
      shopGrid.innerHTML = '';

      if (items.length === 0) {
        shopGrid.innerHTML = `<p class="no-items" style="grid-column: 1/-1; text-align: center; color: var(--accent); padding: 4rem 0; font-family: 'Barlow Condensed'; font-size: 1.5rem;">Catalog is currently empty. Add artwork via admin panel!</p>`;
        return;
      }

      // Loop through database records and render items dynamically
      items.forEach(item => {
        const article = document.createElement('article');
        article.className = 'shop-item';
        
        // Normalize underscore codes to match your CSS dash selectors for filters
        const categoryString = item.categories.map(c => c.code.replace('_', '-')).join(' ');
        const displayTags = item.categories.map(c => c.display_name).join(' · ');

        // Safely lock database primary values into DOM data-attributes for modal processing
        article.dataset.id = item.id;
        article.dataset.cat = categoryString;
        article.dataset.title = item.title;
        article.dataset.price = Math.round(item.base_price);
        article.dataset.tag = displayTags;
        article.dataset.desc = item.description || 'Limited edition premium artwork print by MR.FANTASTIC.';
        article.dataset.img = item.image;
        article.dataset.details = JSON.stringify([
          "Available in multiple custom formats",
          "300 DPI high-resolution production master",
          "Signed digital certification file included"
        ]);

        article.innerHTML = `
          <div class="shop-item-img">
            <img src="${item.image}" alt="${escapeHtml(item.title)} — Print by MR.FANTASTIC" loading="lazy" width="600" height="750">
            <div class="shop-item-overlay">
              <button class="shop-quick-view">Quick View</button>
            </div>
          </div>
          <div class="shop-item-info">
            <div class="shop-item-meta">
              <span class="shop-item-name">${escapeHtml(item.title)}</span>
              <span class="shop-item-price">from $${Math.round(item.base_price)}</span>
            </div>
            <span class="shop-item-tag">${escapeHtml(displayTags)}</span>
            <button class="shop-item-btn">Buy Now →</button>
          </div>
        `;

        // Bind quick click handlers straight into your format selector script framework
        const bindElements = [article.querySelector('.shop-quick-view'), article.querySelector('.shop-item-btn'), article.querySelector('.shop-item-img img')];
        bindElements.forEach(el => {
          el?.addEventListener('click', (e) => {
            e.stopPropagation();
            window._mfSetCurrentItem(article);
            const modal = document.getElementById('shopModal');
            if (modal) modal.classList.add('open');
          });
        });

        shopGrid.appendChild(article);
      });

      // Re-trigger currency formatter once dynamic layout hydration is locked down
      if (window.updateShopPrices) window.updateShopPrices();

    } catch (error) {
      console.error('Error connecting to Django backend:', error);
    }
  }

  // Fire live catalog fetcher immediately
  loadShopCatalog();

  /* ── Update Visual Prices with Active Currency States ─── */
  const updateShopPrices = () => {
    const c = window.MF_Currency;
    if (!c) return;

    // Format grid dynamic label metrics
    document.querySelectorAll('.shop-item').forEach(item => {
      const usd     = parseInt(item.dataset.price, 10);
      const priceEl = item.querySelector('.shop-item-price');
      if (!usd || !priceEl || priceEl.classList.contains('sold-out-price')) return;
      priceEl.textContent = 'from ' + c.format(usd);
    });

    // Modal modifier option metrics
    formatOpts.forEach(opt => {
      const checkbox = opt.querySelector('.format-checkbox');
      if (!checkbox) return;
      const surcharge = parseInt(checkbox.dataset.surcharge, 10);
      const priceEl   = opt.querySelector('.format-surcharge');
      if (!priceEl) return;
      if (surcharge === 0)      priceEl.textContent = 'Base price';
      else if (surcharge > 0)   priceEl.textContent = '+' + c.format(surcharge);
      else                      priceEl.textContent = '−' + c.format(Math.abs(surcharge));
    });

    if (finalPrice && baseUSD > 0) {
      updateFormatSummary();
    }
  };

  if (window.MF_Currency) updateShopPrices();
  else window.addEventListener('mf:currency:ready', updateShopPrices);

  /* ── Update Format Selection Layout Cards & Totals ────── */
  function updateFormatSummary() {
    const summary = formatSummaryEl;
    const list = formatListEl;
    if (!summary || !list || !finalPrice) return;
    
    list.innerHTML = '';
    let totalUSD = 0;
    
    selectedFormats.forEach(({ format, surcharge }) => {
      totalUSD += (baseUSD + surcharge);
      const li = document.createElement('li');
      const priceText = window.MF_Currency 
        ? window.MF_Currency.format(baseUSD + surcharge) 
        : '$' + (baseUSD + surcharge);
      li.innerHTML = `<span>${escapeHtml(format)}</span><span>${escapeHtml(priceText)}</span>`;
      list.appendChild(li);
    });

    summary.style.display = selectedFormats.length > 0 ? 'block' : 'none';
    finalPrice.textContent = window.MF_Currency 
      ? window.MF_Currency.format(totalUSD) 
      : '$' + totalUSD;
    proceedBtn.disabled = selectedFormats.length === 0;
  }

  /* ── Step 1 → Step 2 Modal Panel Layout Shifts ─────────── */
  buyBtn?.addEventListener('click', () => {
    step1.style.display = 'none';
    step2.style.display = 'flex';
    step2Title.textContent = document.getElementById('modalTitle').textContent;
    selectedFormats = [];
    document.querySelectorAll('.format-option .format-checkbox').forEach(cb => cb.checked = false);
    formatOpts.forEach(o => o.classList.remove('selected'));
    
    // Hide and clear text boxes during selection resets
    document.querySelectorAll('.phone-model-input').forEach(input => {
      input.style.display = 'none';
      input.value = '';
    });
    
    updateFormatSummary();
    if (finalPrice && window.MF_Currency) {
      finalPrice.textContent = window.MF_Currency.format(0);
    }
  });

  backBtn?.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'flex';
  });

  /* ── Handle Modal Variant Checkbox Toggles ─────────────── */
  formatOpts.forEach(opt => {
    const checkbox = opt.querySelector('.format-checkbox');
    if (!checkbox) return;

    // INJECTION: Setup device input specifications container for phone options
    if (checkbox.dataset.format === 'Phone Cover') {
      const textBlock = opt.querySelector('.format-text');
      if (textBlock && !textBlock.querySelector('.phone-model-input')) {
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'phone-model-input';
        textInput.placeholder = 'ENTER SPECIFIC PHONE BRAND (E.G. IPHONE 15 PRO)';
        textInput.style.display = 'none';
        textBlock.appendChild(textInput);
      }
    }

    opt.addEventListener('click', (e) => {
      // GUARD: If user targets input panel box fields, don't execute full layout closures
      if (e.target.classList.contains('phone-model-input')) {
        return;
      }

      e.preventDefault();
      checkbox.checked = !checkbox.checked;
      opt.classList.toggle('selected', checkbox.checked);

      const format = checkbox.dataset.format;
      const surcharge = parseInt(checkbox.dataset.surcharge, 10);
      const inputField = opt.querySelector('.phone-model-input');

      if (checkbox.checked) {
        if (!selectedFormats.find(f => f.format === format)) {
          selectedFormats.push({ format, surcharge });
        }
        if (inputField) {
          inputField.style.display = 'block';
          inputField.focus();
        }
      } else {
        selectedFormats = selectedFormats.filter(f => f.format !== format);
        if (inputField) {
          inputField.style.display = 'none';
          inputField.value = '';
        }
      }

      updateFormatSummary();
    });
  });

  /* ── Compile Order & Jump to Checkout Page ────────────── */
  proceedBtn?.addEventListener('click', () => {
    if (!currentItem || selectedFormats.length === 0) return;

    let totalUSD = 0;
    selectedFormats.forEach(({ surcharge }) => {
      totalUSD += (baseUSD + surcharge);
    });

    const c = window.MF_Currency || { 
      code: 'USD', rate: 1, country: 'US',
      format: (usd) => '$' + Math.round(usd).toLocaleString(),
      paystackAmount: (usd) => Math.round(usd * 100)
    };

    // MERGE PIPELINE: Append brand text field value into standard format name string
    const finalizedFormats = selectedFormats.map(f => {
      if (f.format === 'Phone Cover') {
        const textElement = document.querySelector('.phone-model-input');
        const customSpecification = textElement ? textElement.value.trim() : '';
        return {
          format: customSpecification ? `Phone Cover (${customSpecification})` : 'Phone Cover (Unspecified Variant)',
          surcharge: f.surcharge
        };
      }
      return f;
    });

    const order = {
      id:         currentItem.dataset.id,
      title:      currentItem.dataset.title,
      img:        currentItem.dataset.img,
      tag:        currentItem.dataset.tag,
      formats:    finalizedFormats,
      priceUSD:   totalUSD,
      currency:   c.code,
      rate:       c.rate,
      country:    c.country || 'US'
    };

    try {
      sessionStorage.setItem('mf_order', JSON.stringify(order));
    } catch {
      try { localStorage.setItem('mf_order_backup', JSON.stringify(order)); } catch {}
    }

    window.location.href = 'checkout.html';
  });

  /* ── Initialize Core Modal Content Contexts ────────────── */
  window._mfSetCurrentItem = (item) => {
    currentItem    = item;
    baseUSD        = parseInt(item.dataset.price, 10) || 0;
    step1.style.display = 'flex';
    step2.style.display = 'none';
    selectedFormats = [];
    
    // Reset inputs
    document.querySelectorAll('.format-option .format-checkbox').forEach(cb => cb.checked = false);
    formatOpts.forEach(o => o.classList.remove('selected'));
    
    document.querySelectorAll('.phone-model-input').forEach(input => {
      input.style.display = 'none';
      input.value = '';
    });
    
    updateFormatSummary();

    // Hydrate modal view text fields safely
    document.getElementById('modalImg').src = item.dataset.img;
    document.getElementById('modalTitle').textContent = item.dataset.title;
    document.getElementById('modalTag').textContent = item.dataset.tag;
    document.getElementById('modalDesc').textContent = item.dataset.desc;

    const listDetails = document.getElementById('modalDetails');
    if (listDetails && item.dataset.details) {
      try {
        const detailsArray = JSON.parse(item.dataset.details);
        listDetails.innerHTML = '';
        detailsArray.forEach(txt => {
          const li = document.createElement('li');
          li.textContent = txt;
          listDetails.appendChild(li);
        });
      } catch {}
    }

    const modalPrice = document.getElementById('modalPrice');
    if (modalPrice && window.MF_Currency) {
      modalPrice.textContent = 'from ' + window.MF_Currency.format(baseUSD);
    }
  };
});


/* ── CHECKOUT APPLICATION CONTROLLER ────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.checkout-page')) return;

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!regex.test(email)) return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    const typos = {
      'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com', 'outlok.com': 'outlook.com'
    };
    if (typos[domain]) {
      const suggestion = email.replace(domain, typos[domain]);
      if (confirm(`Did you mean: ${suggestion}?`)) {
        document.getElementById('coEmail').value = suggestion;
      }
    }
    return true;
  }

  let order = null;
  try {
    const raw = sessionStorage.getItem('mf_order');
    order = raw ? JSON.parse(raw) : null;
  } catch {}

  if (!order) {
    try {
      const backup = localStorage.getItem('mf_order_backup');
      if (backup) {
        order = JSON.parse(backup);
        localStorage.removeItem('mf_order_backup');
      }
    } catch {}
  }

  if (!order) { 
    alert('No active cart records found. Rerouting to collection directory.');
    window.location.href = 'shop.html'; 
    return; 
  }

  const storedRate   = order.rate || 1;
  const storedCode   = order.currency || 'USD';
  const SYMBOLS      = { GHS:'GH₵', NGN:'₦', ZAR:'R', KES:'KSh', GBP:'£', EUR:'€', USD:'$' };
  const storedSymbol = SYMBOLS[storedCode] || '$';

  const c = window.MF_Currency || {
    code: storedCode, symbol: storedSymbol, rate: storedRate,
    format: (usd) => storedSymbol + Math.round(usd * storedRate).toLocaleString(),
    paystackAmount: (usd) => Math.round(usd * storedRate * 100)
  };

  const displayPrice = c.format(order.priceUSD);

  // Populate order verification sidebar layouts
  document.getElementById('sidebarImg').src            = order.img;
  document.getElementById('sidebarTitle').textContent  = order.title;
  document.getElementById('sidebarTag').textContent    = order.tag;
  document.getElementById('sidebarFormat').textContent = order.formats.map(f => f.format).join(', ');
  document.getElementById('sidebarTotal').textContent  = displayPrice;

  const currencyBadge = document.getElementById('sidebarCurrency');
  if (currencyBadge) currencyBadge.textContent = c.code;

  const panels   = ['panelDelivery', 'panelPayment', 'panelConfirm'];
  const stepDots = ['stepDot1', 'stepDot2', 'stepDot3'];

  const goTo = (n) => {
    panels.forEach((id, i) => { document.getElementById(id).style.display = i === n ? 'block' : 'none'; });
    stepDots.forEach((id, i) => { document.getElementById(id).classList.toggle('active', i <= n); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.getElementById('deliveryNextBtn')?.addEventListener('click', () => {
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;

    if (!name || !email || !phone || !addr || !city || !zip || !country) {
      showError('deliveryNextBtn', 'Please fill in all required fields ↑'); return;
    }
    if (!isValidEmail(email)) {
      showError('deliveryNextBtn', 'Please enter a valid email ↑'); return;
    }
    goTo(1);
  });

  document.getElementById('toggleTermsBtn')?.addEventListener('click', () => {
    const content = document.getElementById('termsContent');
    if (content) content.style.display = content.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('paymentNextBtn')?.addEventListener('click', () => {
    const method = document.querySelector('input[name="payMethod"]:checked')?.value;
    if (!method) { showError('paymentNextBtn', 'Please select a payment method ↑'); return; }

    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();

    const confirmDelivery = document.getElementById('confirmDelivery');
    confirmDelivery.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = name;
    confirmDelivery.appendChild(strong);
    confirmDelivery.appendChild(document.createElement('br'));
    confirmDelivery.appendChild(document.createTextNode(`${email} · ${phone}`));
    confirmDelivery.appendChild(document.createElement('br'));
    confirmDelivery.appendChild(document.createTextNode(addr));
    confirmDelivery.appendChild(document.createElement('br'));
    confirmDelivery.appendChild(document.createTextNode(`${city}${state ? ', ' + state : ''} ${zip}`));
    confirmDelivery.appendChild(document.createElement('br'));
    confirmDelivery.appendChild(document.createTextNode(country));
    if (notes) {
      confirmDelivery.appendChild(document.createElement('br'));
      const em = document.createElement('em'); em.textContent = notes; confirmDelivery.appendChild(em);
    }

    let payDetails = '';
    if (method === 'paystack') payDetails = `Paystack — Card, MoMo or Bank (${c.code})`;
    else if (method === 'paypal') payDetails = 'PayPal System Link';
    else if (method === 'transfer') payDetails = 'Bank Mobile Money Transfer';
    document.getElementById('confirmPayment').textContent = payDetails;

    const confirmOrder = document.getElementById('confirmOrder');
    confirmOrder.innerHTML = '';
    const strongTitle = document.createElement('strong');
    strongTitle.textContent = order.title;
    confirmOrder.appendChild(strongTitle);
    confirmOrder.appendChild(document.createElement('br'));
    confirmOrder.appendChild(document.createTextNode('Formats: ' + order.formats.map(f => f.format).join(', ')));

    document.getElementById('confirmTotal').textContent = displayPrice;
    goTo(2);
  });

  document.getElementById('paymentBackBtn')?.addEventListener('click', () => goTo(0));
  document.getElementById('confirmBackBtn')?.addEventListener('click',  () => goTo(1));

  document.querySelectorAll('input[name="payMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.pay-details').forEach(d => d.style.display = 'none');
      const panel = document.querySelector(`.${radio.value}-details`);
      if (panel) panel.style.display = 'block';
    });
  });

  document.getElementById('agreeTerms')?.addEventListener('change', (e) => {
    document.getElementById('placeOrderBtn').disabled = !e.target.checked;
  });

  /* ── Commit Transaction Records Straight into Database Engine ── */
  let orderInProgress = false;
  document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
    if (orderInProgress) return;
    const method = document.querySelector('input[name="payMethod"]:checked')?.value;
    if (!method) { alert('Please select a payment execution target.'); goTo(1); return; }

    orderInProgress = true;
    const email  = document.getElementById('coEmail').value.trim();
    const btn    = document.getElementById('placeOrderBtn');

    if (method === 'paystack') {
      btn.disabled = true;
      btn.textContent = 'Opening secure payment gateway…';

      const amountSmallestUnit = c.paystackAmount(order.priceUSD);
      const reference = 'MF_' + Date.now() + '_' + Math.random().toString(36).substr(2,6).toUpperCase();

      const handler = PaystackPop.setup({
        key:      'pk_live_YOUR_PAYSTACK_PUBLIC_KEY', 
        email:    email,
        amount:   amountSmallestUnit,
        currency: c.code,
        ref:      reference,
        label:    'MR.FANTASTIC — ' + order.title,
        callback: async (response) => {
          const savedToDb = await saveOrderToDjango(response.reference, 'paystack');
          if (savedToDb) showSuccess(email);
          else {
            alert('Payment cleared, but local sync failed. Save this transaction reference string: ' + response.reference);
            orderInProgress = false; btn.disabled = false; btn.textContent = 'Place Order →';
          }
        },
        onClose: () => { orderInProgress = false; btn.disabled = false; btn.textContent = 'Place Order →'; }
      });
      handler.openIframe();
    } else {
      btn.disabled = true;
      btn.textContent = 'Recording transaction entry…';
      const label = method === 'paypal' ? 'paypal' : 'bank_transfer';
      const reference = 'MANUAL_' + Date.now() + '_' + Math.random().toString(36).substr(2,5).toUpperCase();
      const savedToDb = await saveOrderToDjango(reference, label);
      if (savedToDb) showSuccess(email);
      else {
        alert('Could not open transaction session stream. Check local server terminal connection.');
        orderInProgress = false; btn.disabled = false; btn.textContent = 'Place Order →';
      }
    }
  });

  async function saveOrderToDjango(reference, methodSlug) {
    const name    = document.getElementById('coName').value.trim();
    const email   = document.getElementById('coEmail').value.trim();
    const phone   = document.getElementById('coPhone').value.trim();
    const addr    = document.getElementById('coAddr').value.trim();
    const city    = document.getElementById('coCity').value.trim();
    const state   = document.getElementById('coState').value.trim();
    const zip     = document.getElementById('coZip').value.trim();
    const country = document.getElementById('coCountry').value;
    const notes   = document.getElementById('coNotes').value.trim();

    const finalGHC = order.priceUSD * storedRate;

    const payload = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      address: addr,
      city: city,
      state: state || '',
      zip_code: zip || '',
      country: country,
      delivery_notes: notes || '',
      total_ghc: parseFloat(finalGHC).toFixed(2),
      total_usd: parseFloat(order.priceUSD).toFixed(2),
      payment_method: methodSlug,
      payment_reference: reference,
      payment_status: methodSlug === 'paystack' ? 'pending' : 'pending',
      order_status: 'received',
      items: order.formats.map(f => {
        const computedGHC = (parseInt(order.priceUSD, 10) / order.formats.length) * storedRate;
        return {
          shop_item: parseInt(order.id, 10) || 1, 
          format_name: f.format,
          quantity: 1,
          price: parseFloat(computedGHC).toFixed(2)
        };
      })
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/orders/create/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  function showSuccess(email) {
    sessionStorage.removeItem('mf_order');
    localStorage.removeItem('mf_order_backup');
    document.getElementById('checkoutMain').style.display   = 'none';
    document.querySelector('.checkout-steps').style.display = 'none';
    const success = document.getElementById('checkoutSuccess');
    success.style.display = 'flex';
    document.getElementById('successEmail').textContent = 'Confirmation details logged for ' + email;
  }

  function showError(btnId, msg) {
    const btn  = document.getElementById(btnId); if (!btn) return;
    const orig = btn.textContent; btn.textContent = msg; btn.style.background = '#710d0b';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2500);
  }
});

/* ── TERMS MODAL SYSTEM ASSIGNMENTS ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const termsModal = document.getElementById('termsModal');
  const openTermsBtn = document.getElementById('openTermsModalBtn');
  const closeTermsBtn = document.getElementById('termsModalClose');
  const modalAgreeBtn = document.getElementById('modalAgreeBtn');
  const agreeCheckbox = document.getElementById('agreeTerms');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  if (termsModal && openTermsBtn) {
    const closeTerms = () => { termsModal.classList.remove('open'); document.body.style.overflow = ''; };
    openTermsBtn.addEventListener('click', (e) => { e.preventDefault(); termsModal.classList.add('open'); document.body.style.overflow = 'hidden'; });
    closeTermsBtn?.addEventListener('click', closeTerms);
    modalAgreeBtn?.addEventListener('click', () => {
      if (agreeCheckbox && placeOrderBtn) { agreeCheckbox.checked = true; placeOrderBtn.disabled = false; }
      closeTerms();
    });
    termsModal.addEventListener('click', (e) => { if (e.target === termsModal) closeTerms(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && termsModal.classList.contains('open')) closeTerms(); });
  }
});