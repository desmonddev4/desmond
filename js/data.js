(() => {
  const base = [
    { t: "Lynne's Cosmetics: home page", img: 'w1', d: 'A cosmetics and fragrance storefront with a full-bleed hero.',
      built: 'A full-bleed hero with soft motion, a glass navigation bar and clear calls to action for browsing the collection or finding the store.' },
    { t: "Lynne's Cosmetics: featured products", img: 'w2', d: 'Featured product carousel with cart and wishlist actions.',
      built: 'A featured products carousel with a focused centre card, wishlist hearts and add-to-cart buttons, with prices shown in cedis.' }];
  const tags = ['E-commerce', 'Frontend', 'Motion', 'Full stack'];
  window.WORKS = Array.from({ length: 8 }, (_, i) => { const b = base[i % 2]; return {
    id: i, t: i < 2 ? b.t : `${b.t} (sample ${Math.ceil((i + 1) / 2)})`, tag: tags[i % 4], d: b.d, img: b.img,
    client: "Lynne's Cosmetics and Fragrance Hub", role: 'Frontend development and motion design', year: '2026',
    stack: ['HTML', 'CSS', 'JavaScript'], live: '#',
    brief: "Lynne's sells cosmetics and fragrances in Bantama, Kumasi. They needed a website that shows the range beautifully and makes it easy for customers to check what is available.",
    built: b.built,
    result: 'A polished storefront preview that is ready to be connected to real stock and prices.' } });
})();
