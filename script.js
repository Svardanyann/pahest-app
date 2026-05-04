let products = JSON.parse(localStorage.getItem("myProducts")) || [];
let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let cart = [];
let selectedOrders = new Set();
let editingOrderId = null;

// 1. ՍԵԿՑԻԱՆԵՐԻ ՑՈՒՑԱԴՐՈՒՄ
function showSection(section) {
    document.getElementById("catalog-section").classList.toggle("hidden", section !== "catalog");
    document.getElementById("history-section").classList.toggle("hidden", section !== "history");
    
    document.getElementById("nav-catalog").className = section === 'catalog' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    document.getElementById("nav-history").className = section === 'history' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    
    if (section === "history") {
        selectedOrders.clear();
        renderHistory();
    }
    if (section === "catalog") {
        renderCatalog();
    }
}

// 2. ԶԱՄԲՅՈՒՂԻ ԿԱՌԱՎԱՐՈՒՄ ԵՎ ՔԱՆԱԿԻ ՄՈՒՏՔԱԳՐՈՒՄ
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

// ՆՈՐ: Քանակը ձեռքով գրելու ֆունկցիա
function setManualQty(id) {
    const val = prompt("Մուտքագրեք քանակը:");
    if (val === null) return;
    const qty = parseInt(val);
    
    const productId = String(id).trim();
    if (isNaN(qty) || qty <= 0) {
        cart = cart.filter(i => String(i.id).trim() !== productId);
    } else {
        let item = cart.find(i => String(i.id).trim() === productId);
        if (item) {
            item.qty = qty;
        } else {
            const p = products.find(x => String(x.id).trim() === productId);
            if (p) cart.push({ ...p, qty: qty });
        }
    }
    refreshUI();
}

function refreshUI() {
    updateCartUI();
    renderCatalog();
    if (!document.getElementById("cart-modal").classList.contains("hidden")) showCart();
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cart-count").innerText = count;
    const cartBtn = document.getElementById("cart-btn");
    cartBtn.classList.toggle("hidden", editingOrderId || cart.length === 0);
}

// 3. ԿԱՏԱԼՈԳԻ ՌԵՆԴԵՐ (ՄԻԱՅՆ +- ԵՎ ՁԵՌՔՈՎ ՄՈՒՏՔ)
function renderCatalog() {
    const list = document.getElementById("product-list");
    if (!list) return;

    list.innerHTML = products.map(p => {
        const cartItem = cart.find(item => String(item.id).trim() === String(p.id).trim());
        const qty = cartItem ? cartItem.qty : 0;

        return `
            <div class="bg-white p-2 rounded-2xl shadow-sm border relative">
                <button onclick="prepareEditProduct('${p.id}')" class="absolute top-1 right-1 bg-white/90 w-7 h-7 rounded-full text-xs z-10 shadow-sm flex items-center justify-center">✏️</button>
                <img src="${p.img}" class="w-full h-32 object-cover rounded-xl mb-2 pointer-events-none">
                <div class="font-bold text-[11px] h-8 overflow-hidden px-1">${p.name}</div>
                <div class="text-blue-600 font-bold text-sm px-1 mb-2">${p.price.toLocaleString()} ֏</div>
                
                <div class="flex items-center gap-1">
                    <button onclick="updateCartItem('${p.id}', -1)" class="w-10 h-10 bg-gray-100 text-gray-800 rounded-xl font-bold active:bg-gray-200">-</button>
                    <div onclick="setManualQty('${p.id}')" class="flex-1 bg-blue-50 text-blue-700 h-10 flex items-center justify-center rounded-xl font-black text-xs cursor-pointer active:scale-95">
                        ${qty} հատ
                    </div>
                    <button onclick="updateCartItem('${p.id}', 1)" class="w-10 h-10 bg-gray-100 text-gray-800 rounded-xl font-bold active:bg-gray-200">+</button>
                </div>
            </div>
        `;
    }).join("");
}

