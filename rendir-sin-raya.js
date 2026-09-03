// Rinde versiones SIN RAYA LARGA de los 4 boards que la tienen impresa.
// NO sobrescribe ningun PNG existente: escribe archivos nuevos con sufijo .SIN-RAYA.png
// La raya larga esta prohibida por voice.md ("es el tell mas confiable que existe").
function cargarPlaywright() {
  for (const r of ['playwright', 'C:/Users/Roberto Mendez/ShopFlow/test/node_modules/playwright'])
    { try { return require(r); } catch (e) {} }
  throw new Error('No encontre playwright.');
}
const { chromium } = cargarPlaywright();
const base = 'C:/Users/Roberto Mendez/Desktop/HQ/Pit Stop';
const fuente = base + '/PitStop-Web/jdm-posts.html';
const salida = base + '/PitStop-JDM';
const ids = ['b2', 'b6', 'b8', 'b11'];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto('file:///' + encodeURI(fuente), { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // El guion corto es el reemplazo que manda voice.md ("guion corto (-) para rangos y pausas")
  const cambios = await page.evaluate((ids) => {
    const hechos = [];
    for (const id of ids) {
      const b = document.getElementById(id);
      if (!b) { hechos.push({ id, error: 'no existe el board' }); continue; }
      for (const el of b.querySelectorAll('*')) {
        for (const n of el.childNodes) {
          if (n.nodeType === 3 && n.textContent.includes('\u2014')) {
            const antes = n.textContent;
            n.textContent = antes.replace(/\s*\u2014\s*/g, ' - ');
            hechos.push({ id, antes: antes.trim(), despues: n.textContent.trim() });
          }
        }
      }
    }
    return hechos;
  }, ids);

  for (const id of ids) {
    const el = await page.$('#' + id);
    if (!el) continue;
    await el.screenshot({ path: `${salida}/jdm-${id}.SIN-RAYA.png` });
  }
  // se comprueba que no quedo ni una en los 4 boards
  const restantes = await page.evaluate((ids) =>
    ids.map(id => ({ id, rayas: (document.getElementById(id)?.innerText || '').split('\u2014').length - 1 })), ids);

  console.log('CAMBIOS:'); cambios.forEach(c => console.log(' ', JSON.stringify(c)));
  console.log('RAYAS QUE QUEDAN:', JSON.stringify(restantes));
  await browser.close();
})();
