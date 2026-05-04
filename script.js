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
                <div class="font-bold text-[11px] px-1">${p.name}</div>
                <div class="text-blue-600 font-bold text-sm px-1 mb-2">${p.price.toLocaleString()} ֏</div>
                <div class="flex items-center gap-1">
                    <button onclick="updateCartItem('${p.id}', -1)" class="w-8 h-8 bg-gray-100 rounded-lg">-</button>
                    <div onclick="setManualQty('${p.id}')" class="flex-1 text-center font-bold text-xs cursor-pointer">${qty}</div>
                    <button onclick="updateCartItem('${p.id}', 1)" class="w-8 h-8 bg-gray-100 rounded-lg">+</button>
                </div>
            </div>`;
    }).join("");
}

function showCart() {
    document.getElementById("cart-modal").classList.remove("hidden");
    const container = document.getElementById("cart-items");
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `<div class="flex justify-between border-b py-2 text-xs"><span>${item.name} x${item.qty}</span><b>${(item.price * item.qty).toLocaleString()} ֏</b></div>`;
    }).join("");
    document.getElementById("cart-total-price").innerText = total.toLocaleString() + " ֏";
}

function checkout() {
    if (cart.length === 0) return;
    const user = prompt("Պատվիրատուի անունը:");
    if (!user) return;
    history.unshift({ id: Date.now(), customer: user, items: [...cart], total: cart.reduce((s, i) => s + (i.price * i.qty), 0), date: new Date().toLocaleString("hy-AM") });
    localStorage.setItem("orderHistory", JSON.stringify(history));
    cart = []; editingOrderId = null; refreshUI(); closeCart(); showSection('history');
}

function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = history.map(h => `
        <div class="bg-white p-4 rounded-xl border mb-2 flex justify-between items-center" onclick="openOrderDetails('${h.id}')">
            <div><div class="font-bold">${h.customer}</div><div class="text-[10px] text-gray-400">${h.date}</div></div>
            <div class="font-bold text-blue-600">${h.total.toLocaleString()} ֏</div>
        </div>`).join("");
}

function openOrderDetails(id) {
    const order = history.find(h => String(h.id) === String(id));
    if (!order) return;
    document.getElementById("order-details-content").innerHTML = `<h2 class="font-black mb-4">${order.customer}</h2>` + 
        order.items.map(i => `<div class="flex gap-2 mb-2"><img src="${i.img}" class="w-8 h-8 object-cover rounded"><span>${i.name} (x${i.qty})</span></div>`).join("") +
        `<div class="mt-4 font-bold text-blue-600">Ընդհանուր: ${order.total.toLocaleString()} ֏</div>`;
    document.getElementById("order-details-modal").classList.remove("hidden");
}

function closeCart() { document.getElementById("cart-modal").classList.add("hidden"); }
function closeOrderDetails() { document.getElementById("order-details-modal").classList.add("hidden"); }
renderCatalog();
