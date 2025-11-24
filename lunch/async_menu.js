let dishes = [];
const ORDER_KEY = 'eatbox_order';
const selectedDishes = { soup: null, main: null, salad: null, drink: null, dessert: null };

const sectionIdToCategory = {
  "soups": "soup",
  "main-dishes": "main",
  "salads": "salad",
  "drinks": "drink",
  "desserts": "dessert"
};

const sectionsEl = {};

function loadLocalOrder() {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return { ...selectedDishes };
    const parsed = JSON.parse(raw);
    return Object.assign({}, selectedDishes, parsed);
  } catch (e) {
    console.error('Ошибка чтения localStorage', e);
    return { ...selectedDishes };
  }
}

function saveLocalOrder(obj) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(obj));
}

async function loadDishes() {
  try {
    const response = await fetch('https://691f340fbb52a1db22c0e77c.mockapi.io/api/eatbox/dish');
    if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Не удалось загрузить блюда:', error);
    return [];
  }
}

async function initApp() {
  dishes = await loadDishes();
  dishes.sort((a, b) => a.name.localeCompare(b.name));

  const persisted = loadLocalOrder();
  Object.assign(selectedDishes, persisted);

  Object.entries(sectionIdToCategory).forEach(([secId, cat]) => {
    const grid = document.querySelector(`#${secId} .menu-grid`);
    if (!grid) console.warn(`menu-grid не найден для секции "${secId}"`);
    sectionsEl[cat] = grid;
  });

  Object.values(sectionIdToCategory).forEach(cat => renderCategory(cat));

  setupFilters();
  updateOrder();

  setupForm();

  initCheckoutPanel();
}

function createDishCard(dish) {
  const card = document.createElement("div");
  card.className = "dish";
  card.dataset.dish = dish.keyword;
  card.dataset.kind = dish.kind;
  card.dataset.category = dish.category;

  const imgSrc = dish.image 
    ? dish.image 
    : `https://via.placeholder.com/400x240?text=${encodeURIComponent(dish.name)}`;

  card.innerHTML = `
    <img src="${imgSrc}" alt="${dish.name}">
    <p class="dish-name">${dish.name}</p>
    <p class="dish-weight">${dish.count}</p>
    <p class="dish-price">${dish.price} руб.</p>
    <button type="button">Добавить</button>
  `;

  card.querySelector("button").addEventListener("click", () => selectDish(dish));

  return card;
}

function renderCategory(category, filterKind = null) {
  const grid = sectionsEl[category];
  if (!grid) return;
  grid.innerHTML = "";

  const items = dishes
    .filter(d => d.category === category)
    .filter(d => !filterKind || d.kind === filterKind)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (items.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1; color: #ccc;">Нет блюд по этому фильтру</p>`;
    return;
  }

  items.forEach(d => grid.appendChild(createDishCard(d)));

  const selected = selectedDishes[category];
  if (selected) {
    const selCard = grid.querySelector(`[data-dish="${selected}"]`);
    if (selCard) selCard.style.border = "2px solid tomato";
  }
}

function selectDish(dish) {
  selectedDishes[dish.category] = dish.keyword;
  document.querySelectorAll(`.dish[data-category="${dish.category}"]`).forEach(card => {
    card.style.border = card.dataset.dish === dish.keyword ? "2px solid tomato" : "none";
  });
  saveLocalOrder(selectedDishes);
  updateOrder();
  updateCheckoutPanelUI();
}

function updateOrder() {
  const categories = ["soup", "main", "salad", "drink", "dessert"];
  let total = 0;
  let anySelected = false;

  categories.forEach(cat => {
    const el = document.querySelector(`.order-${cat} span`);
    if (!el) return;
    const selKey = selectedDishes[cat];
    if (selKey) {
      const sel = dishes.find(d => d.keyword === selKey);
      if (sel) {
        el.textContent = `${sel.name} — ${sel.price} руб.`;
        total += Number(sel.price || 0);
        anySelected = true;
      } else {
        el.textContent = 'Блюдо не выбрано';
      }
    } else {
      el.textContent = 'Блюдо не выбрано';
    }
  });

  const totalEl = document.querySelector(".order-total");
  if (totalEl) {
    totalEl.textContent = anySelected ? `Итоговая стоимость: ${total} руб.` : "Ничего не выбрано";
  }

  updateCheckoutPanelUI();
}