// 4. ԶԱՄԲՅՈՒՂԻ ԵՎ ՊԱՏՎԵՐԻ ՏՐԱՄԱԲԱՆՈՒԹՅՈՒՆ
function showCart() {
    document.getElementById("cart-modal").classList.remove("hidden");
    const container = document.getElementById("cart-items");
    const checkoutBtnText = document.getElementById("checkout-btn-text");
    if (checkoutBtnText) checkoutBtnText.innerText = editingOrderId ? "ՊԱՀՊԱՆԵԼ ՓՈՓՈԽՈՒԹՅՈՒՆՆԵՐԸ" : "ՊԱՏՎԻՐԵԼ";

    let total = 0;
    container.innerHTML = cart.map((item) => {
        total += item.price * item.qty;
        return `
            <div class="flex justify-between items-center bg-gray-50 p-2 rounded-xl border mb-2 px-2">
                <div class="flex items-center gap-2">
                    <img src="${item.img}" class="w-8 h-8 object-cover rounded">
                    <div class="flex flex-col text-[10px]">
                        <span class="font-bold">${item.name}</span>
                        <span>${item.price.toLocaleString()} x ${item.qty}</span>
                    </div>
                </div>
                <button onclick="updateCartItem('${item.id}', -${item.qty})" class="text-red-500 text-xs">✕</button>
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
            history[idx].items = [...cart];
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

// 5. ՊԱՏՄՈՒԹՅԱՆ ՌԵՆԴԵՐ (ԱՌԱՆՑ ՊԱՏՎԻՐԵԼՈՒ ԿՈՃԱԿԻ)
function renderHistory() {
    const list = document.getElementById("history-list");
    const deleteBtn = document.getElementById("delete-selected-btn");
    if (history.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-gray-400 italic">Պատմությունը դատարկ է</div>';
        if (deleteBtn) deleteBtn.classList.add("hidden");
        return;
    }
    if (deleteBtn) {
        deleteBtn.classList.toggle("hidden", selectedOrders.size === 0);
        deleteBtn.innerText = `Ջնջել (${selectedOrders.size})`;
    }
    list.innerHTML = history.map(h => `
        <div class="flex items-center gap-3 mb-2">
            <input type="checkbox" onchange="toggleSelect('${h.id}')" ${selectedOrders.has(String(h.id)) ? 'checked' : ''} class="w-5 h-5">
            <div onclick="openOrderDetails('${h.id}')" class="flex-1 bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center active:scale-95 transition-transform">
                <div class="flex flex-col">
                    <span class="font-black text-gray-800">${h.customer}</span>
                    <span class="text-[10px] text-gray-400">${h.date}</span>
                </div>
                <span class="font-bold text-blue-600">${h.total.toLocaleString()} ֏</span>
            </div>
        </div>
    `).join("");
}

// ՕԳՆՈՂ ՖՈՒՆԿՑԻԱՆԵՐ
function toggleSelect(id) {
    const sId = String(id);
    if (selectedOrders.has(sId)) selectedOrders.delete(sId); else selectedOrders.add(sId);
    renderHistory();
}

function openOrderDetails(id) {
    const order = history.find(h => String(h.id) === String(id));
    if (!order) return;
    document.getElementById("order-details-content").innerHTML = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-black">${order.customer}</h2>
            <button onclick="editOrder('${order.id}')" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Խմբագրել</button>
        </div>
        <div class="space-y-3">
            ${order.items.map(i => `<div class="flex justify-between text-sm border-b pb-2"><span>${i.name} (x${i.qty})</span><b>${(i.price * i.qty).toLocaleString()} ֏</b></div>`).join("")}
        </div>
        <div class="mt-4 text-right font-black text-blue-600">Ընդհանուր: ${order.total.toLocaleString()} ֏</div>
    `;
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

function prepareEditProduct(id) { console.log("Edit product:", id); }
function closeCart() { document.getElementById("cart-modal").classList.add("hidden"); }
function closeOrderDetails() { document.getElementById("order-details-modal").classList.add("hidden"); }

renderCatalog();
