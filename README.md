# MonarchCarbon

Luxury static eCommerce storefront for premium carbon fiber accessories.

## Files

- `index.html` — homepage
- `shop.html` — collection page with filters
- `product.html` — reusable product detail page powered by URL params
- `contact.html` — contact page
- `sponsors.html` — dedicated sponsors page
- `assets/css/styles.css` — site styling
- `assets/js/products.js` — full catalogue and site config
- `assets/js/main.js` — rendering and interactions
- `assets/favicon.svg` — favicon
- `assets/social-preview.svg` — social preview image
- `vercel.json` — Vercel static config
- `netlify.toml` — Netlify static config

## What is included

- 3 product categories: phone cases, card holders, key holders
- 36 products total
- Full-card clickable product boxes
- Reusable product page with colour and model or fit selectors only
- Dropdowns styled to feel clearly interactive
- Separate contact and sponsors pages
- Sponsors page featuring an Australian 17-year-old climber placeholder with "previously 6th in the state"
- Static-only deployment ready for Vercel or Netlify

## Replace placeholders before launch

- Stripe payment link in `assets/js/products.js`
- Social media URLs in `assets/js/products.js`
- Contact emails in `contact.html`
- `og:url` values in the HTML files
- Final athlete name, bio, images, and sponsor details in `sponsors.html`

## Upload to GitHub

```bash
git init
git add .
git commit -m "Initial MonarchCarbon site"
git remote add origin https://github.com/YOUR-USERNAME/monarchcarbon.git
git branch -M main
git push -u origin main
```

## Deploy to Vercel

- Import the GitHub repo in Vercel
- Build command: none
- Output directory: `.`

## Deploy to Netlify

- Import the GitHub repo in Netlify
- Build command: none
- Publish directory: `.`

`netlify.toml` is already included.
