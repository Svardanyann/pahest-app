let products = JSON.parse(localStorage.getItem("myProducts")) || [];
let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let cart = [];
let selectedOrders = new Set(); // Ընտրված պատվերների համար

function showSection(section) {
    document.getElementById("catalog-section").classList.toggle("hidden", section !== "catalog");
    document.getElementById("history-section").classList.toggle("hidden", section !== "history");
    document.getElementById("nav-catalog").className = section === 'catalog' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    document.getElementById("nav-history").className = section === 'history' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    if (section === "history") {
        selectedOrders.clear();
        renderHistory();
    }
}

// Ընդհանուր ֆունկցիաներ
function closeModal() { document.getElementById("modal").classList.add("hidden"); }
function closeCart() { document.getElementById("cart-modal").classList.add("hidden"); }
function closeOrderDetails() { document.getElementById("order-details-modal").classList.add("hidden"); }

// ԱՊՐԱՆՔԻ ԱՎԵԼԱՑՈՒՄ
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

function renderCatalog() {
    const list = document.getElementById("product-list");
    list.innerHTML = products.map(p => `
        <div class="bg-white p-2 rounded-2xl shadow-sm border relative">
            <button onclick="deleteProduct(${p.id})" class="absolute top-1 right-1 bg-white/90 w-6 h-6 rounded-full text-[10px] z-10">🗑️</button>
            <img src="${p.img}" class="w-full h-32 object-cover rounded-xl mb-2">
            <div class="font-bold text-[11px] h-8 overflow-hidden px-1">${p.name}</div>
            <div class="text-blue-600 font-bold text-sm px-1 mb-2">${p.price.toLocaleString()} ֏</div>
            <button onclick="addToCart(${p.id})" class="w-full bg-orange-500 text-white py-2 rounded-xl text-[10px] font-bold">+ ԱՎԵԼԱՑՆԵԼ</button>
        </div>
    `).join("");
}

function deleteProduct(id) {
    if (confirm("Ջնջե՞լ ապրանքը:")) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem("myProducts", JSON.stringify(products));
        renderCatalog();
    }
}

// ԶԱՄԲՅՈՒՂ
function addToCart(id) {
    const p = products.find(x => x.id === id);
    const qty = prompt(p.name + "\nՔանակը:", 1);
    if (qty && qty > 0) {
        cart.push({ ...p, qty: parseInt(qty) });
        updateCartUI();
    }
}

function updateCartUI() {
    document.getElementById("cart-count").innerText = cart.length;
    document.getElementById("cart-btn").classList.toggle("hidden", cart.length === 0);
}

function showCart() {
    document.getElementById("cart-modal").classList.remove("hidden");
    const container = document.getElementById("cart-items");
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `
            <div class="flex justify-between items-center bg-gray-50 p-2 rounded-xl border mb-2">
                <div class="flex items-center gap-2">
                    <img src="${item.img}" class="w-10 h-10 object-cover rounded">
                    <div class="flex flex-col text-[10px]">
                        <span class="font-bold">${item.name}</span>
                        <span>${item.price} x ${item.qty}</span>
                    </div>
                </div>
                <span class="font-bold text-blue-600 text-xs">${(item.price * item.qty).toLocaleString()} ֏</span>
            </div>`;
    }).join("");
    document.getElementById("cart-total-price").innerText = total.toLocaleString() + " ֏";
}

function checkout() {
    const user = prompt("Պատվիրատուի անունը:");
    if (!user) return;
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const newOrder = { id: Date.now(), customer: user, items: [...cart], total: total, date: new Date().toLocaleString("hy-AM") };
    history.unshift(newOrder);
    localStorage.setItem("orderHistory", JSON.stringify(history));
    cart = []; updateCartUI(); closeCart(); showSection('history');
}

// ՊԱՏՄՈՒԹՅԱՆ ԲԱԺԻՆ (ԸՆՏՐՈՎԻ ՋՆՋՈՒՄՈՎ)
function renderHistory() {
    const list = document.getElementById("history-list");
    const deleteBtn = document.getElementById("delete-selected-btn");
    
    if (history.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-gray-400">Պատմությունը դատարկ է</div>';
        deleteBtn.classList.add("hidden");
        return;
    }

    deleteBtn.classList.toggle("hidden", selectedOrders.size === 0);
    deleteBtn.innerText = `Ջնջել ընտրվածները (${selectedOrders.size})`;

    list.innerHTML = history.map(h => `
        <div class="flex items-center gap-3 mb-3">
            <!-- Checkbox ընտրելու համար -->
            <input type="checkbox" onchange="toggleSelect(${h.id})" ${selectedOrders.has(h.id) ? 'checked' : ''} class="w-5 h-5 rounded border-gray-300 text-blue-600">
            
            <div onclick="openOrderDetails(${h.id})" class="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center active:bg-gray-50 transition-colors">
                <div class="flex flex-col">
                    <span class="font-black text-gray-800 text-base">${h.customer}</span>
                    <span class="text-[10px] text-gray-400">${h.date}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-bold text-blue-600">${h.total.toLocaleString()} ֏</span>
                    <span class="text-gray-300 text-xs">❯</span>
                </div>
            </div>
        </div>
    `).join("");
}

function toggleSelect(id) {
    if (selectedOrders.has(id)) {
        selectedOrders.delete(id);
    } else {
        selectedOrders.add(id);
    }
    renderHistory();
}

function deleteSelected() {
    if (confirm(`Ջնջե՞լ ընտրված ${selectedOrders.size} պատվերները:`)) {
        history = history.filter(h => !selectedOrders.has(h.id));
        localStorage.setItem("orderHistory", JSON.stringify(history));
        selectedOrders.clear();
        renderHistory();
    }
}

// ԱՌԱՆՁԻՆ ՊԱՏՈՒՀԱՆԻ ԲԱՑՈՒՄ (POPUP)
function openOrderDetails(id) {
    const order = history.find(h => h.id === id);
    const modal = document.getElementById("order-details-modal");
    const container = document.getElementById("order-details-content");
    
    container.innerHTML = `
        <div class="mb-4">
            <h2 class="text-xl font-black text-gray-800">${order.customer}</h2>
            <p class="text-xs text-gray-400">${order.date}</p>
        </div>
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            ${order.items.map(i => `
                <div class="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div class="flex items-center gap-3">
                        <img src="${i.img}" class="w-14 h-14 object-cover rounded-xl shadow-sm">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-gray-700">${i.name}</span>
                            <span class="text-xs text-gray-500">${i.price.toLocaleString()} ֏ x ${i.qty}</span>
                        </div>
                    </div>
                    <span class="text-sm font-black text-blue-600">${(i.price * i.qty).toLocaleString()} ֏</span>
                </div>
            `).join("")}
        </div>
        <div class="mt-6 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
            <span class="text-lg font-bold text-gray-800">Ընդհանուր՝</span>
            <span class="text-xl font-black text-green-600">${order.total.toLocaleString()} ֏</span>
        </div>
    `;
    
    modal.classList.remove("hidden");
}

renderCatalog();
