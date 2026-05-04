let products = JSON.parse(localStorage.getItem("myProducts")) || [];
let history = JSON.parse(localStorage.getItem("orderHistory")) || []; // Այս տողը շատ կարևոր է
let cart = [];
let selectedOrders = new Set();
let editingOrderId = null;
let currentEditingProductId = null;
function showSection(section) { 
    const headerTitle = document.getElementById("main-title");
    const addBtn = document.getElementById("add-btn");
    
    document.getElementById("catalog-section").classList.toggle("hidden", section !== "catalog");
    document.getElementById("history-section").classList.toggle("hidden", section !== "history");
    
    if (section === 'history') {
        headerTitle.innerText = "ՊԱՏՎԵՐՆԵՐ";
        addBtn.classList.add("hidden");
        selectedOrders.clear(); 
        renderHistory();
    } else {
        headerTitle.innerText = "ԿԱՏԱԼՈԳ";
        addBtn.classList.remove("hidden");
        renderCatalog();
    }

    document.getElementById("nav-catalog").className = section === 'catalog' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    document.getElementById("nav-history").className = section === 'history' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
}

// Ապրանքի ավելացում
function openAddProductModal() { document.getElementById("add-product-modal").classList.remove("hidden"); }
function closeAddProductModal() {
    document.getElementById("add-product-modal").classList.add("hidden");
    document.getElementById("add-p-name").value = "";
    document.getElementById("add-p-price").value = "";
    document.getElementById("add-p-img-input").value = "";
}

async function saveNewProduct() {
    const name = document.getElementById("add-p-name").value;
    const price = parseInt(document.getElementById("add-p-price").value);
    const imgInput = document.getElementById("add-p-img-input");
    if (!name || !price || !imgInput.files[0]) return alert("Լրացրեք բոլոր դաշտերը");
    const reader = new FileReader();
    reader.onload = function(e) {
        products.push({ id: Date.now().toString(), name, price, img: e.target.result });
        localStorage.setItem("myProducts", JSON.stringify(products));
        closeAddProductModal();
        renderCatalog();
    };
    reader.readAsDataURL(imgInput.files[0]);
}

// Կատալոգ
function renderCatalog() {
    const list = document.getElementById("product-list");
    if (!list) return;
    list.innerHTML = products.map(p => {
        const cartItem = cart.find(item => String(item.id) === String(p.id));
        const qty = cartItem ? cartItem.qty : 0;
        return `
            <div class="bg-white p-2 rounded-2xl shadow-sm border relative">
                <div class="relative overflow-hidden rounded-xl h-32 mb-2">
                    <img src="${p.img}" onclick="zoomImage('${p.img}')" class="w-full h-full object-cover">
                    <div onclick="openEditProduct('${p.id}')" class="absolute top-1 right-1 bg-white/90 p-2 rounded-lg shadow-md active:scale-90 transition-all">
                        <i data-lucide="pencil" class="w-4 h-4 text-blue-600"></i>
                    </div>
                </div>
                <div class="font-bold text-[11px] px-1 h-8 overflow-hidden uppercase">${p.name}</div>
                <div class="text-blue-600 font-bold text-sm px-1 mb-2">${p.price.toLocaleString()} ֏</div>
                <div class="flex items-center gap-1">
                    <button onclick="updateCartItem('${p.id}', -1)" class="w-8 h-8 bg-gray-100 rounded-lg font-bold">-</button>
                    <div onclick="setManualQty('${p.id}')" class="flex-1 text-center font-bold text-[10px] bg-blue-50 py-2 rounded-lg text-blue-700">${qty} հատ</div>
                    <button onclick="updateCartItem('${p.id}', 1)" class="w-8 h-8 bg-gray-100 rounded-lg font-bold">+</button>
                </div>
            </div>`;
    }).join("");
    lucide.createIcons();
}

