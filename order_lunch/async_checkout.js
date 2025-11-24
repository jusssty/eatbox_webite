const API_URL = 'https://691f340fbb52a1db22c0e77c.mockapi.io/api/eatbox/dish';
const ORDER_KEY = 'eatbox_order';

function loadLocalOrder() {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Ошибка чтения localStorage', e);
    return {};
  }
}

function saveLocalOrder(obj) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(obj));
}

async function fetchDishes() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.error('Ошибка загрузки блюд', err);
    return [];
  }
}

function createDishCard(dish) {
  const card = document.createElement('div');
  card.className = 'dish';
  card.dataset.dish = dish.keyword;
  card.innerHTML = `
    <img src="../lunch/${dish.image}" alt="${dish.name}">
    <p class="dish-name">${dish.name}</p>
    <p class="dish-weight">${dish.count}</p>
    <p class="dish-price">${dish.price} руб.</p>
    <button type="button" class="remove-btn">Удалить</button>
  `;
  card.querySelector('.remove-btn').addEventListener('click', () => removeFromOrder(dish));
  return card;
}

function renderEmptyMessage(show) {
  const msg = document.getElementById('empty-message');
  if (!msg) return;
  msg.style.display = show ? '' : 'none';
}

function updateSummaryList(selected, allDishes) {
  const container = document.getElementById('summary-list');
  container.innerHTML = '';
  const categories = ['soup','main','salad','drink','dessert'];
  let total = 0;
  let any = false;

  categories.forEach(cat => {
    const selKey = selected[cat];
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.marginBottom = '8px';

    const nameSpan = document.createElement('span');
    nameSpan.style.flex = '1';

    const priceSpan = document.createElement('span');

    if (selKey) {
      const dish = allDishes.find(d => d.keyword === selKey);
      if (dish) {
        nameSpan.textContent = dish.name;
        priceSpan.textContent = `${dish.price} руб.`;
        total += Number(dish.price || 0);
        any = true;
      } else {
        nameSpan.textContent = 'Не выбран';
        priceSpan.textContent = '';
      }
    } else {
      nameSpan.textContent = (cat === 'main') ? 'Не выбрано' : 'Не выбран';
      priceSpan.textContent = '';
    }

    row.appendChild(nameSpan);
    row.appendChild(priceSpan);
    container.appendChild(row);
  });

  const totalEl = document.querySelector('.order-total');
  totalEl.textContent = any ? `Итоговая стоимость: ${total} руб.` : 'Ничего не выбрано';
}

async function initCheckout() {
  const selected = loadLocalOrder();
  const dishes = await fetchDishes();
  const grid = document.getElementById('basket-grid');
  grid.innerHTML = '';

  const selectedKeywords = Object.values(selected).filter(Boolean);

  if (!selectedKeywords.length) {
    renderEmptyMessage(true);
  } else {
    renderEmptyMessage(false);
    selectedKeywords.forEach(k => {
      const dish = dishes.find(d => d.keyword === k);
      if (dish) grid.appendChild(createDishCard(dish));
    });
  }

  updateSummaryList(selected, dishes);

  const form = document.getElementById('checkout-form');
  const alertOverlay = document.getElementById('alert-overlay');
  const alertMessage = document.getElementById('alert-message');
  const alertOk = document.getElementById('alert-ok');
  if (alertOk) alertOk.addEventListener('click', () => alertOverlay.classList.add('hidden'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const combos = [
      { soup: true, main: true, salad: true, drink: true },
      { soup: true, main: true, drink: true },
      { soup: true, salad: true, drink: true },
      { main: true, salad: true, drink: true },
      { main: true, drink: true },
      { dessert: true }
    ];

    const has = {
      soup: !!selected.soup,
      main: !!selected.main,
      salad: !!selected.salad,
      drink: !!selected.drink,
      dessert: !!selected.dessert
    };

    const valid = combos.some(combo =>
      (!combo.soup || has.soup) &&
      (!combo.main || has.main) &&
      (!combo.salad || has.salad) &&
      (!combo.drink || has.drink) &&
      (!combo.dessert || has.dessert)
    );

    if (!valid) {
      alertMessage.textContent = 'Состав заказа не соответствует доступным комбо';
      alertOverlay.classList.remove('hidden');
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      deliveryOption: formData.get('delivery-option'),
      deliveryDate: formData.get('delivery-date'),
      deliveryTime: formData.get('delivery-time'),
      items: Object.values(selected).filter(Boolean),
    };

    let total = 0;
    payload.items.forEach(k => {
      const d = dishes.find(x => x.keyword === k);
      if (d) total += Number(d.price || 0);
    });
    payload.total = total;

    try {
    	const resp = await fetch('https://httpbin.org/post', {
        	method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: JSON.stringify(payload)
      })
      if (!resp.ok) throw new Error('server '+resp.status);
      localStorage.removeItem(ORDER_KEY);
      alertMessage.textContent = 'Заказ успешно отправлен!';
      alertOverlay.classList.remove('hidden');

      grid.innerHTML = '';
      renderEmptyMessage(true);
      updateSummaryList({}, dishes);

    } catch (err) {
      console.error('Ошибка отправки заказа', err);
      alertMessage.textContent = 'Ошибка отправки заказа. Попробуйте ещё раз.';
      alertOverlay.classList.remove('hidden');
    }
  });
}

function removeFromOrder(dish) {
  const order = loadLocalOrder();
  Object.keys(order).forEach(k => {
    if (order[k] === dish.keyword) order[k] = null;
  });
  saveLocalOrder(order);

  const grid = document.getElementById('basket-grid');
  const card = grid.querySelector(`[data-dish="${dish.keyword}"]`);
  if (card) card.remove();

  fetchDishes().then(dishes => updateSummaryList(order, dishes));

  const nonEmpty = Object.values(order).some(Boolean);
  renderEmptyMessage(!nonEmpty);
}

window.addEventListener('DOMContentLoaded', initCheckout);

