let products = JSON.parse(localStorage.getItem("myProducts")) || [];
let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let cart = [];
let selectedOrders = new Set();
let editingOrderId = null;

function showSection(section) {
    document.getElementById("catalog-section").classList.toggle("hidden", section !== "catalog");
    document.getElementById("history-section").classList.toggle("hidden", section !== "history");
    document.getElementById("nav-catalog").className = section === 'catalog' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    document.getElementById("nav-history").className = section === 'history' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    if (section === "history") { selectedOrders.clear(); renderHistory(); }
    if (section === "catalog") { renderCatalog(); }
}

function updateCartItem(id, delta) {
    const productId = String(id).trim();
    let item = cart.find(i => String(i.id).trim() === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => String(i.id).trim() !== productId);
    } else if (delta > 0) {
        const p = products.find(x => String(x.id).trim() === productId);
        if (p) cart.push({ ...p, qty: delta });
    }
    refreshUI();
}

function setManualQty(id) {
    const val = prompt("Մուտքագրեք քանակը:");
    if (val === null) return;
    const qty = parseInt(val);
    const productId = String(id).trim();
    if (isNaN(qty) || qty <= 0) {
        cart = cart.filter(i => String(i.id).trim() !== productId);
    } else {
        let item = cart.find(i => String(i.id).trim() === productId);
        if (item) item.qty = qty;
        else {
            const p = products.find(x => String(x.id).trim() === productId);
            if (p) cart.push({ ...p, qty: qty });
        }
    }
    refreshUI();
}

function refreshUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cart-count").innerText = count;
    document.getElementById("cart-btn").classList.toggle("hidden", cart.length === 0 && !editingOrderId);
    renderCatalog();
    if (!document.getElementById("cart-modal").classList.contains("hidden")) showCart();
}

function renderCatalog() {
    const list = document.getElementById("product-list");
    if (!list) return;
    list.innerHTML = products.map(p => {
        const cartItem = cart.find(item => String(item.id).trim() === String(p.id).trim());
        const qty = cartItem ? cartItem.qty : 0;
        return `
            <div class="bg-white p-2 rounded-2xl shadow-sm border relative">
                <img src="${p.img}" class="w-full h-32 object-cover rounded-xl mb-2">
                <div class="font-bold text-[11px] px-1 h-8 overflow-hidden">${p.name}</div>
                <div class="text-blue-600 font-bold text-sm px-1 mb-2">${p.price.toLocaleString()} ֏</div>
                <div class="flex items-center gap-1">
                    <button onclick="updateCartItem('${p.id}', -1)" class="w-8 h-8 bg-gray-100 rounded-lg font-bold text-lg">-</button>
                    <div onclick="setManualQty('${p.id}')" class="flex-1 text-center font-bold text-xs cursor-pointer bg-blue-50 py-2 rounded-lg text-blue-700">${qty} հատ</div>
                    <button onclick="updateCartItem('${p.id}', 1)" class="w-8 h-8 bg-gray-100 rounded-lg font-bold text-lg">+</button>
                </div>
            </div>`;
    }).join("");
}

function showCart() {
    document.getElementById("cart-modal").classList.remove("hidden");
    const container = document.getElementById("cart-items");
    const btnText = document.getElementById("checkout-btn-text");
    btnText.innerText = editingOrderId ? "ՊԱՀՊԱՆԵԼ ՓՈՓՈԽՈՒԹՅՈՒՆՆԵՐԸ" : "ՊԱՏՎԻՐԵԼ";

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `
            <div class="flex justify-between items-center border-b py-2">
                <div class="flex items-center gap-2">
                    <img src="${item.img}" class="w-8 h-8 object-cover rounded">
                    <span class="text-xs font-bold">${item.name} (x${item.qty})</span>
                </div>
                <b class="text-xs text-blue-600">${(item.price * item.qty).toLocaleString()} ֏</b>
            </div>`;
    }).join("");
    document.getElementById("cart-total-price").innerText = total.toLocaleString() + " ֏";
}

