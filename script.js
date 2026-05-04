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
    
    if (section === "history") {
        selectedOrders.clear();
        renderHistory();
    }
    if (section === "catalog") {
        renderCatalog();
    }
}

function closeModal() { document.getElementById("modal").classList.add("hidden"); }
function closeCart() { document.getElementById("cart-modal").classList.add("hidden"); }
function closeOrderDetails() { document.getElementById("order-details-modal").classList.add("hidden"); }

// --- ԶԱՄԲՅՈՒՂԻ ՏՐԱՄԱԲԱՆՈՒԹՅՈՒՆ ---

function updateCartItem(id, delta) {
    const productId = String(id).trim();
    const existingItem = cart.find(item => String(item.id).trim() === productId);

    if (existingItem) {
        existingItem.qty += delta;
        if (existingItem.qty <= 0) {
            cart = cart.filter(item => String(item.id).trim() !== productId);
        }
    } else if (delta > 0) {
        const p = products.find(x => String(x.id).trim() === productId);
        if (p) cart.push({ ...p, qty: 1 });
    }
    
    updateCartUI();
    renderCatalog(); // Թարմացնում ենք +/- կոճակները կատալոգում
    if (!document.getElementById("cart-modal").classList.contains("hidden")) showCart();
}

function updateCartUI() {
    document.getElementById("cart-count").innerText = cart.length;
    document.getElementById("cart-btn").classList.toggle("hidden", cart.length === 0);
}

// --- ԿԱՏԱԼՈԳԻ ՌԵՆԴԵՐ ---

function renderCatalog() {
    const list = document.getElementById("product-list");
    list.innerHTML = products.map(p => {
        const cartItem = cart.find(item => String(item.id).trim() === String(p.id).trim());
        const qty = cartItem ? cartItem.qty : 0;

        return `
            <div class="bg-white p-2 rounded-2xl shadow-sm border relative">
                <button onclick="deleteProduct(${p.id})" class="absolute top-1 right-1 bg-white/90 w-6 h-6 rounded-full text-[10px] z-10">🗑️</button>
                <img src="${p.img}" class="w-full h-32 object-cover rounded-xl mb-2">
                <div class="font-bold text-[11px] h-8 overflow-hidden px-1">${p.name}</div>
                <div class="text-blue-600 font-bold text-sm px-1 mb-2">${p.price.toLocaleString()} ֏</div>
                
                <div class="flex items-center gap-1">
                    ${qty > 0 ? `
                        <button onclick="updateCartItem('${p.id}', -1)" class="w-8 h-10 bg-gray-100 text-gray-800 rounded-xl font-bold">-</button>
                        <div class="flex-1 bg-blue-50 text-blue-700 h-10 flex items-center justify-center rounded-xl font-black text-xs">
                            ${qty} հատ
                        </div>
                        <button onclick="updateCartItem('${p.id}', 1)" class="w-8 h-10 bg-gray-100 text-gray-800 rounded-xl font-bold">+</button>
                    ` : `
                        <button onclick="updateCartItem('${p.id}', 1)" class="w-full bg-orange-500 text-white py-2.5 rounded-xl text-[10px] font-bold">
                            + ԱՎԵԼԱՑՆԵԼ
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join("");
}

// --- ԶԱՄԲՅՈՒՂԻ ՑՈՒՑԱԴՐՈՒՄ ---

function showCart() {
    document.getElementById("cart-modal").classList.remove("hidden");
    const container = document.getElementById("cart-items");
    const checkoutBtn = document.getElementById("checkout-btn-text");
    
    checkoutBtn.innerText = editingOrderId ? "ՊԱՀՊԱՆԵԼ ՓՈՓՈԽՈՒԹՅՈՒՆՆԵՐԸ" : "ՊԱՏՎԻՐԵԼ";

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        total += item.price * item.qty;
        return `
            <div class="flex justify-between items-center bg-gray-50 p-2 rounded-xl border mb-2 px-2">
                <div class="flex items-center gap-2">
                    <img src="${item.img}" class="w-10 h-10 object-cover rounded">
                    <div class="flex flex-col text-[10px]">
                        <span class="font-bold">${item.name}</span>
                        <span>${item.price.toLocaleString()} x ${item.qty}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-bold text-blue-600 text-xs">${(item.price * item.qty).toLocaleString()} ֏</span>
                    <button onclick="updateCartItem('${item.id}', -${item.qty})" class="text-red-500 font-bold ml-1">✕</button>
                </div>
            </div>`;
    }).join("");
    document.getElementById("cart-total-price").innerText = total.toLocaleString() + " ֏";
}

// --- ՊԱՏՎԵՐԻ ԱՎԱՐՏ ---

function checkout() {
    if (cart.length === 0) return;
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);

    if (editingOrderId) {
        const index = history.findIndex(h => String(h.id).trim() === String(editingOrderId).trim());
        if (index !== -1) {
            history[index].items = JSON.parse(JSON.stringify(cart));
            history[index].total = total;
            history[index].date = new Date().toLocaleString("hy-AM") + " (խմբագրված)";
            localStorage.setItem("orderHistory", JSON.stringify(history));
            alert("Փոփոխությունները պահպանվեցին");
            cart = []; editingOrderId = null; updateCartUI(); closeCart(); showSection('history');
        }
    } else {
        const user = prompt("Պատվիրատուի անունը:");
        if (!user) return;
        const newOrder = { id: Date.now(), customer: user, items: [...cart], total: total, date: new Date().toLocaleString("hy-AM") };
        history.unshift(newOrder);
        localStorage.setItem("orderHistory", JSON.stringify(history));
        cart = []; updateCartUI(); closeCart(); showSection('history');
    }
}

