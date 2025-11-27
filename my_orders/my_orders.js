let ordersData = [];
let dishesData = [];
let currentEditId = null;
let currentDeleteId = null;

async function loadDishes() {
    try {
        const response = await fetch("https://691f340fbb52a1db22c0e77c.mockapi.io/api/eatbox/dish");
        dishesData = await response.json();
    } catch (err) {
        console.error("Ошибка загрузки блюд:", err);
        dishesData = [];
    }
}

async function loadOrders() {
    await loadDishes();
    const container = document.getElementById("orders-container");
    container.innerHTML = '<div class="loading">Загрузка...</div>';

    try {
        const response = await fetch("https://691f340fbb52a1db22c0e77c.mockapi.io/api/eatbox/orders");
        ordersData = await response.json();

        if (!ordersData.length) {
            container.innerHTML = '<p>У вас пока нет заказов. Чтобы создать заказ, перейдите на страницу <a href="../lunch/lunch_din.html">Собрать ланч</a>.</p>';
            return;
        }

        ordersData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        container.innerHTML = "";

        ordersData.forEach((order, index) => {
            const item = document.createElement("div");
            item.classList.add("order-item");

            // Краткий состав заказа
            const dishList = ["soupId","mainId","saladId","drinkId","dessertId"]
                .map(k => {
                    const dish = dishesData.find(d => d.id == order[k]);
                    return dish ? dish.name : "-";
                })
                .filter(name => name !== "-")
                .join(", ");

            const createdDate = new Date(order.created_at).toLocaleString();

            item.innerHTML = `
                <div class="order-left">
                    <div class="order-number">#${index + 1}</div>
                    <div class="order-date"><strong>Дата:</strong> ${createdDate}</div>
                    <div class="order-dishes"><strong>Состав:</strong> ${dishList || '-'}</div>
                    <div class="order-address"><strong>Адрес доставки:</strong> ${order.address || '-'}</div>
                </div>
                <div class="order-actions">
                    <button class="btn-action btn-details" data-id="${order.id}" title="Подробнее"><i class="bi bi-eye"></i></button>
                    <button class="btn-action btn-edit" data-id="${order.id}" title="Редактировать"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn-action btn-delete" data-id="${order.id}" title="Удалить"><i class="bi bi-trash"></i></button>
                </div>
            `;
            container.appendChild(item);
        });

        attachOrderButtons();
    } catch(err) {
        container.innerHTML = 'Ошибка загрузки данных';
        console.error(err);
    }
}

function attachOrderButtons() {
    document.querySelectorAll(".btn-details").forEach(btn => btn.addEventListener("click", ()=>openDetailsModal(btn.dataset.id)));
    document.querySelectorAll(".btn-edit").forEach(btn => btn.addEventListener("click", ()=>openEditModal(btn.dataset.id)));
    document.querySelectorAll(".btn-delete").forEach(btn => btn.addEventListener("click", ()=>openDeleteModal(btn.dataset.id)));
}

function openModal(id){ document.getElementById(id).style.display="flex"; }
function closeModal(id){ 
    const modal = document.getElementById(id);
    modal.style.display="none"; 
    if(id==="modalView") document.getElementById("modalViewContent").innerHTML="";
    if(id==="modalEdit") document.getElementById("editForm").innerHTML="";
}

