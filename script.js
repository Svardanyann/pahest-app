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

// Ապրանքի ավելացում
function addProduct() {
    const name = document.getElementById("prod-name").value;
    const price = document.getElementById("prod-price").value;
    const fileInput = document.getElementById("prod-img-file");

    if (!name || !price) return alert("Լրացրեք անունն ու գինը");

    const save = (imgData) => {
        const newProd = { id: Date.now(), name, price: parseInt(price), img: imgData };
        products.push(newProd);
        localStorage.setItem("myProducts", JSON.stringify(products));
        renderCatalog();
        closeModal();
        document.getElementById("prod-name").value = "";
        document.getElementById("prod-price").value = "";
        document.getElementById("prod-img-file").value = "";
    };

    if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => save(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        save("https://via.placeholder.com/150");
    }
}

// Կատալոգի արտապատկերում
function renderCatalog() {
    const list = document.getElementById("product-list");
    list.innerHTML = products.map(p => `
        <div class="bg-white p-2 rounded-2xl shadow-sm border relative">
            <button onclick="deleteProduct(${p.id})" class="absolute top-1 right-1 bg-white/90 w-6 h-6 rounded-full text-[10px] z-10">🗑️</button>
            <img src="${p.img}" class="w-full h-32 object-cover rounded-xl mb-2">
            <div class="font-bold text-[11px] h-8 overflow-hidden">${p.name}</div>
            <div class="text-blue-600 font-bold text-sm mb-2">${p.price.toLocaleString()} ֏</div>
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

// Զամբյուղ
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

// ՊԱՏՎԵՐԻ ՊԱՀՊԱՆՈՒՄ (ՈՒՂՂՎԱԾ)
function checkout() {
    const user = prompt("Պատվիրատուի անունը:");
    if (!user) return;

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const newOrder = {
        id: Date.now(),
        customer: user,
        items: JSON.parse(JSON.stringify(cart)), // Սա կարևոր է տվյալների պահպանման համար
        total: total,
        date: new Date().toLocaleString("hy-AM")
    };

    // Ավելացնում ենք պատմության մեջ
    history.unshift(newOrder);
    
    // ՍԱ Է ԱՄԵՆԱԿԱՐԵՎՈՐ ՄԱՍԸ - ՊԱՀՈՒՄ ԵՆՔ ՀԻՇՈՂՈՒԹՅԱՆ ՄԵՋ
    localStorage.setItem("orderHistory", JSON.stringify(history));
    
    // Մաքրում ենք զամբյուղը
    cart = [];
    updateCartUI();
    
    // Փակում ենք զամբյուղի պատուհանը
    closeCart();
    
    // Ցույց ենք տալիս պատմության բաժինը
    showSection('history');
    
    alert("Պատվերը հաջողությամբ պահպանվեց!");
}

function renderHistory() {
    const list = document.getElementById("history-list");
    if (history.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-gray-400">Պատմությունը դատարկ է</div>';
        return;
    }
    list.innerHTML = history.map(h => `
        <div class="bg-white p-3 rounded-2xl shadow-sm border-l-4 border-blue-500 mb-4">
            <div class="flex justify-between items-center mb-2">
                <span class="font-black text-gray-800">${h.customer}</span>
                <span class="font-bold text-green-600 text-sm">${h.total.toLocaleString()} ֏</span>
            </div>
            <div class="bg-gray-50 p-2 rounded-xl space-y-1">
                ${h.items.map(i => `
                    <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                        <div class="flex items-center gap-2">
                            <img src="${i.img}" class="w-7 h-7 object-cover rounded">
                            <span class="text-[10px] text-gray-600">${i.name} (x${i.qty})</span>
                        </div>
                        <span class="text-[10px] font-bold">${(i.price * i.qty).toLocaleString()} ֏</span>
                    </div>
                `).join("")}
            </div>
            <div class="text-[8px] text-gray-400 mt-2 text-right">${h.date}</div>
        </div>
    `).join("");
}

function clearHistory() {
    if (confirm("Մաքրե՞լ պատմությունը:")) {
        history = [];
        localStorage.setItem("orderHistory", JSON.stringify(history));
        renderHistory();
    }
}

// Սկզբնական բեռնում
renderCatalog();