// --- ՊԱՏՄՈՒԹՅՈՒՆ ԵՎ ԲՈԼՈՐԸ ԸՆՏՐԵԼ ---

function renderHistory() {
    const list = document.getElementById("history-list");
    const deleteBtn = document.getElementById("delete-selected-btn");
    const selectAllBtn = document.getElementById("select-all-btn");
    
    if (history.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-gray-400 italic">Պատմությունը դատարկ է</div>';
        deleteBtn.classList.add("hidden");
        selectAllBtn.classList.add("hidden");
        return;
    }

    selectAllBtn.classList.remove("hidden");
    deleteBtn.classList.toggle("hidden", selectedOrders.size === 0);
    deleteBtn.innerText = `Ջնջել (${selectedOrders.size})`;
    selectAllBtn.innerText = selectedOrders.size === history.length ? "Հանել նշումները" : "Ընտրել բոլորը";

    list.innerHTML = history.map(h => `
        <div class="flex items-center gap-3 mb-2">
            <input type="checkbox" onchange="toggleSelect(${h.id})" ${selectedOrders.has(Number(h.id)) ? 'checked' : ''} class="w-5 h-5 rounded-lg">
            <div onclick="openOrderDetails(${h.id})" class="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center active:scale-[0.98]">
                <div class="flex flex-col">
                    <span class="font-black text-gray-800">${h.customer}</span>
                    <span class="text-[10px] text-gray-400">${h.date}</span>
                </div>
                <span class="font-bold text-blue-600">${h.total.toLocaleString()} ֏</span>
            </div>
        </div>
    `).join("");
}

function toggleSelectAll() {
    if (selectedOrders.size === history.length) {
        selectedOrders.clear();
    } else {
        selectedOrders = new Set(history.map(h => Number(h.id)));
    }
    renderHistory();
}

function toggleSelect(id) {
    const numId = Number(id);
    if (selectedOrders.has(numId)) selectedOrders.delete(numId);
    else selectedOrders.add(numId);
    renderHistory();
}

function deleteSelected() {
    if (confirm(`Ջնջե՞լ ընտրված ${selectedOrders.size} պատվերները`)) {
        history = history.filter(h => !selectedOrders.has(Number(h.id)));
        localStorage.setItem("orderHistory", JSON.stringify(history));
        selectedOrders.clear();
        renderHistory();
    }
}

// --- ՄԱՆՐԱՄԱՍՆԵՐ ԵՎ ԽՄԲԱԳՐՈՒՄ ---

function openOrderDetails(id) {
    const order = history.find(h => h.id === id);
    const container = document.getElementById("order-details-content");
    container.innerHTML = `
        <div class="mb-6 flex justify-between items-start">
            <div>
                <h2 class="text-2xl font-black text-gray-800">${order.customer}</h2>
                <p class="text-xs text-gray-400">${order.date}</p>
            </div>
            <button onclick="editOrder(${order.id})" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Խմբագրել</button>
        </div>
        <div class="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            ${order.items.map(i => `
                <div class="flex justify-between items-center border-b border-gray-50 pb-3">
                    <div class="flex items-center gap-3">
                        <img src="${i.img}" class="w-12 h-12 object-cover rounded-xl">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold">${i.name}</span>
                            <span class="text-xs text-gray-500">${i.price.toLocaleString()} x ${i.qty}</span>
                        </div>
                    </div>
                    <span class="text-sm font-black text-gray-800">${(i.price * i.qty).toLocaleString()} ֏</span>
                </div>
            `).join("")}
        </div>
        <div class="mt-6 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
            <span class="text-lg font-bold">Ընդհանուր՝</span>
            <span class="text-xl font-black text-green-600">${order.total.toLocaleString()} ֏</span>
        </div>
    `;
    document.getElementById("order-details-modal").classList.remove("hidden");
}

function editOrder(id) {
    const order = history.find(h => h.id === id);
    cart = JSON.parse(JSON.stringify(order.items)); 
    editingOrderId = id; 
    
    closeOrderDetails(); // Փակում ենք պատուհանը
    updateCartUI();
    showSection('catalog'); // Գնում ենք կատալոգ
}

// --- ԱՊՐԱՆՔԻ ԱՎԵԼԱՑՈՒՄ (Admin) ---

async function addProduct() {
    const name = document.getElementById("prod-name").value;
    const price = document.getElementById("prod-price").value;
    const fileInput = document.getElementById("prod-img-file");
    if (!name || !price) return alert("Լրացրեք տվյալները");
    
    const save = (imgData) => {
        products.push({ id: Date.now(), name, price: parseInt(price), img: imgData });
        localStorage.setItem("myProducts", JSON.stringify(products));
        renderCatalog();
        closeModal();
    };

    if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => save(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
    } else { save("https://via.placeholder.com/150"); }
}

function deleteProduct(id) {
    if (confirm("Ջնջե՞լ ապրանքը:")) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem("myProducts", JSON.stringify(products));
        renderCatalog();
    }
}

// Սկզբնական ակտիվացում
renderCatalog();
