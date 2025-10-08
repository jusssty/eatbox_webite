const dishes = [
  { keyword: "borsh", name: "B-b-borsh", price: 290, category: "soup", count: "300 мл", image: "borsh.jpg", kind: "meat" },
  { keyword: "edm_chicken_soup", name: "EDM Chicken Soup", price: 250, category: "soup", count: "300 мл", image: "soup.jpg", kind: "meat" },
  { keyword: "tom_yam", name: "Tom Yam and Jerry", price: 350, category: "soup", count: "250 мл", image: "tom.jpg", kind: "fish" },
  { keyword: "bass_gazpacho", name: "Bass Gazpacho", price: 270, category: "soup", count: "300 мл", image: "gazpacho.jpg", kind: "veg" },
  { keyword: "drum_soup", name: "Drum Fish Soup", price: 330, category: "soup", count: "300 мл", image: "drum_soup.jpg", kind: "fish" },
  { keyword: "beat_veggie", name: "Beat Veggie Soup", price: 240, category: "soup", count: "300 мл", image: "veggie.jpg", kind: "veg" },
  { keyword: "boom_burger", name: "Big Boom Burger", price: 350, category: "main", count: "350 г", image: "burger.jpg", kind: "meat" },
  { keyword: "kick_fries", name: "Kick Fries", price: 280, category: "main", count: "280 г", image: "fries.jpg", kind: "veg" },
  { keyword: "snare_chicken", name: "Snare Chicken", price: 490, category: "main", count: "490 г", image: "chicken.jpg", kind: "meat" },
  { keyword: "scratch_sticks", name: "Scratch Sticks", price: 320, category: "main", count: "320 г", image: "sticks.jpg", kind: "veg" },
  { keyword: "bass_salmon", name: "Bass Salmon", price: 480, category: "main", count: "350 г", image: "salmon.jpg", kind: "fish" },
  { keyword: "vegan_groove", name: "Vegan Groove Bowl", price: 300, category: "main", count: "300 г", image: "bowl.jpg", kind: "veg" },
  { keyword: "drop_caesar", name: "Drop Caesar", price: 290, category: "salad", count: "200 г", image: "caesar.jpg", kind: "meat" },
  { keyword: "beat_caprese", name: "Beat Caprese", price: 260, category: "salad", count: "200 г", image: "caprese.jpg", kind: "veg" },
  { keyword: "snare_sea", name: "Snare Seafood", price: 340, category: "salad", count: "200 г", image: "seafood.jpg", kind: "fish" },
  { keyword: "green_rhythm", name: "Green Rhythm", price: 240, category: "salad", count: "200 г", image: "green.jpg", kind: "veg" },
  { keyword: "hummus_drop", name: "Hummus Drop", price: 270, category: "salad", count: "180 г", image: "hummus.jpg", kind: "veg" },
  { keyword: "fresh_vibe", name: "Fresh Vibe", price: 230, category: "salad", count: "200 г", image: "fresh.jpg", kind: "veg" },
  { keyword: "lemonade_mix", name: "Lemonade Mix", price: 150, category: "drink", count: "300 мл", image: "lemonade.jpg", kind: "cold" },
  { keyword: "drop_cola", name: "Drop Cola", price: 130, category: "drink", count: "330 мл", image: "cola.jpg", kind: "cold" },
  { keyword: "juice_wave", name: "Juice Wave", price: 140, category: "drink", count: "250 мл", image: "juice.jpg", kind: "cold" },
  { keyword: "coffee_groove", name: "Coffee Groove", price: 180, category: "drink", count: "250 мл", image: "coffee.jpg", kind: "hot" },
  { keyword: "tea_scratch", name: "Tea Scratch", price: 130, category: "drink", count: "250 мл", image: "tea.jpg", kind: "hot" },
  { keyword: "cocoa_drop", name: "Cocoa Drop", price: 160, category: "drink", count: "250 мл", image: "cocoa.jpg", kind: "hot" },
  { keyword: "donut_drop", name: "Drop Donut", price: 250, category: "dessert", count: "1 шт.", image: "donut.jpg", kind: "small" },
  { keyword: "beat_cupcake", name: "Beat Cupcake", price: 150, category: "dessert", count: "1 шт.", image: "cupcake.jpg", kind: "small" },
  { keyword: "snare_cheesecake", name: "Snare Cheesecake", price: 270, category: "dessert", count: "150 г", image: "cheesecake.jpg", kind: "medium" },
  { keyword: "bass_tiramisu", name: "Bass Tiramisu", price: 260, category: "dessert", count: "150 г", image: "tiramisu.jpg", kind: "medium" },
  { keyword: "boom_cake", name: "Boom Cake", price: 400, category: "dessert", count: "250 г", image: "cake.jpg", kind: "large" },
  { keyword: "muffin_kick", name: "Muffin Kick", price: 140, category: "dessert", count: "1 шт.", image: "muffin.jpg", kind: "small" }
];

dishes.sort((a, b) => a.name.localeCompare(b.name));

const selectedDishes = { soup: null, main: null, salad: null, drink: null, dessert: null };

const sectionIdToCategory = {
  "soups": "soup",
  "main-dishes": "main",
  "salads": "salad",
  "drinks": "drink",
  "desserts": "dessert"
};

const sectionsEl = {};
document.addEventListener("DOMContentLoaded", () => {
  Object.entries(sectionIdToCategory).forEach(([secId, cat]) => {
    const grid = document.querySelector(`#${secId} .menu-grid`);
    if (!grid) {
      console.warn(`menu-grid not found for section id "${secId}". Expected container: #${secId} .menu-grid`);
    }
    sectionsEl[cat] = grid;
  });
  Object.values(sectionIdToCategory).forEach(cat => renderCategory(cat));
  setupFilters();
  updateOrder();
});

function createDishCard(dish) {
  const card = document.createElement("div");
  card.className = "dish";
  card.dataset.dish = dish.keyword;
  card.dataset.kind = dish.kind;
  card.dataset.category = dish.category;
  const imgSrc = dish.image ? dish.image : `https://via.placeholder.com/400x240?text=${encodeURIComponent(dish.name)}`;
  card.innerHTML = `
    <img src="${imgSrc}" alt="${dish.name}">
    <p class="dish-name">${dish.name}</p>
    <p class="dish-weight">${dish.count}</p>
    <p class="dish-price">${dish.price} руб.</p>
    <button type="button">Добавить</button>
  `;
  const btn = card.querySelector("button");
  btn.addEventListener("click", () => {
    selectDish(dish);
  });
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
    const selCard = grid.querySelector(`[data-dish="${selected.keyword || selected}"]`);
    if (selCard) selCard.style.border = "2px solid tomato";
  }
}

function selectDish(dish) {
  selectedDishes[dish.category] = dish;
  document.querySelectorAll(`.dish[data-category="${dish.category}"]`).forEach(card => {
    if (card.dataset.dish === dish.keyword) card.style.border = "2px solid tomato";
    else card.style.border = "none";
  });
  updateOrder();
}

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