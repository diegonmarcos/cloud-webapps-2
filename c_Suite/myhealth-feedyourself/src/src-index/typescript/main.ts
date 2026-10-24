import { proteins, sides, allFood, shopCategories } from './data';
import type {
  FoodItem,
  MealSlot,
  Selections,
  MealsState,
  MealData,
  ShopData,
  ShopItem,
  PriceItem,
  ShopCategory,
} from './types';

// State
let selections: Selections = {};

// DOM Helper
function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function setText(id: string, val: string | number): void {
  const el = $(id);
  if (el) el.innerText = String(val);
}

// Initialize
export function init(): void {
  // Render Proteins
  renderGroup(proteins, 'vegan', 'row-vegan');
  renderGroup(proteins, 'veg', 'row-veg');
  renderGroup(proteins, 'meat', 'row-meat');

  // Render Sides
  renderGroup(sides, 'vegan', 'row-side-vegan');
  renderGroup(sides, 'veg', 'row-side-veg');

  // Setup Scroll Spy for Mobile
  setupScrollSpy();

  // Bind input events
  bindInputEvents();

  calculate();
}

function bindInputEvents(): void {
  const inputIds = ['inBase', 'inActive', 'inDeficit', 'inProtein', 'inCarbMode', 'inCost'];
  inputIds.forEach((id) => {
    const el = $(id) as HTMLInputElement | HTMLSelectElement | null;
    if (el) {
      el.addEventListener('change', calculate);
    }
  });
}

function setupScrollSpy(): void {
  const options: IntersectionObserverInit = {
    root: null,
    rootMargin: '-40% 0px -40% 0px',
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.glass-panel').forEach((p) => p.classList.remove('highlighted'));
        entry.target.classList.add('highlighted');
      }
    });
  }, options);

  document.querySelectorAll('.glass-panel').forEach((panel) => {
    observer.observe(panel);
  });
}

function renderGroup(data: FoodItem[], sub: string, elId: string): void {
  const container = $(elId);
  if (!container) return;

  container.innerHTML = data
    .filter((i) => i.sub === sub)
    .map(
      (item) => `
        <div class="food-card" id="card-${item.id}" data-id="${item.id}">
            <div class="meal-indicator" id="badge-${item.id}"></div>
            <img src="${item.img}" class="card-img" loading="lazy" alt="${item.name}">
            <div class="card-content">
                <div class="card-title">${item.name}</div>
                <div class="card-details">
                    <span>${item.kcal} kc</span>
                    <span>${item.prot}p</span>
                </div>
            </div>
        </div>
    `
    )
    .join('');

  // Add click handlers
  container.querySelectorAll('.food-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      if (id) tapCard(id);
    });
  });
}

function tapCard(id: string): void {
  if (!selections[id]) selections[id] = 0;
  selections[id] = ((selections[id] + 1) % 4) as MealSlot;

  updateVisuals(id);
  updateState();
}

function updateVisuals(id: string): void {
  const card = $(`card-${id}`);
  const badge = $(`badge-${id}`);
  const state = selections[id];

  if (!card || !badge) return;

  card.classList.remove('active');
  badge.className = 'meal-indicator';
  badge.innerText = '';

  if (state > 0) {
    card.classList.add('active');
    if (state === 1) {
      badge.classList.add('status-b');
      badge.innerText = 'B';
    }
    if (state === 2) {
      badge.classList.add('status-l');
      badge.innerText = 'L';
    }
    if (state === 3) {
      badge.classList.add('status-d');
      badge.innerText = 'D';
    }
  }
}

