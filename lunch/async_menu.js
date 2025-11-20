let dishes = [];
const selectedDishes = { soup: null, main: null, salad: null, drink: null, dessert: null };

const sectionIdToCategory = {
  "soups": "soup",
  "main-dishes": "main",
  "salads": "salad",
  "drinks": "drink",
  "desserts": "dessert"
};

const sectionsEl = {};

// Загрузка данных
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

// Инициализация приложения
async function initApp() {
  // 1. Загружаем блюда
  dishes = await loadDishes();
  dishes.sort((a, b) => a.name.localeCompare(b.name));

  // 2. Находим контейнеры для категорий
  Object.entries(sectionIdToCategory).forEach(([secId, cat]) => {
    const grid = document.querySelector(`#${secId} .menu-grid`);
    if (!grid) console.warn(`menu-grid не найден для секции "${secId}"`);
    sectionsEl[cat] = grid;
  });

  // 3. Рендерим все категории
  Object.values(sectionIdToCategory).forEach(cat => renderCategory(cat));

  // 4. Настраиваем фильтры и заказ
  setupFilters();
  updateOrder();

  // 5. Настраиваем форму
  setupForm();
}

// Cоздание карточки блюда]
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

// Рендер категории
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
    const selCard = grid.querySelector(`[data-dish="${selected.keyword || selected}"]`);
    if (selCard) selCard.style.border = "2px solid tomato";
  }
}

// Выбор блюда
function selectDish(dish) {
  selectedDishes[dish.category] = dish;
  document.querySelectorAll(`.dish[data-category="${dish.category}"]`).forEach(card => {
    card.style.border = card.dataset.dish === dish.keyword ? "2px solid tomato" : "none";
  });
  updateOrder();
}

// Обновление заказа
function updateOrder() {
  const categories = ["soup", "main", "salad", "drink", "dessert"];
  let total = 0;
  let anySelected = false;

  categories.forEach(cat => {
    const el = document.querySelector(`.order-${cat} span`);
    if (!el) return;
    const sel = selectedDishes[cat];
    if (sel) {
      el.textContent = `${sel.name} — ${sel.price} руб.`;
      total += sel.price;
      anySelected = true;
    } else {
      el.textContent = "Блюдо не выбрано";
    }
  });

  const totalEl = document.querySelector(".order-total");
  if (totalEl) {
    totalEl.textContent = anySelected ? `Итоговая стоимость: ${total} руб.` : "Ничего не выбрано";
  }
}

// Фильтры
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

// Работа с формой
function setupForm() {
  const form = document.querySelector("form");
  const alertOverlay = document.getElementById("alert-overlay");
  const alertMessage = document.getElementById("alert-message");
  const alertOk = document.getElementById("alert-ok");

  if (alertOk) {
    alertOk.addEventListener("click", () => alertOverlay.classList.add("hidden"));
  }

  form.addEventListener("submit", (e) => {
    const soup = document.querySelector(".order-soup span").textContent !== "Блюдо не выбрано";
    const main = document.querySelector(".order-main span").textContent !== "Блюдо не выбрано";
    const salad = document.querySelector(".order-salad span").textContent !== "Блюдо не выбрано";
    const drink = document.querySelector(".order-drink span").textContent !== "Блюдо не выбрано";
    const dessert = document.querySelector(".order-dessert span").textContent !== "Блюдо не выбрано";

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

// Запуск приложения
document.addEventListener("DOMContentLoaded", initApp);