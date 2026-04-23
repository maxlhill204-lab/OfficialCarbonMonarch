window.MONARCH_CONFIG = {
  stripeLinks: {
    "phone-case": "https://buy.stripe.com/test_eVq4gy47UbbKbaU0xu0VO00",
    "card-holder": "https://buy.stripe.com/test_bJe9ASdIu4NmbaU2FC0VO01",
    "key-holder": "https://buy.stripe.com/test_6oUcN41ZMa7G4Mw1By0VO02"
  },
  socials: [
    { label: "Instagram", href: "https://instagram.com/monarchcarbon" },
    { label: "TikTok", href: "https://tiktok.com/@monarchcarbon" },
    { label: "YouTube", href: "https://youtube.com/@monarchcarbon" }
  ],
  deviceModels: [
    "iPhone 15 Pro",
    "iPhone 15 Pro Max",
    "Samsung S24",
    "Samsung S24 Ultra"
  ]
};

(function () {
  const priceMap = {
    "phone-case": "$59.99",
    "card-holder": "$49.99",
    "key-holder": "$39.99"
  };

  const typeMeta = {
    "phone-case": {
      label: "Phone Case",
      short: "Case",
      descriptions: {
        "forged-carbon": "Precision-molded carbon shell with a refined grip profile and a luxury motorsport finish.",
        "carbon-weave": "Woven carbon styling with a slim silhouette built for elevated everyday protection."
      }
    },
    "card-holder": {
      label: "Card Holder",
      short: "Card Holder",
      descriptions: {
        "forged-carbon": "A compact forged carbon card holder with lightweight structure and premium pocket presence.",
        "carbon-weave": "Classic weave detailing wraps a minimalist card holder designed for clean daily carry."
      }
    },
    "key-holder": {
      label: "Key Holder",
      short: "Key Holder",
      descriptions: {
        "forged-carbon": "Forged carbon texture brings a performance-inspired finish to a sleek key carry essential.",
        "carbon-weave": "Woven carbon styling gives this key holder a precise, understated luxury character."
      }
    }
  };

  const finishes = [
    { material: "forged-carbon", materialLabel: "Forged Carbon", colour: "Black", accent: "#d8dde6" },
    { material: "forged-carbon", materialLabel: "Forged Carbon", colour: "Blue", accent: "#3d78ff" },
    { material: "forged-carbon", materialLabel: "Forged Carbon", colour: "Green", accent: "#23b26d" },
    { material: "forged-carbon", materialLabel: "Forged Carbon", colour: "Red", accent: "#df4452" },
    { material: "forged-carbon", materialLabel: "Forged Carbon", colour: "Purple", accent: "#8966ff" },
    { material: "forged-carbon", materialLabel: "Forged Carbon", colour: "Gold", accent: "#be9d4a" },
    { material: "forged-carbon", materialLabel: "Forged Carbon", colour: "Silver", accent: "#d9e1eb" },
    { material: "carbon-weave", materialLabel: "Carbon Weave", colour: "Red", accent: "#dd525d" },
    { material: "carbon-weave", materialLabel: "Carbon Weave", colour: "Blue", accent: "#4a86ff" },
    { material: "carbon-weave", materialLabel: "Carbon Weave", colour: "Green", accent: "#2db970" },
    { material: "carbon-weave", materialLabel: "Carbon Weave", colour: "Purple", accent: "#9270ff" },
    { material: "carbon-weave", materialLabel: "Carbon Weave", colour: "Gold", accent: "#c4a655" }
  ];

  window.MONARCH_PRODUCTS = Object.keys(typeMeta).flatMap((type) => {
    return finishes.map((finish) => ({
      slug: `${type}-${finish.material}-${finish.colour.toLowerCase()}`,
      type,
      typeLabel: typeMeta[type].label,
      shortTypeLabel: typeMeta[type].short,
      name: `${typeMeta[type].label} — ${finish.materialLabel} ${finish.colour}`,
      material: finish.material,
      materialLabel: finish.materialLabel,
      colour: finish.colour,
      description: typeMeta[type].descriptions[finish.material],
      price: priceMap[type],
      accent: finish.accent
    }));
  });
})();


