/* services cards: cursor-following spotlight */
(() => {
  const cards = [...document.querySelectorAll('.sv')];
  if (!cards.length || matchMedia('(hover:none)').matches) return;
  cards.forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();
