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
}

function closeModal() { document.getElementById("modal").classList.add("hidden"); }
function closeCart() { 
    document.getElementById("cart-modal").classList.add("hidden"); 
    // ՈՒՇԱԴՐՈՒԹՅՈՒՆ. editingOrderId-ն այստեղ չենք ջնջում, որ եթե պատահական փակի, խմբագրումը չկորչի
}
function closeOrderDetails() { document.getElementById("order-details-modal").classList.add("hidden"); }

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

// ԶԱՄԲՅՈՒՂՈՒՄ ՔԱՆԱԿԻ ՍՏՈՒԳՈՒՄ (ՈՒՂՂՎԱԾ ՏԱՐԲԵՐԱԿ)
function addToCart(id) {
    // Գտնում ենք ապրանքը կատալոգից
    const p = products.find(x => Number(x.id) === Number(id));
    if (!p) return;

    const qtyInput = prompt(p.name + "\nՔանակը:", 1);
    const qty = parseInt(qtyInput);

    if (qty && qty > 0) {
        // ՍՏՈՒԳՈՒՄ. Փնտրում ենք զամբյուղում այս ապրանքը ըստ ID-ի
        // Օգտագործում ենք Number(), որպեսզի համոզվենք, որ երկուսն էլ թիվ են
        const existingItemIndex = cart.findIndex(item => Number(item.id) === Number(id));
        
        if (existingItemIndex !== -1) {
            // Եթե ապրանքը ԱՐԴԵՆ ԿԱ, ավելացնում ենք քանակը հենց այդ ինդեքսի վրա
            cart[existingItemIndex].qty += qty;
            console.log("Ապրանքի քանակը թարմացվեց");
        } else {
            // Եթե ՉԿԱ, նոր ենք ավելացնում
            cart.push({ ...p, qty: qty });
            console.log("Նոր ապրանք ավելացվեց զամբյուղ");
        }
        
        updateCartUI();
        
        // Եթե զամբյուղը բաց է, թարմացնում ենք տեսքը
        if (!document.getElementById("cart-modal").classList.contains("hidden")) {
            showCart();
        }
    }
}

function updateCartUI() {
    document.getElementById("cart-count").innerText = cart.length;
    document.getElementById("cart-btn").classList.toggle("hidden", cart.length === 0);
}

function showCart() {
    document.getElementById("cart-modal").classList.remove("hidden");
    const container = document.getElementById("cart-items");
    const checkoutBtn = document.getElementById("checkout-btn-text"); // Կոճակի տեքստը
    
    // Փոխում ենք կոճակի տեքստը, եթե խմբագրում ենք
    if (editingOrderId) {
        checkoutBtn.innerText = "ՊԱՀՊԱՆԵԼ ՓՈՓՈԽՈՒԹՅՈՒՆՆԵՐԸ";
    } else {
        checkoutBtn.innerText = "ՊԱՏՎԻՐԵԼ";
    }

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        total += item.price * item.qty;
        return `
            <div class="flex justify-between items-center bg-gray-50 p-2 rounded-xl border mb-2 px-2">
                <div class="flex items-center gap-2">
                    <img src="${item.img}" class="w-10 h-10 object-cover rounded">
                    <div class="flex flex-col text-[10px]">
                        <span class="font-bold">${item.name}</span>
                        <span>${item.price} x ${item.qty}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-bold text-blue-600 text-xs">${(item.price * item.qty).toLocaleString()} ֏</span>
                    <button onclick="removeFromCart(${index})" class="text-red-500 font-bold ml-1">✕</button>
                </div>
            </div>`;
    }).join("");
    document.getElementById("cart-total-price").innerText = total.toLocaleString() + " ֏";
}

function removeFromCart(index) {
    cart.splice(index, 1);
    if (cart.length === 0) {
        closeCart();
        updateCartUI();
    } else {
        showCart();
        updateCartUI();
    }
}

// ՀԻՄՆԱԿԱՆ ՖՈՒՆԿՑԻԱՆ ՈՐԸ ՈՒՂՂՎԵԼ Է
function checkout() {
    if (cart.length === 0) return;
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);

    if (editingOrderId) {
        // Գտնում ենք հին պատվերը
        const index = history.findIndex(h => h.id === editingOrderId);
        if (index !== -1) {
            history[index].items = [...cart];
            history[index].total = total;
            // Պահպանում ենք նույն անունը, ուղղակի թարմացնում ենք ամսաթիվը
            history[index].date = new Date().toLocaleString("hy-AM") + " (փոփոխված)";
            
            localStorage.setItem("orderHistory", JSON.stringify(history));
            alert("Փոփոխությունները պահպանվեցին");
            
            // Մաքրում ենք ամեն ինչ
            cart = [];
            editingOrderId = null;
            updateCartUI();
            closeCart();
            showSection('history');
        }
    } else {
        // Նոր պատվեր
        const user = prompt("Պատվիրատուի անունը:");
        if (!user) return;
        const newOrder = { id: Date.now(), customer: user, items: [...cart], total: total, date: new Date().toLocaleString("hy-AM") };
        history.unshift(newOrder);
        localStorage.setItem("orderHistory", JSON.stringify(history));
        cart = [];
        updateCartUI();
        closeCart();
        showSection('history');
    }
}

function renderHistory() {
    const list = document.getElementById("history-list");
    const deleteBtn = document.getElementById("delete-selected-btn");
    if (history.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-gray-400 italic">Պատմությունը դատարկ է</div>';
        deleteBtn.classList.add("hidden");
        return;
    }
    deleteBtn.classList.toggle("hidden", selectedOrders.size === 0);
    deleteBtn.innerText = `Ջնջել ընտրվածները (${selectedOrders.size})`;
    list.innerHTML = history.map(h => `
        <div class="flex items-center gap-3 mb-2">
            <input type="checkbox" onchange="toggleSelect(${h.id})" ${selectedOrders.has(h.id) ? 'checked' : ''} class="w-5 h-5 rounded-lg border-gray-300">
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

function toggleSelect(id) {
    if (selectedOrders.has(id)) selectedOrders.delete(id);
    else selectedOrders.add(id);
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
    cart = [...order.items]; 
    editingOrderId = id; 
    updateCartUI();
    closeOrderDetails();
    showSection('catalog');
    showCart();
}

renderCatalog();