function updateState(): void {
  const meals: MealsState = {
    1: { k: 0, p: 0, c: 0, f: 0, i: [] },
    2: { k: 0, p: 0, c: 0, f: 0, i: [] },
    3: { k: 0, p: 0, c: 0, f: 0, i: [] },
  };

  // Clear selected views
  ['list-b', 'list-l', 'list-d'].forEach((id) => {
    const el = $(id);
    if (el) el.innerHTML = '';
  });

  const colMap: Record<number, string> = { 1: 'list-b', 2: 'list-l', 3: 'list-d' };
  const clsMap: Record<number, string> = { 1: 'sel-b', 2: 'sel-l', 3: 'sel-d' };

  Object.keys(selections).forEach((id) => {
    const qty = selections[id];
    if (qty > 0) {
      const item = allFood.find((f) => f.id === id);
      if (!item) return;

      // Macros Sum
      meals[qty as 1 | 2 | 3].k += item.kcal || 0;
      meals[qty as 1 | 2 | 3].p += item.prot || 0;
      meals[qty as 1 | 2 | 3].c += item.carb || 0;
      meals[qty as 1 | 2 | 3].f += item.fat || 0;
      meals[qty as 1 | 2 | 3].i.push(item.name);

      // Render Tiny Card in Selected Column
      const container = $(colMap[qty]);
      if (container) {
        const div = document.createElement('div');
        div.className = `selected-card ${clsMap[qty]}`;
        div.innerHTML = `
          <img src="${item.img}" alt="${item.name}">
          <div class="info">${item.name}</div>
        `;
        container.appendChild(div);
      }
    }
  });

  // Update Summary Table Rows
  updateSumRow(1, meals[1]);
  updateSumRow(2, meals[2]);
  updateSumRow(3, meals[3]);

  // Grand Totals
  const tK = meals[1].k + meals[2].k + meals[3].k;
  const tP = meals[1].p + meals[2].p + meals[3].p;
  const tC = meals[1].c + meals[2].c + meals[3].c;
  const tF = meals[1].f + meals[2].f + meals[3].f;

  const gTotal = $('grand-total');
  if (gTotal) {
    gTotal.innerText = String(tK);

    // Color warning if over budget
    const budgetEl = $('outTotalKcal');
    const budget = budgetEl ? parseInt(budgetEl.innerText) || 9999 : 9999;
    gTotal.style.color = tK > budget ? 'var(--danger)' : 'var(--accent)';
  }

  setText('grand-prot', tP);
  setText('grand-carb', tC);
  setText('grand-fat', tF);

  // Ratio for Grand Total
  const gRatio = tP > 0 ? (tK / tP).toFixed(1) : '-';
  setText('grand-ratio', gRatio);

  renderShoppingList();
}

function updateSumRow(n: number, data: MealData): void {
  setText(`m${n}-kcal`, data.k);
  setText(`m${n}-prot`, data.p);
  setText(`m${n}-carb`, data.c);
  setText(`m${n}-fat`, data.f);

  const ratio = data.p > 0 ? (data.k / data.p).toFixed(1) : '-';
  setText(`m${n}-ratio`, ratio);
}

function renderShoppingList(): void {
  const container = $('shopping-list-container');
  if (!container) return;

  const shopData: ShopData = {};

  // Aggregate
  Object.keys(selections).forEach((id) => {
    const count = selections[id];
    if (count > 0) {
      const item = allFood.find((f) => f.id === id);
      if (!item) return;

      const cat = item.shopCat || 'Others';
      if (!shopData[cat]) shopData[cat] = [];

      const existing = shopData[cat].find((x) => x.name === item.name);
      if (existing) {
        existing.g += item.grams * count;
      } else {
        shopData[cat].push({
          name: item.name,
          g: item.grams * count,
          unitSize: item.unitG || 100,
          priceKg: item.priceKg,
          isProtein: item.id.startsWith('p'),
        });
      }
    }
  });

  // Render Shopping List
  let html = '';
  let hasItems = false;
  const flatItemsForPrice: PriceItem[] = [];

  shopCategories.forEach((cat) => {
    if (shopData[cat] && shopData[cat].length > 0) {
      hasItems = true;
      html += `<div class="shop-category">${cat}</div>`;
      shopData[cat].forEach((i) => {
        const units = (i.g / i.unitSize).toFixed(1);
        const unitDisplay = units.endsWith('.0') ? units.slice(0, -2) : units;
        const priceTotal = (i.g / 1000) * i.priceKg;

        flatItemsForPrice.push({ ...i, cat: cat, total: priceTotal });

        html += `
          <div class="shop-item">
              <span>${i.name}</span>
              <span class="shop-amt">${i.g}g</span>
              <span class="shop-unit">${unitDisplay} u</span>
              <span class="shop-amt">$${i.priceKg.toFixed(2)}</span>
              <span class="shop-unit" style="color:var(--success)">$${priceTotal.toFixed(2)}</span>
          </div>
        `;
      });
    }
  });

  if (!hasItems)
    html =
      '<div style="text-align:center; color:#666; padding:20px; font-size:0.8rem;">Add items to menu to generate list</div>';
  container.innerHTML = html;

  renderPriceTables(flatItemsForPrice, hasItems);
}