function zoomImage(src) {
    document.getElementById("zoomed-image").src = src;
    document.getElementById("image-zoom-modal").classList.remove("hidden");
}
function closeImageZoom() { document.getElementById("image-zoom-modal").classList.add("hidden"); }

// Խմբագրում
function openEditProduct(id) {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    currentEditingProductId = id;
    document.getElementById("edit-p-name").value = p.name;
    document.getElementById("edit-p-price").value = p.price;
    document.getElementById("edit-p-preview").src = p.img;
    document.getElementById("edit-product-modal").classList.remove("hidden");
}
function closeEditProduct() { document.getElementById("edit-product-modal").classList.add("hidden"); }

async function saveProductChanges() {
    const name = document.getElementById("edit-p-name").value;
    const price = parseInt(document.getElementById("edit-p-price").value);
    const imgInput = document.getElementById("edit-p-img-input");
    const idx = products.findIndex(x => String(x.id) === String(currentEditingProductId));
    products[idx].name = name;
    products[idx].price = price;
    if (imgInput.files && imgInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { products[idx].img = e.target.result; finishSaving(); };
        reader.readAsDataURL(imgInput.files[0]);
    } else { finishSaving(); }
}
function finishSaving() {
    localStorage.setItem("myProducts", JSON.stringify(products));
    closeEditProduct();
    renderCatalog();
}

// Զամբյուղ
function updateCartItem(id, delta) {
    const pId = String(id);
    let item = cart.find(i => String(i.id) === pId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => String(i.id) !== pId);
    } else if (delta > 0) {
        const p = products.find(x => String(x.id) === pId);
        if (p) cart.push({ ...p, qty: delta });
    }
    refreshUI();
}

function setManualQty(id) {
    const val = prompt("Քանակը:");
    if (val === null) return;
    const qty = parseInt(val);
    const pId = String(id);
    if (isNaN(qty) || qty <= 0) cart = cart.filter(i => String(i.id) !== pId);
    else {
        let item = cart.find(i => String(i.id) === pId);
        if (item) item.qty = qty;
        else {
            const p = products.find(x => String(x.id) === pId);
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
}

function showCart() {
    document.getElementById("cart-modal").classList.remove("hidden");
    const container = document.getElementById("cart-items");
    const btnText = document.getElementById("checkout-btn-text");
    btnText.innerText = editingOrderId ? "ՊԱՀՊԱՆԵԼ" : "ՊԱՏՎԻՐԵԼ";
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `
            <div class="flex justify-between items-center border-b py-3">
                <div class="flex items-center gap-3">
                    <img src="${item.img}" class="w-10 h-10 object-cover rounded-lg">
                    <div class="flex flex-col"><span class="text-[10px] font-bold uppercase w-32 truncate">${item.name}</span></div>
                </div>
                <div class="text-right font-black text-blue-600 text-[10px]">x${item.qty} = ${(item.price * item.qty).toLocaleString()} ֏</div>
            </div>`;
    }).join("");
    document.getElementById("cart-total-price").innerText = total.toLocaleString() + " ֏";
}

