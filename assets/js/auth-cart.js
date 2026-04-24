(function () {
  const guestCartKey = 'monarchcarbon_guest_cart_v1';
  const body = document.body;
  const products = window.MONARCH_PRODUCTS || [];
  let firebaseReady = false;
  let auth = null;
  let db = null;
  let googleProvider = null;
  let currentUser = null;
  let cartItems = [];
  let isCheckingOut = false;

  function initFirebase() {
    const app = window.MONARCH_FIREBASE;
    if (!app) return false;
    auth = app.auth;
    db = app.db;
    googleProvider = app.googleProvider;
    firebaseReady = true;
    return true;
  }

  function productBySlug(slug) {
    return products.find((item) => item.slug === slug);
  }

  function getGuestCart() {
    try {
      return JSON.parse(localStorage.getItem(guestCartKey) || '[]');
    } catch {
      return [];
    }
  }

  function setGuestCart(items) {
    localStorage.setItem(guestCartKey, JSON.stringify(items));
  }

  function itemKey(item) {
    return `${item.slug}__${item.model || 'default'}`;
  }

  function mergeItems(base, incoming) {
    const map = new Map();
    [...base, ...incoming].forEach((item) => {
      const key = itemKey(item);
      const existing = map.get(key);
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        map.set(key, {
          ...item,
          quantity: item.quantity || 1
        });
      }
    });
    return [...map.values()];
  }

  async function loadUserCart(uid) {
    const snap = await db.collection('carts').doc(uid).get();
    return snap.exists ? (snap.data().items || []) : [];
  }

  async function saveUserCart(uid, items) {
    await db.collection('carts').doc(uid).set({
      items,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async function loadCart() {
    cartItems = currentUser && firebaseReady ? await loadUserCart(currentUser.uid) : getGuestCart();
    renderCartEverywhere();
  }

  async function persistCart() {
    if (currentUser && firebaseReady) {
      await saveUserCart(currentUser.uid, cartItems);
    } else {
      setGuestCart(cartItems);
    }
    renderCartEverywhere();
  }

  async function addToCart(item) {
    cartItems = mergeItems(cartItems, [item]);
    await persistCart();
    openCartDrawer();
  }

  async function updateQty(index, delta) {
    const next = [...cartItems];
    const item = next[index];
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) next.splice(index, 1);
    cartItems = next;
    await persistCart();
  }

  async function removeItem(index) {
    const next = [...cartItems];
    next.splice(index, 1);
    cartItems = next;
    await persistCart();
  }

  function subtotal(items) {
    return items.reduce((sum, item) => sum + ((item.unitAmount || 0) * (item.quantity || 1)), 0);
  }

  function currency(amount) {
    return `$${amount.toFixed(2)}`;
  }

  function parseAmount(label) {
    return Number(String(label).replace(/[^0-9.]/g, '')) || 0;
  }

  function createChrome() {
    if (document.getElementById('auth-modal')) return;

    const navWrap = document.querySelector('.nav-wrap');
    if (navWrap && !document.getElementById('nav-user-actions')) {
      const actions = document.createElement('div');
      actions.id = 'nav-user-actions';
      actions.className = 'nav-user-actions';
      actions.innerHTML = `
        <a class="nav-link cart-link" href="cart.html">Cart <span id="cart-count" class="cart-count">0</span></a>
        <button id="auth-trigger" class="button button-secondary nav-auth-button" type="button">Sign In</button>
      `;
      navWrap.appendChild(actions);
    }

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'overlay-shell hidden';
    modal.innerHTML = `
      <div class="overlay-backdrop" data-close-auth></div>
      <div class="overlay-panel auth-panel">
        <button class="overlay-close" type="button" data-close-auth>×</button>
        <p class="eyebrow">Account</p>
        <h2>Sign in or create an account</h2>
        <div id="auth-message" class="auth-message"></div>
        <form id="auth-form" class="auth-form">
          <label>Email</label>
          <input id="auth-email" type="email" required placeholder="you@example.com" />
          <label>Password</label>
          <input id="auth-password" type="password" required placeholder="Minimum 6 characters" />
          <div class="auth-actions-row">
            <button class="button button-primary" type="submit">Sign In</button>
            <button class="button button-secondary" type="button" id="signup-button">Create Account</button>
          </div>
        </form>
        <div class="auth-divider"><span>or</span></div>
        <button id="google-signin" class="button button-secondary auth-google" type="button">Continue with Google</button>
      </div>
    `;

    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'overlay-shell hidden';
    drawer.innerHTML = `
      <div class="overlay-backdrop" data-close-cart></div>
      <aside class="overlay-panel cart-panel">
        <button class="overlay-close" type="button" data-close-cart>×</button>
        <p class="eyebrow">Saved Cart</p>
        <h2>Your cart</h2>
        <div id="cart-drawer-body" class="cart-body"></div>
      </aside>
    `;

    document.body.appendChild(modal);
    document.body.appendChild(drawer);

    document.getElementById('auth-trigger')?.addEventListener('click', openAuthModal);
    document.querySelectorAll('[data-close-auth]').forEach((el) => el.addEventListener('click', closeAuthModal));
    document.querySelectorAll('[data-close-cart]').forEach((el) => el.addEventListener('click', closeCartDrawer));
    document.getElementById('auth-form')?.addEventListener('submit', handleSignIn);
    document.getElementById('signup-button')?.addEventListener('click', handleSignUp);
    document.getElementById('google-signin')?.addEventListener('click', handleGoogleSignIn);
  }

  function authMessage(message, error) {
    const target = document.getElementById('auth-message');
    if (!target) return;
    target.innerHTML = message || '';
    target.className = `auth-message ${error ? 'is-error' : 'is-ok'}`;
  }

  function openAuthModal() {
    document.getElementById('auth-modal')?.classList.remove('hidden');
  }

  function closeAuthModal() {
    document.getElementById('auth-modal')?.classList.add('hidden');
  }

  function openCartDrawer() {
    document.getElementById('cart-drawer')?.classList.remove('hidden');
  }

  function closeCartDrawer() {
    document.getElementById('cart-drawer')?.classList.add('hidden');
  }

  async function handleSignIn(event) {
    event.preventDefault();
    if (!firebaseReady) return authMessage('Firebase is not ready yet.', true);
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      closeAuthModal();
    } catch (error) {
      authMessage(error.message, true);
    }
  }

  async function handleSignUp() {
    if (!firebaseReady) return authMessage('Firebase is not ready yet.', true);
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      closeAuthModal();
    } catch (error) {
      authMessage(error.message, true);
    }
  }

  async function handleGoogleSignIn() {
    if (!firebaseReady) return authMessage('Firebase is not ready yet.', true);
    try {
      await auth.signInWithPopup(googleProvider);
      closeAuthModal();
    } catch (error) {
      authMessage(error.message, true);
    }
  }

  async function handleLogout() {
    if (!firebaseReady) return;
    await auth.signOut();
  }

  function renderAuthButton() {
    const trigger = document.getElementById('auth-trigger');
    if (!trigger) return;
    const replacement = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(replacement, trigger);
    if (currentUser) {
      replacement.textContent = currentUser.email ? currentUser.email.split('@')[0] : 'Account';
      replacement.addEventListener('click', openAccountMenu);
    } else {
      replacement.textContent = 'Sign In';
      replacement.addEventListener('click', openAuthModal);
    }
  }

  function openAccountMenu() {
    authMessage(currentUser ? `Signed in as ${currentUser.email}. <button id="logout-button" class="text-link inline-link" type="button">Log out</button>` : '', false);
    document.getElementById('logout-button')?.addEventListener('click', handleLogout, { once: true });
    openAuthModal();
  }

  async function startCheckout(itemsOverride) {
    if (isCheckingOut) return;
    const items = itemsOverride || cartItems;
    if (!items.length) return;
    isCheckingOut = true;
    setCheckoutBusy(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Unable to start Stripe checkout.');
      }
      window.location.href = data.url;
    } catch (error) {
      renderCheckoutStatus(error.message || 'Unable to start checkout.', true);
    } finally {
      isCheckingOut = false;
      setCheckoutBusy(false);
    }
  }

  function setCheckoutBusy(isBusy) {
    document.querySelectorAll('[data-checkout-all],[data-checkout-item]').forEach((el) => {
      if (el.tagName === 'BUTTON') el.disabled = isBusy;
      if (isBusy) {
        el.dataset.originalLabel = el.dataset.originalLabel || el.textContent;
        el.textContent = 'Loading…';
      } else if (el.dataset.originalLabel) {
        el.textContent = el.dataset.originalLabel;
      }
    });
  }

  function renderCheckoutStatus(message, error) {
    const targets = document.querySelectorAll('[data-checkout-status]');
    targets.forEach((target) => {
      target.textContent = message || '';
      target.className = `auth-message ${error ? 'is-error' : 'is-ok'}`;
    });
  }

  function renderCartEverywhere() {
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const countTarget = document.getElementById('cart-count');
    if (countTarget) countTarget.textContent = String(count);

    const drawerBody = document.getElementById('cart-drawer-body');
    if (drawerBody) drawerBody.innerHTML = cartMarkup(false);

    const cartPage = document.getElementById('cart-page');
    if (cartPage) cartPage.innerHTML = cartMarkup(true);

    bindCartControls();
    applyCartStatusFromUrl();
  }

  function cartMarkup(fullPage) {
    if (!cartItems.length) {
      return `
        <div class="empty-cart">
          <p>Your cart is empty.</p>
          <a class="button button-primary" href="shop.html">Browse Products</a>
        </div>
      `;
    }

    const rows = cartItems.map((item, index) => `
      <article class="cart-item">
        <div>
          <h3>${item.name}</h3>
          <p>${item.model || 'One size'} · ${item.priceLabel}</p>
        </div>
        <div class="cart-item-controls">
          <div class="qty-row">
            <button type="button" data-cart-dec="${index}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-inc="${index}">+</button>
          </div>
          <strong>${currency((item.unitAmount || 0) * (item.quantity || 1))}</strong>
          <div class="cart-item-action-buttons">
            <button type="button" class="button button-primary small-button" data-checkout-item="${index}">Buy This</button>
            <button type="button" class="text-link remove-link" data-cart-remove="${index}">Remove</button>
          </div>
        </div>
      </article>
    `).join('');

    return `
      <div class="cart-items-wrap">${rows}</div>
      <div class="cart-summary-box">
        <div class="cart-summary-row"><span>Subtotal</span><strong>${currency(subtotal(cartItems))}</strong></div>
        <p class="price-note">Secure Stripe checkout. All cart items can now be paid in one session.</p>
        <div data-checkout-status class="auth-message"></div>
        <div class="cart-summary-actions">
          <button type="button" class="button button-primary" data-checkout-all>Checkout Everything</button>
          ${fullPage ? '' : '<a class="button button-secondary" href="cart.html">Open Cart Page</a>'}
          <a class="button button-secondary" href="shop.html">Continue Shopping</a>
        </div>
      </div>
    `;
  }

  function bindCartControls() {
    document.querySelectorAll('[data-cart-inc]').forEach((button) => button.onclick = () => updateQty(Number(button.dataset.cartInc), 1));
    document.querySelectorAll('[data-cart-dec]').forEach((button) => button.onclick = () => updateQty(Number(button.dataset.cartDec), -1));
    document.querySelectorAll('[data-cart-remove]').forEach((button) => button.onclick = () => removeItem(Number(button.dataset.cartRemove)));
    document.querySelectorAll('[data-checkout-all]').forEach((button) => button.onclick = () => startCheckout());
    document.querySelectorAll('[data-checkout-item]').forEach((button) => button.onclick = () => {
      const index = Number(button.dataset.checkoutItem);
      const item = cartItems[index];
      if (item) startCheckout([item]);
    });
  }

  function buildCurrentProductItem() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || 'phone-case-forged-carbon-black';
    const product = productBySlug(slug);
    if (!product) return null;
    const deviceSelect = document.getElementById('device-select');
    const model = deviceSelect ? deviceSelect.value : 'One size';
    return {
      slug: product.slug,
      type: product.type,
      name: product.name,
      quantity: 1,
      model,
      priceLabel: product.price,
      unitAmount: parseAmount(product.price)
    };
  }

  function enhanceProductPage() {
    if (body.dataset.page !== 'product') return;
    const actions = document.querySelector('.product-actions');
    if (!actions) return;

    if (!document.getElementById('add-to-cart-button')) {
      const addButton = document.createElement('button');
      addButton.id = 'add-to-cart-button';
      addButton.className = 'button button-secondary';
      addButton.type = 'button';
      addButton.textContent = 'Add to Cart';
      addButton.addEventListener('click', async () => {
        const item = buildCurrentProductItem();
        if (!item) return;
        await addToCart(item);
      });
      actions.prepend(addButton);
    }

    const buyNow = actions.querySelector('.button-primary');
    if (buyNow) {
      buyNow.setAttribute('href', '#');
      buyNow.textContent = 'Buy Now';
      buyNow.onclick = async (event) => {
        event.preventDefault();
        const item = buildCurrentProductItem();
        if (!item) return;
        await startCheckout([item]);
      };
    }
  }

  function applyCartStatusFromUrl() {
    if (body.dataset.page !== 'cart') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      renderCheckoutStatus('Payment completed. Check Stripe for the new order.', false);
    } else if (params.get('checkout') === 'cancelled') {
      renderCheckoutStatus('Checkout cancelled. Your cart is still here.', true);
    }
  }

  async function handleAuthState(user) {
    currentUser = user;
    if (currentUser) {
      const guestItems = getGuestCart();
      const userItems = await loadUserCart(currentUser.uid);
      const merged = mergeItems(userItems, guestItems);
      cartItems = merged;
      await saveUserCart(currentUser.uid, merged);
      setGuestCart([]);
    }
    await loadCart();
    renderAuthButton();
  }

  async function init() {
    createChrome();
    enhanceProductPage();

    if (!initFirebase()) {
      renderCartEverywhere();
      return;
    }

    auth.onAuthStateChanged(handleAuthState);
    await loadCart();
    renderAuthButton();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', enhanceProductPage);
})();


