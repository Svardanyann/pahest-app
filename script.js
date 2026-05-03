let products = JSON.parse(localStorage.getItem("myProducts")) || [];
let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let cart = [];

// Էկրանների փոփոխություն
function showSection(section) {
    document.getElementById("catalog-section").classList.toggle("hidden", section !== "catalog");
    document.getElementById("history-section").classList.toggle("hidden", section !== "history");
    
    document.getElementById("nav-catalog").className = section === 'catalog' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    document.getElementById("nav-history").className = section === 'history' ? 'flex flex-col items-center flex-1 text-blue-600 font-bold' : 'flex flex-col items-center flex-1 text-gray-400';
    
    if (section === "history") renderHistory();
}

function openModal() { document.getElementById("modal").classList.remove("hidden"); }
function closeModal() { document.getElementById("modal").classList.add("hidden"); }
function closeCart() { document.getElementById("cart-modal").classList.add("hidden"); }

// Ապրանքի ավելացում (նկարի սեղմումով)
async function addProduct() {
    const name = document.getElementById("prod-name").value;
    const price = document.getElementById("prod-price").value;
    const fileInput = document.getElementById("prod-img-file");

    if (!name || !price) return alert("Լրացրեք տվյալները");

    const reader = new FileReader();
    const save = (imgData) => {
        products.push({ id: Date.now(), name, price: parseInt(price), img: imgData });
        localStorage.setItem("myProducts", JSON.stringify(products));
        renderCatalog();
        closeModal();
    };

    if (fileInput.files[0]) {
        reader.onload = (e) => save(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        save("https://via.placeholder.com/150");
    }
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
            <div class="flex justify-between items-center bg-gray-50 p-2 rounded-xl border">
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

// ՊԱՀՊԱՆՈՒՄ
function checkout() {
    const user = prompt("Պատվիրատուի անունը (օր.՝ Լիպարիտ):");
    if (!user) return;

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const newOrder = {
        id: Date.now(),
        customer: user,
        items: [...cart],
        total: total,
        date: new Date().toLocaleString("hy-AM")
    };

    history.unshift(newOrder);
    localStorage.setItem("orderHistory", JSON.stringify(history));
    
    cart = [];
    updateCartUI();
    closeCart();
    showSection('history');
}

// ՊԱՏՄՈՒԹՅԱՆ ԱՐՏԱՊԱՏԿԵՐՈՒՄ (ԱԿՈՐԴԵՈՆՈՎ)
function renderHistory() {
    const list = document.getElementById("history-list");
    if (history.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-gray-400 italic">Պատմությունը դատարկ է</div>';
        return;
    }

    list.innerHTML = history.map(h => `
        <div class="bg-white rounded-2xl shadow-sm mb-3 border border-gray-100 overflow-hidden">
            <!-- Անունի սեղմվող հատվածը -->
            <div onclick="toggleOrder(${h.id})" class="p-4 flex justify-between items-center bg-white active:bg-gray-50">
                <div class="flex flex-col">
                    <span class="font-black text-gray-800 text-base">${h.customer}</span>
                    <span class="text-[10px] text-gray-400">${h.date}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-bold text-blue-600">${h.total.toLocaleString()} ֏</span>
                    <span id="icon-${h.id}" class="text-gray-400 text-xs">▼</span>
                </div>
            </div>
            
            <!-- Թաքնված պատվերի դետալները -->
            <div id="order-${h.id}" class="hidden p-4 bg-gray-50 border-t border-gray-100">
                <div class="space-y-3">
                    ${h.items.map(i => `
                        <div class="flex justify-between items-center py-1">
                            <div class="flex items-center gap-3">
                                <img src="${i.img}" class="w-10 h-10 object-cover rounded-lg shadow-sm">
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold text-gray-700">${i.name}</span>
                                    <span class="text-[10px] text-gray-400">${i.price.toLocaleString()} ֏ x ${i.qty}</span>
                                </div>
                            </div>
                            <span class="text-xs font-black text-gray-800">${(i.price * i.qty).toLocaleString()} ֏</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `).join("");
}

// Դետալների բացում/փակում
function toggleOrder(id) {
    const detail = document.getElementById(`order-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    
    if (detail.classList.contains("hidden")) {
        detail.classList.remove("hidden");
        icon.innerText = "▲";
        icon.classList.add("text-blue-600");
    } else {
        detail.classList.add("hidden");
        icon.innerText = "▼";
        icon.classList.remove("text-blue-600");
    }
}

function clearHistory() {
    if (confirm("Մաքրե՞լ պատմությունը:")) {
        history = [];
        localStorage.setItem("orderHistory", JSON.stringify(history));
        renderHistory();
    }
}

renderCatalog();