function checkout() {
    try {
        // 1. Ստուգում ենք՝ արդյոք զամբյուղը դատարկ չէ
        if (!cart || cart.length === 0) {
            alert("Զամբյուղը դատարկ է");
            closeCart();
            return;
        }

        // 2. Հաշվում ենք ընդհանուր գումարը
        const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
        
        // 3. Եթե խմբագրում ենք հին պատվերը
        if (editingOrderId !== null && editingOrderId !== undefined) {
            if (!Array.isArray(history)) history = []; // Ապահովագրություն
            
            const idx = history.findIndex(h => String(h.id) === String(editingOrderId));
            if (idx !== -1) {
                history[idx].items = JSON.parse(JSON.stringify(cart)); 
                history[idx].total = total; 
                if (!history[idx].date.includes("(խմբ.)")) {
                    history[idx].date += " (խմբ.)";
                }
            }
            editingOrderId = null; 
        } 
        // 4. Եթե նոր պատվեր է
        else {
            const user = prompt("Պատվիրատուի անունը:");
            if (!user) return; 

            if (!Array.isArray(history)) history = []; // Ապահովագրություն

            const newOrder = {
                id: Date.now(),
                customer: user,
                items: JSON.parse(JSON.stringify(cart)),
                total: total,
                date: new Date().toLocaleString("hy-AM")
            };
            history.unshift(newOrder);
        }
        
        // 5. Պահպանում ենք LocalStorage-ում
        localStorage.setItem("orderHistory", JSON.stringify(history));
        
        // 6. Մաքրում ենք զամբյուղը և փակում պատուհանը
        cart = []; 
        closeCart();
        
        // 7. Թարմացնում ենք էկրանը
        refreshUI(); 
        if (typeof showSection === "function") {
            showSection('history');
        }
        
    } catch (error) {
        // Սա կօգնի քեզ տեսնել իրական սխալը Console-ում
        console.error("Error details:", error);
        alert("Սխալը հետևյալն է. " + error.message);
    }
}
function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = history.map(h => `
        <div class="flex items-center gap-2 mb-2">
            <input type="checkbox" onchange="toggleSelect('${h.id}')" ${selectedOrders.has(String(h.id)) ? 'checked' : ''} class="w-5 h-5 rounded accent-blue-600">
            <div class="flex-1 bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm" onclick="openOrderDetails('${h.id}')">
                <div><div class="font-bold text-sm uppercase italic">${h.customer}</div><div class="text-[9px] text-gray-400">${h.date}</div></div>
                <div class="font-black text-blue-600 text-sm">${h.total.toLocaleString()} ֏</div>
            </div>
        </div>`).join("");
    const delBtn = document.getElementById("delete-selected-btn");
    delBtn.classList.toggle("hidden", selectedOrders.size === 0);
    delBtn.innerText = `Ջնջել (${selectedOrders.size})`;
}

function openOrderDetails(id) {
    const order = history.find(h => String(h.id) === String(id));
    if (!order) return;
    document.getElementById("order-details-content").innerHTML = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="font-black text-lg text-blue-600 uppercase italic">${order.customer}</h2>
            <button onclick="editExistingOrder('${order.id}')" class="bg-blue-50 p-2 rounded-xl"><i data-lucide="pencil" class="w-5 h-5 text-blue-600"></i></button>
        </div>` + 
        order.items.map(i => `<div class="flex gap-3 mb-3 items-center"><img src="${i.img}" class="w-12 h-12 object-cover rounded-xl shadow-sm"><div class="flex flex-col"><span class="text-xs font-bold uppercase">${i.name}</span><span class="text-[11px] text-blue-500 font-black">${i.qty} հատ</span></div></div>`).join("") +
        `<div class="mt-6 pt-4 border-t font-black text-lg text-blue-600 text-right italic uppercase">ԸՆԴՀԱՆՈՒՐ: ${order.total.toLocaleString()} ֏</div>`;
    document.getElementById("order-details-modal").classList.remove("hidden");
    lucide.createIcons();
}

function editExistingOrder(id) {
    const order = history.find(h => String(h.id) === String(id));
    cart = JSON.parse(JSON.stringify(order.items));
    editingOrderId = id; 
    closeOrderDetails(); 
    refreshUI(); 
    showSection('catalog');
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
    if (confirm("Ջնջե՞լ")) {
        history = history.filter(h => !selectedOrders.has(String(h.id)));
        localStorage.setItem("orderHistory", JSON.stringify(history));
        selectedOrders.clear(); renderHistory();
    }
}
function closeCart() { document.getElementById("cart-modal").classList.add("hidden"); }
function closeOrderDetails() { document.getElementById("order-details-modal").classList.add("hidden"); }

renderCatalog();