function checkout() {
    if (cart.length === 0) return;
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);

    if (editingOrderId) {
        const idx = history.findIndex(h => String(h.id) === String(editingOrderId));
        if (idx !== -1) {
            history[idx].items = JSON.parse(JSON.stringify(cart));
            history[idx].total = total;
            history[idx].date = new Date().toLocaleString("hy-AM") + " (խմբ.)";
            localStorage.setItem("orderHistory", JSON.stringify(history));
            editingOrderId = null; cart = []; refreshUI(); closeCart(); showSection('history');
        }
    } else {
        const user = prompt("Պատվիրատուի անունը:");
        if (!user) return;
        history.unshift({ id: Date.now(), customer: user, items: [...cart], total, date: new Date().toLocaleString("hy-AM") });
        localStorage.setItem("orderHistory", JSON.stringify(history));
        cart = []; refreshUI(); closeCart(); showSection('history');
    }
}

function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = history.map(h => `
        <div class="flex items-center gap-2 mb-2">
            <input type="checkbox" onchange="toggleSelect('${h.id}')" ${selectedOrders.has(String(h.id)) ? 'checked' : ''} class="w-5 h-5 rounded border-gray-300">
            <div class="flex-1 bg-white p-4 rounded-xl border flex justify-between items-center active:scale-95 transition-transform" onclick="openOrderDetails('${h.id}')">
                <div><div class="font-bold text-sm">${h.customer}</div><div class="text-[10px] text-gray-400">${h.date}</div></div>
                <div class="font-bold text-blue-600 text-sm">${h.total.toLocaleString()} ֏</div>
            </div>
        </div>`).join("");
    const delBtn = document.getElementById("delete-selected-btn");
    delBtn.classList.toggle("hidden", selectedOrders.size === 0);
    delBtn.innerText = `Ջնջել (${selectedOrders.size})`;
}

function toggleSelect(id) {
    const sId = String(id);
    if (selectedOrders.has(sId)) selectedOrders.delete(sId); else selectedOrders.add(sId);
    renderHistory();
}

function toggleSelectAll() {
    if (selectedOrders.size === history.length) selectedOrders.clear();
    else history.forEach(h => selectedOrders.add(String(h.id)));
    renderHistory();
}

function deleteSelected() {
    if (confirm("Ջնջե՞լ ընտրված պատվերները")) {
        history = history.filter(h => !selectedOrders.has(String(h.id)));
        localStorage.setItem("orderHistory", JSON.stringify(history));
        selectedOrders.clear();
        renderHistory();
    }
}

function openOrderDetails(id) {
    const order = history.find(h => String(h.id) === String(id));
    if (!order) return;
    document.getElementById("order-details-content").innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-black text-lg">${order.customer}</h2>
            <button onclick="editOrder('${order.id}')" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold">ԽՄԲԱԳՐԵԼ</button>
        </div>` + 
        order.items.map(i => `
            <div class="flex gap-2 mb-2 items-center border-b pb-2">
                <img src="${i.img}" class="w-10 h-10 object-cover rounded shadow-sm">
                <div class="flex flex-col"><span class="text-xs font-bold">${i.name}</span><span class="text-[10px] text-gray-500">${i.qty} հատ</span></div>
            </div>`).join("") +
        `<div class="mt-4 font-black text-blue-600 text-right">Ընդհանուր: ${order.total.toLocaleString()} ֏</div>`;
    document.getElementById("order-details-modal").classList.remove("hidden");
}

function editOrder(id) {
    const order = history.find(h => String(h.id) === String(id));
    if (!order) return;
    cart = JSON.parse(JSON.stringify(order.items));
    editingOrderId = id;
    closeOrderDetails();
    refreshUI();
    showSection('catalog');
}

function closeCart() { document.getElementById("cart-modal").classList.add("hidden"); }
function closeOrderDetails() { document.getElementById("order-details-modal").classList.add("hidden"); }

renderCatalog();