function renderPriceTables(items: PriceItem[], hasItems: boolean): void {
  const container = $('price-analysis-container');
  if (!container) return;

  if (!hasItems) {
    container.innerHTML = '<div class="placeholder-box">Add items to menu to calculate costs</div>';
    return;
  }

  // Table 1: Breakdown by Category
  let t1 = `
    <div class="category-header" style="margin-top:0;">Breakdown by Category</div>
    <table class="price-table">
        <thead>
            <tr>
                <th>Category</th>
                <th>Total Amt (g)</th>
                <th>Total $</th>
            </tr>
        </thead>
        <tbody>
  `;

  let grandTotal = 0;

  shopCategories.forEach((cat) => {
    const catItems = items.filter((i) => i.cat === cat);
    if (catItems.length > 0) {
      const catTotal = catItems.reduce((sum, item) => sum + item.total, 0);
      const catWeight = catItems.reduce((sum, item) => sum + item.g, 0);

      grandTotal += catTotal;

      t1 += `
        <tr>
            <td style="color:var(--accent); font-weight:500;">${cat}</td>
            <td>${catWeight}g</td>
            <td>$${catTotal.toFixed(2)}</td>
        </tr>
      `;
    }
  });

  t1 += `
        <tr style="border-top: 1px solid white;">
            <td colspan="2" style="font-weight:bold; color:white;">Total</td>
            <td style="font-weight:bold; color:var(--success);">$${grandTotal.toFixed(2)}</td>
        </tr>
        </tbody></table>`;

  // Table 2: Protein Items vs Sides Items
  let protSum = 0;
  let sideSum = 0;

  const protItems = items.filter((i) => i.isProtein);
  const sideItems = items.filter((i) => !i.isProtein);

  let t2 = `
    <div class="category-header">Breakdown by Types</div>
    <table class="price-table">
        <thead>
            <tr>
                <th>Type</th>
                <th>Amt (g)</th>
                <th>Avg $/kg</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
  `;

  if (protItems.length > 0) {
    const totalG = protItems.reduce((a, b) => a + b.g, 0);
    const totalCost = protItems.reduce((a, b) => a + b.total, 0);
    const avgPrice = totalCost / (totalG / 1000);
    protSum = totalCost;

    t2 += `
      <tr>
          <td style="color:var(--accent)">Protein Items</td>
          <td>${totalG}</td>
          <td>${avgPrice.toFixed(2)}</td>
          <td>$${totalCost.toFixed(2)}</td>
      </tr>
    `;
  }

  if (sideItems.length > 0) {
    const totalG = sideItems.reduce((a, b) => a + b.g, 0);
    const totalCost = sideItems.reduce((a, b) => a + b.total, 0);
    const avgPrice = totalCost / (totalG / 1000);
    sideSum = totalCost;

    t2 += `
      <tr>
          <td style="color:var(--warning)">Sides Items</td>
          <td>${totalG}</td>
          <td>${avgPrice.toFixed(2)}</td>
          <td>$${totalCost.toFixed(2)}</td>
      </tr>
    `;
  }

  t2 += `
        <tr style="border-top: 1px solid white;">
            <td colspan="3" style="font-weight:bold; color:white;">Total</td>
            <td style="font-weight:bold; color:var(--success);">$${(protSum + sideSum).toFixed(2)}</td>
        </tr>
        </tbody></table>`;

  container.innerHTML = t1 + t2;
}

function calculate(): void {
  const base = parseInt((($('inBase') as HTMLInputElement)?.value) || '0');
  const active = parseInt((($('inActive') as HTMLInputElement)?.value) || '0');
  const deficit = parseInt((($('inDeficit') as HTMLInputElement)?.value) || '0');
  const proteinTarget = parseInt((($('inProtein') as HTMLSelectElement)?.value) || '0');
  const cost = parseInt((($('inCost') as HTMLSelectElement)?.value) || '10');
  const carbLimit = parseInt((($('inCarbMode') as HTMLSelectElement)?.value) || '250');

  const totalNet = base + active - deficit;
  const proteinKcal = proteinTarget * cost;
  const sidesKcal = totalNet - proteinKcal;

  // Daily
  setText('outTotalKcal', totalNet);
  setText('outProtKcal', proteinKcal);
  setText('outSidesKcal', sidesKcal);
  setText('outProtG', proteinTarget + 'g');
  setText('outCarbsLimit', carbLimit + 'g');

  // Per Meal (/3)
  setText('outTotalKcalMeal', Math.round(totalNet / 3));
  setText('outProtKcalMeal', Math.round(proteinKcal / 3));
  setText('outSidesKcalMeal', Math.round(sidesKcal / 3));
  setText('outProtGMeal', Math.round(proteinTarget / 3) + 'g');
  setText('outCarbsLimitMeal', Math.round(carbLimit / 3) + 'g');

  updateState();
}

// Initialize on load
window.onload = init;
