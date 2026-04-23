(function () {
  const products = window.MONARCH_PRODUCTS || [];
  const config = window.MONARCH_CONFIG || {};
  const body = document.body;

  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function setupReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  function getTextureClass(material) {
    return material === 'carbon-weave' ? 'weave' : 'forged';
  }

  function getShapeClass(type) {
    if (type === 'card-holder') return 'shape-card-holder';
    if (type === 'key-holder') return 'shape-key-holder';
    return 'shape-phone-case';
  }

  function createProductArtwork(product, large = false) {
    const wrapperClass = large ? 'product-display' : 'product-image';
    return `
      <div class="${wrapperClass} ${getTextureClass(product.material)}">
        <div class="product-shape ${getShapeClass(product.type)}" style="background:
          linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02)),
          radial-gradient(circle at 25% 20%, ${product.accent}55, transparent 24%),
          linear-gradient(140deg, rgba(10,12,18,0.95), rgba(24,28,34,0.92));"></div>
      </div>
    `;
  }

  function productCard(product) {
    return `
      <a class="product-card product-card-link reveal" href="product.html?slug=${encodeURIComponent(product.slug)}" aria-label="View ${product.name}">
        ${createProductArtwork(product)}
        <div class="product-content">
          <p class="product-meta">${product.typeLabel} · ${product.materialLabel} · ${product.colour}</p>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="price-row">
            <span class="price">${product.price}</span>
            <span class="text-link">View Product</span>
          </div>
        </div>
      </a>
    `;
  }

  function renderFeatured() {
    const target = document.getElementById('featured-products');
    if (!target) return;
    const featuredSlugs = [
      'phone-case-forged-carbon-black',
      'card-holder-carbon-weave-blue',
      'key-holder-forged-carbon-silver'
    ];
    const featured = featuredSlugs.map((slug) => products.find((item) => item.slug === slug)).filter(Boolean);
    target.innerHTML = featured.map(productCard).join('');
    setupReveal();
  }

  function renderCategoryTiles() {
    const target = document.getElementById('category-products');
    if (!target) return;
    const reps = [
      'phone-case-forged-carbon-black',
      'card-holder-forged-carbon-black',
      'key-holder-forged-carbon-black'
    ].map((slug) => products.find((item) => item.slug === slug)).filter(Boolean);
    target.innerHTML = reps.map(productCard).join('');
    setupReveal();
  }

  function populateSelect(select, values, formatter) {
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = formatter ? formatter(value) : value;
      select.appendChild(option);
    });
  }

  function renderShop() {
    const grid = document.getElementById('shop-products');
    const typeFilter = document.getElementById('type-filter');
    const materialFilter = document.getElementById('material-filter');
    const colourFilter = document.getElementById('colour-filter');
    const count = document.getElementById('results-count');
    if (!grid || !typeFilter || !materialFilter || !colourFilter || !count) return;

    populateSelect(colourFilter, [...new Set(products.map((item) => item.colour.toLowerCase()))], (value) => value.charAt(0).toUpperCase() + value.slice(1));

    const params = new URLSearchParams(window.location.search);
    ['type', 'material', 'colour'].forEach((key) => {
      const element = document.getElementById(`${key}-filter`);
      if (element && params.get(key)) element.value = params.get(key);
    });

    const update = () => {
      const filtered = products.filter((product) => {
        const typeMatch = typeFilter.value === 'all' || product.type === typeFilter.value;
        const materialMatch = materialFilter.value === 'all' || product.material === materialFilter.value;
        const colourMatch = colourFilter.value === 'all' || product.colour.toLowerCase() === colourFilter.value;
        return typeMatch && materialMatch && colourMatch;
      });
      grid.innerHTML = filtered.map(productCard).join('');
      count.textContent = `${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
      setupReveal();
    };

    [typeFilter, materialFilter, colourFilter].forEach((select) => select.addEventListener('change', update));
    update();
  }

  function getSiblingColours(product) {
    return products.filter((item) => item.type === product.type && item.material === product.material);
  }

  function buildColourSwatches(product) {
    return getSiblingColours(product).map((item) => `
      <a
        class="colour-swatch ${item.slug === product.slug ? 'is-active' : ''}"
        href="product.html?slug=${encodeURIComponent(item.slug)}"
        aria-label="Select ${item.colour}"
        title="${item.colour}"
      >
        <span class="colour-dot" style="background:
          radial-gradient(circle at 30% 30%, ${item.accent}, #111 70%),
          linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02));"></span>
        <span class="colour-name">${item.colour}</span>
      </a>
    `).join('');
  }

  function buildDeviceOptions(product) {
    if (product.type !== 'phone-case') {
      return '<option value="single-fit">One size</option>';
    }
    return (config.deviceModels || []).map((model) => `<option value="${model}">${model}</option>`).join('');
  }

  function renderProduct() {
    const target = document.getElementById('product-detail');
    if (!target) return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || 'phone-case-forged-carbon-black';
    const product = products.find((item) => item.slug === slug) || products[0];
    if (!product) return;

    document.title = `${product.name} — MonarchCarbon`;

    target.innerHTML = `
      <div class="product-media">
        ${createProductArtwork(product, true)}
      </div>
      <div class="product-summary">
        <p class="eyebrow">${product.typeLabel} · ${product.materialLabel}</p>
        <h1>${product.name}</h1>
        <div class="product-badges">
          <span class="badge">Premium carbon fiber finish</span>
          <span class="badge">Lightweight luxury construction</span>
          <span class="badge">Stripe checkout ready</span>
        </div>
        <p>${product.description}</p>
        <p class="price">${product.price}</p>
        <p class="price-note">This product page stays on the selected product type. Choose another colour below, then select your model or fit.</p>

        <div class="selector-grid selector-grid-product">
          <div class="selector-group selector-wide">
            <label>Colour</label>
            <div class="colour-swatch-grid">${buildColourSwatches(product)}</div>
          </div>
          <div class="selector-group ${product.type === 'phone-case' ? '' : 'selector-wide'}">
            <label for="device-select">${product.type === 'phone-case' ? 'Device model' : 'Fit'}</label>
            <div class="select-wrap">
              <select id="device-select">${buildDeviceOptions(product)}</select>
            </div>
          </div>
        </div>

        <div class="product-actions">
          <a class="button button-primary" href="${(config.stripeLinks && config.stripeLinks[product.type]) || "https://buy.stripe.com/test_placeholder"}" target="_blank" rel="noopener noreferrer">Buy Now</a>
          <a class="button button-secondary" href="shop.html?type=${product.type}">Back to Collection</a>
        </div>
      </div>
    `;
  }

  function renderSocials() {
    const containers = document.querySelectorAll('[data-social-links]');
    if (!containers.length || !config.socials) return;
    containers.forEach((container) => {
      container.innerHTML = config.socials.map((item) => `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join('');
    });
  }

  function initTilt() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.transform = `rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    setupReveal();
    initTilt();
    renderSocials();

    switch (body.dataset.page) {
      case 'home':
        renderFeatured();
        renderCategoryTiles();
        break;
      case 'shop':
        renderShop();
        break;
      case 'product':
        renderProduct();
        break;
      default:
        break;
    }
  });
})();