function setupFilters() {
  Object.keys(sectionIdToCategory).forEach(secId => {
    const section = document.getElementById(secId);
    if (!section) return;
    const cat = sectionIdToCategory[secId];
    const filterButtons = Array.from(section.querySelectorAll(".filters button[data-kind]"));
    const resetButton = section.querySelector(".filters .reset-filter");

    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const kind = btn.dataset.kind;
        renderCategory(cat, kind);
      });
    });

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        renderCategory(cat, null);
      });
    }
  });
}

function setupForm() {
  const form = document.querySelector("form");
  if (!form) return;
  const alertOverlay = document.getElementById("alert-overlay");
  const alertMessage = document.getElementById("alert-message");
  const alertOk = document.getElementById("alert-ok");

  if (alertOk) {
    alertOk.addEventListener("click", () => alertOverlay.classList.add("hidden"));
  }

  form.addEventListener("submit", (e) => {
    const local = loadLocalOrder();
    const soup = !!local.soup;
    const main = !!local.main;
    const salad = !!local.salad;
    const drink = !!local.drink;
    const dessert = !!local.dessert;

    const combos = [
      { soup: true, main: true, salad: true, drink: true },
      { soup: true, main: true, drink: true },
      { soup: true, salad: true, drink: true },
      { main: true, salad: true, drink: true },
      { main: true, drink: true },
      { dessert: true }
    ];

    const valid = combos.some(combo =>
      (!combo.soup || soup) &&
      (!combo.main || main) &&
      (!combo.salad || salad) &&
      (!combo.drink || drink) &&
      (!combo.dessert || dessert)
    );

    if (!valid) {
      e.preventDefault();
      let message = "";
      if (!soup && !main && !salad && !drink && !dessert) message = "Ничего не выбрано";
      else if (!drink) message = "Выберите напиток";
      else if (!main && !salad) message = "Выберите главное блюдо/салат/стартер";
      else if (!soup && !main) message = "Выберите суп или главное блюдо";
      else if (!main) message = "Выберите главное блюдо";

      alertMessage.textContent = message;
      alertOverlay.classList.remove("hidden");
    }
  });
}

function initCheckoutPanel() {
  let panel = document.getElementById('checkout-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'checkout-panel';
    panel.innerHTML = `
      <div class="checkout-inner">
        <div class="panel-info">
          <div>Текущая стоимость: <span id="panel-total">0</span> руб.</div>
        </div>
        <div class="panel-actions">
          <a id="to-checkout" href="../order_lunch/checkout.html" aria-disabled="true">Перейти к оформлению</a>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
  }
  Object.assign(panel.style, {
    position: 'sticky',
    bottom: '20px',
    left: '0',
    right: '0',
    margin: '0 auto',
    maxWidth: '1000px',
    zIndex: '999',
    display: 'none'
  });
  updateCheckoutPanelUI();
}

function updateCheckoutPanelUI() {
  const panel = document.getElementById('checkout-panel');
  if (!panel) return;
  const totalEl = document.getElementById('panel-total');
  const link = document.getElementById('to-checkout');

  let total = 0;
  let any = false;
  Object.values(selectedDishes).forEach(k => {
    if (k) {
      any = true;
      const d = dishes.find(x => x.keyword === k);
      if (d) total += Number(d.price || 0);
    }
  });

  if (!any) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = '';
  if (totalEl) totalEl.textContent = String(total);

  const combos = [
    { soup: true, main: true, salad: true, drink: true },
    { soup: true, main: true, drink: true },
    { soup: true, salad: true, drink: true },
    { main: true, salad: true, drink: true },
    { main: true, drink: true },
    { dessert: true }
  ];
  const has = {
    soup: !!selectedDishes.soup,
    main: !!selectedDishes.main,
    salad: !!selectedDishes.salad,
    drink: !!selectedDishes.drink,
    dessert: !!selectedDishes.dessert
  };
  const valid = combos.some(combo =>
    (!combo.soup || has.soup) &&
    (!combo.main || has.main) &&
    (!combo.salad || has.salad) &&
    (!combo.drink || has.drink) &&
    (!combo.dessert || has.dessert)
  );

  if (link) {
    if (valid) {
      link.removeAttribute('aria-disabled');
      link.classList.remove('disabled');
    } else {
      link.setAttribute('aria-disabled', 'true');
      link.classList.add('disabled');
    }
  }
}

document.addEventListener("DOMContentLoaded", initApp);