function openDetailsModal(id){
    const order = ordersData.find(o => o.id == id);
    if(!order) return;

    let totalPrice = 0;
    const dishList = ["soupId","mainId","saladId","drinkId","dessertId"]
        .map(k => {
            const dish = dishesData.find(d => d.id == order[k]);
            if(dish) totalPrice += Number(dish.price || 0);
            return dish ? `<p><strong>${dish.category}:</strong> ${dish.name} (${dish.price} ₽)</p>` : '';
        })
        .join("") || "<p>Состав не найден</p>";

    const createdDate = new Date(order.created_at).toLocaleString();

    let deliveryInfo = "Как можно скорее";
    if(order.deliveryOption === "specific" && order.deliveryDate && order.deliveryTime){
        deliveryInfo = `${order.deliveryDate} ${order.deliveryTime}`;
    }

    document.getElementById("modalViewContent").innerHTML = `
        <p><strong>Дата оформления заказа:</strong> ${createdDate}</p>
        <p><strong>Адрес доставки:</strong> ${order.address || '-'}</p>
        <p><strong>Получатель:</strong> ${order.name || '-'}</p>
        <p><strong>Телефон:</strong> ${order.phone || '-'}</p>
        <p><strong>Время доставки:</strong> ${deliveryInfo}</p>
        ${order.comment ? `<p><strong>Комментарий:</strong> ${order.comment}</p>` : ''}
        <hr>
        <h3>Состав заказа:</h3>
        ${dishList}
        <p><strong>Итоговая стоимость:</strong> ${totalPrice} ₽</p>
    `;
    openModal("modalView");
}

function openEditModal(id){
    const order = ordersData.find(o=>o.id==id);
    if(!order) return;

    currentEditId = id;

    let totalPrice = 0;
    const dishList = ["soupId","mainId","saladId","drinkId","dessertId"]
        .map(k => {
            const dish = dishesData.find(d => d.id == order[k]);
            if(dish) totalPrice += Number(dish.price || 0);
            return dish ? `<p><strong>${dish.category}:</strong> ${dish.name} (${dish.price} ₽)</p>` : '';
        })
        .join("") || "<p>Состав не найден</p>";

    const form = document.getElementById("editForm");
    form.innerHTML = `
        <label>Имя получателя:</label>
        <input type="text" name="name" value="${order.name || ''}" required>

        <label>Телефон:</label>
        <input type="tel" name="phone" value="${order.phone || ''}" required>

        <label>Адрес:</label>
        <input type="text" name="address" value="${order.address || ''}" required>

        <label>Комментарий:</label>
        <textarea name="comment" rows="3">${order.comment || ''}</textarea>

        <fieldset>
            <legend>Время доставки</legend>
            <div class="delivery-options-wrapper">
                <label class="delivery-option">
                    <input type="radio" name="deliveryOption" value="asap" checked>
                    Как можно скорее
                </label>
                <label class="delivery-option">
                    <input type="radio" name="deliveryOption" value="specific">
                    К указанному времени
                </label>
            </div>

            <label>Дата:</label>
            <input type="date" name="deliveryDate">
            <label>Время:</label>
            <input type="time" name="deliveryTime" min="07:00" max="23:00">
        </fieldset>

        <hr>
        <h3>Состав заказа:</h3>
        ${dishList}
        <p><strong>Итоговая стоимость:</strong> ${totalPrice} ₽</p>
    `;

    openModal("modalEdit");
}

async function saveEdit(){
    if(!currentEditId) return;
    const form = document.getElementById("editForm");
    const formData = new FormData(form);

    const order = ordersData.find(o=>o.id==currentEditId);
    if(!order) return;

    order.name = formData.get('name');
    order.phone = formData.get('phone');
    order.address = formData.get('address');
    order.comment = formData.get('comment');
    order.deliveryOption = formData.get('deliveryOption');
    order.deliveryDate = formData.get('deliveryDate');
    order.deliveryTime = formData.get('deliveryTime');

    try{
        await fetch(`https://691f340fbb52a1db22c0e77c.mockapi.io/api/eatbox/orders/${currentEditId}`,{
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(order)
        });
        closeModal("modalEdit");
        currentEditId = null;
        loadOrders();
    }catch(err){
        alert("Ошибка сохранения заказа");
        console.error(err);
    }
}

function openDeleteModal(id){ 
    currentDeleteId=id; 
    openModal("modalDelete"); 
}

async function confirmDelete(){
    try{
        await fetch(`https://691f340fbb52a1db22c0e77c.mockapi.io/api/eatbox/orders/${currentDeleteId}`,{
            method:'DELETE'
        });
        currentDeleteId = null;
        closeModal("modalDelete");
        loadOrders();
    }catch(err){
        alert("Ошибка удаления заказа");
        console.error(err);
    }
}

document.addEventListener("DOMContentLoaded", loadOrders);