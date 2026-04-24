const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil'
});

const priceMap = {
  'phone-case': 4999,
  'card-holder': 3999,
  'key-holder': 2999
};

const typeMeta = {
  'phone-case': {
    label: 'Phone Case',
    descriptions: {
      'forged-carbon': 'Premium forged carbon finish phone case.',
      'carbon-weave': 'Premium carbon weave finish phone case.'
    }
  },
  'card-holder': {
    label: 'Card Holder',
    descriptions: {
      'forged-carbon': 'Premium forged carbon finish card holder.',
      'carbon-weave': 'Premium carbon weave finish card holder.'
    }
  },
  'key-holder': {
    label: 'Key Holder',
    descriptions: {
      'forged-carbon': 'Premium forged carbon finish key holder.',
      'carbon-weave': 'Premium carbon weave finish key holder.'
    }
  }
};

const finishes = [
  { material: 'forged-carbon', materialLabel: 'Forged Carbon', colour: 'Black' },
  { material: 'forged-carbon', materialLabel: 'Forged Carbon', colour: 'Blue' },
  { material: 'forged-carbon', materialLabel: 'Forged Carbon', colour: 'Green' },
  { material: 'forged-carbon', materialLabel: 'Forged Carbon', colour: 'Red' },
  { material: 'forged-carbon', materialLabel: 'Forged Carbon', colour: 'Purple' },
  { material: 'forged-carbon', materialLabel: 'Forged Carbon', colour: 'Gold' },
  { material: 'forged-carbon', materialLabel: 'Forged Carbon', colour: 'Silver' },
  { material: 'carbon-weave', materialLabel: 'Carbon Weave', colour: 'Red' },
  { material: 'carbon-weave', materialLabel: 'Carbon Weave', colour: 'Blue' },
  { material: 'carbon-weave', materialLabel: 'Carbon Weave', colour: 'Green' },
  { material: 'carbon-weave', materialLabel: 'Carbon Weave', colour: 'Purple' },
  { material: 'carbon-weave', materialLabel: 'Carbon Weave', colour: 'Gold' }
];

function buildCatalog() {
  const catalog = {};
  Object.keys(typeMeta).forEach((type) => {
    finishes.forEach((finish) => {
      const slug = `${type}-${finish.material}-${finish.colour.toLowerCase()}`;
      catalog[slug] = {
        slug,
        type,
        name: `${typeMeta[type].label} — ${finish.materialLabel} ${finish.colour}`,
        description: typeMeta[type].descriptions[finish.material],
        unitAmount: priceMap[type]
      };
    });
  });
  return catalog;
}

const catalog = buildCatalog();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY environment variable.' });
  }

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const line_items = items.map((item) => {
      const entry = catalog[item.slug];
      if (!entry) throw new Error(`Unknown product slug: ${item.slug}`);
      const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, 20));
      const model = item.model && item.model !== 'One size' ? ` · ${item.model}` : '';

      return {
        quantity,
        price_data: {
          currency: 'aud',
          unit_amount: entry.unitAmount,
          product_data: {
            name: `${entry.name}${model}`,
            description: entry.description,
            metadata: {
              slug: entry.slug,
              model: item.model || 'One size'
            }
          }
        }
      };
    });

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/cart.html?checkout=success`,
      cancel_url: `${origin}/cart.html?checkout=cancelled`,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['AU']
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create checkout session.' });
  }
};


