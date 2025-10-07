const dishes = [
  { keyword: "tom_yam", name: "Tom Yam and Jerry", price: 350, category: "soup", count: "250 мл", image: "tom.jpg" },
  { keyword: "borsh", name: "B-b-borsh", price: 290, category: "soup", count: "300 мл", image: "borsh.jpg" },
  { keyword: "edm_chicken", name: "EDM chicken soup", price: 250, category: "soup", count: "300 мл", image: "soup.jpg" },

  { keyword: "big_boom_burger", name: "Big Boom Burger", price: 350, category: "main", count: "350 гр.", image: "burger.jpg" },
  { keyword: "kick_fries", name: "Kick Fries", price: 280, category: "main", count: "280 гр.", image: "fries.jpg" },
  { keyword: "snare_chicken", name: "Snare Chicken", price: 490, category: "main", count: "490 гр.", image: "chicken.jpg" },
  { keyword: "scratch_sticks", name: "Scratch Sticks", price: 320, category: "main", count: "320 гр.", image: "sticks.jpg" },
  { keyword: "drop_donut", name: "Drop Donut", price: 250, category: "main", count: "1 шт.", image: "donut.jpg" },

  { keyword: "lemonade", name: "Лимонад", price: 150, category: "drink", count: "300 мл", image: "lemonade.jpg" },
  { keyword: "coffee", name: "Капучино", price: 180, category: "drink", count: "250 мл", image: "coffee.jpg" },
  { keyword: "tea", name: "Чай", price: 130, category: "drink", count: "250 мл", image: "tea.jpg" }
];

dishes.sort((a, b) => a.name.localeCompare(b.name));

const sections = {
  soup: document.querySelector("#soups .menu-grid"),
  main: document.querySelector("#main-dishes .menu-grid"),
  drink: document.querySelector("#drinks .menu-grid")
};

const orderDisplay = {
  soup: document.querySelector(".order-soup span"),
  main: document.querySelector(".order-main span"),
  drink: document.querySelector(".order-drink span"),
  total: document.querySelector(".order-total")
};

const selectedDishes = {
  soup: null,
  main: null,
  drink: null
};

function updateCardSelection(category) {
  document.querySelectorAll(`.dish[data-dish]`).forEach(card => {
    const keyword = card.getAttribute("data-dish");
    if (selectedDishes[category] === keyword) {
      card.style.border = "2px solid tomato";
    } else if (card.classList.contains("dish")) {
      card.style.border = "none";
    }
  });
}

function updateOrderDisplay() {
  orderDisplay.soup.textContent = selectedDishes.soup
    ? dishes.find(d => d.keyword === selectedDishes.soup).name
    : "Блюдо не выбрано";

  orderDisplay.main.textContent = selectedDishes.main
    ? dishes.find(d => d.keyword === selectedDishes.main).name
    : "Блюдо не выбрано";

  orderDisplay.drink.textContent = selectedDishes.drink
    ? dishes.find(d => d.keyword === selectedDishes.drink).name
    : "Напиток не выбран";

  let total = 0;
  Object.keys(selectedDishes).forEach(cat => {
    if (selectedDishes[cat]) {
      const dish = dishes.find(d => d.keyword === selectedDishes[cat]);
      total += dish.price;
    }
  });
  orderDisplay.total.textContent = `Итоговая стоимость: ${total} руб.`;
}

dishes.forEach(dish => {
  const card = document.createElement("div");
  card.className = "dish";
  card.setAttribute("data-dish", dish.keyword);
  card.innerHTML = `
    <img src="${dish.image}" alt="${dish.name}">
    <p class="dish-name">${dish.name}</p>
    <p class="dish-weight">${dish.count}</p>
    <p class="dish-price">${dish.price} руб.</p>
    <button>Добавить</button>
  `;

  sections[dish.category].appendChild(card);

  const btn = card.querySelector("button");
  btn.addEventListener("click", () => {
    selectedDishes[dish.category] = dish.keyword;
    updateCardSelection(dish.category);
    updateOrderDisplay();
  });
});

updateOrderDisplay();