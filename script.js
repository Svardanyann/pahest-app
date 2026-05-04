let products = JSON.parse(localStorage.getItem("myProducts")) || [];
let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let cart = [];
let selectedOrders = new Set();
let editingOrderId = null;

// 1. ՍԵԿՑԻԱՆԵՐԻ ՓՈԽՈՒՄ
function showSection(section) {
    document.getElementById("catalog-section").classList.toggle("hidden", section !== "catalog");
    document.getElementById("history-section").classList.toggle("hidden", section !== "history");
    
    // Նավիգացիայի ոճերը
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

// 2. ԶԱՄԲՅՈՒՂԻ ՃԿՈՒՆ ԿԱՌԱՎԱՐՈՒՄ (+/-)
function updateCartItem(id, delta) {
    const productId = String(id).trim();
    const existingItem = cart.find(item => String(item.id).trim() === productId);

    if (existingItem) {
        existingItem.qty += delta;
        // Եթե քանակը դառնում է 0 կամ պակաս, հեռացնում ենք զամբյուղից
        if (existingItem.qty <= 0) {
            cart = cart.filter(item => String(item.id).trim() !== productId);
        }
    } else if (delta > 0) {
        // Եթե ապրանքը չկար ու սեղմել ենք +, ավելացնում ենք նորը
        const p = products.find(x => String(x.id).trim() === productId);
        if (p) cart.push({ ...p, qty: 1 });
    }
    
    updateCartUI();
    renderCatalog(); // Թարմացնում ենք կատալոգի կոճակները
    if (!document.getElementById("cart-modal").classList.contains("hidden")) showCart();
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cart-count").innerText = count;
    document.getElementById("cart-btn").classList.toggle("hidden", cart.length === 0);
}

// 3. ԿԱՏԱԼՈԳԻ ՌԵՆԴԵՐ (ԱՎԵԼԱՑՎԱԾ Է +/- ՏԵՍՔԸ)
function renderCatalog() {
    const list = document.getElementById("product-list");
    if (!list) return;

    list.innerHTML = products.map(p => {
        const cartItem = cart.find(item => String(item.id).trim() === String(p.id).trim());
        const qty = cartItem ? cartItem.qty : 0;

        return `
            <div class="bg-white p-2 rounded-2xl shadow-sm border relative transition-all active:scale-95">
                <button onclick="deleteProduct('${p.id}')" class="absolute top-1 right-1 bg-white/90 w-6 h-6 rounded-full text-[10px] z-10 shadow-sm">🗑️</button>
                <img src="${p.img}" class="w-full h-32 object-cover rounded-xl mb-2 pointer-events-none">
                <div class="font-bold text-[11px] h-8 overflow-hidden px-1">${p.name}</div>
                <div class="text-blue-600 font-bold text-sm px-1 mb-2">${p.price.toLocaleString()} ֏</div>
                
                <div class="flex items-center gap-1 mt-1">
                    ${qty > 0 ? `
                        <button onclick="updateCartItem('${p.id}', -1)" class="w-10 h-10 bg-gray-100 text-gray-800 rounded-xl font-bold active:bg-gray-200">-</button>
                        <div class="flex-1 bg-blue-50 text-blue-700 h-10 flex items-center justify-center rounded-xl font-black text-xs">
                            ${qty} հատ
                        </div>
                        <button onclick="updateCartItem('${p.id}', 1)" class="w-10 h-10 bg-gray-100 text-gray-800 rounded-xl font-bold active:bg-gray-200">+</button>
                    ` : `
                        <button onclick="updateCartItem('${p.id}', 1)" class="w-full bg-orange-500 text-white py-2.5 rounded-xl text-[10px] font-bold shadow-md shadow-orange-100">
                            + ԱՎԵԼԱՑՆԵԼ
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join("");
}

// 4. ՊԱՏՄՈՒԹՅԱՆ ԲԱԺՆԻ ՈՒՂՂՈՒՄՆԵՐ (SELECT ALL)
function renderHistory() {
    const list = document.getElementById("history-list");
    const deleteBtn = document.getElementById("delete-selected-btn");
    const selectAllBtn = document.getElementById("select-all-btn");
    
    if (history.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-gray-400 italic">Պատմությունը դատարկ է</div>';
        if (deleteBtn) deleteBtn.classList.add("hidden");
        if (selectAllBtn) selectAllBtn.classList.add("hidden");
        return;
    }

    if (selectAllBtn) selectAllBtn.classList.remove("hidden");
    if (deleteBtn) {
        deleteBtn.classList.toggle("hidden", selectedOrders.size === 0);
        deleteBtn.innerText = `Ջնջել (${selectedOrders.size})`;
    }
    
    if (selectAllBtn) {
        selectAllBtn.innerText = selectedOrders.size === history.length ? "Հանել նշումները" : "Ընտրել բոլորը";
    }

    list.innerHTML = history.map(h => `
        <div class="flex items-center gap-3 mb-2">
            <input type="checkbox" onchange="toggleSelect('${h.id}')" ${selectedOrders.has(String(h.id)) ? 'checked' : ''} class="w-5 h-5 rounded-lg">
            <div onclick="openOrderDetails('${h.id}')" class="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center active:scale-[0.98] transition-transform">
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
        history.forEach(h => selectedOrders.add(String(h.id)));
    }
    renderHistory();
}

function toggleSelect(id) {
    const strId = String(id);
    if (selectedOrders.has(strId)) selectedOrders.delete(strId);
    else selectedOrders.add(strId);
    renderHistory();
}

// 5. ԽՄԲԱԳՐՈՒՄ (ԱՌԱՆՑ MODAL-Ի ՓԱԿՄԱՆ ԽՆԴՐԻ)
function editOrder(id) {
    const order = history.find(h => String(h.id) === String(id));
    if (!order) return;

    // Պատճենում ենք ապրանքները զամբյուղ
    cart = JSON.parse(JSON.stringify(order.items));
    editingOrderId = id;
    
    closeOrderDetails();
    updateCartUI();
    showSection('catalog'); // Միանգամից գնում ենք կատալոգ
}

// Օգնող ֆունկցիաներ մոդալների համար
function closeModal() { document.getElementById("modal").classList.add("hidden"); }
function closeCart() { document.getElementById("cart-modal").classList.add("hidden"); }
function closeOrderDetails() { document.getElementById("order-details-modal").classList.add("hidden"); }

// Սկզբնական կանչ
renderCatalog();
