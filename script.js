// 1. ԱՊՐԱՆՔՆԵՐԻ ՑՈՒՑԱԿԸ
const products = [
    { id: "1", name: "ՊԱՄԻՆԱԿ ՏՈՒՓՈՎ", price: 5500, img: "images/paminak.jpg" },
    { id: "2", name: "ՆԱՐԻՆԱԿ", price: 4800, img: "images/narinak.png" },
    { id: "3", name: "ՊԱՄԻՆԱԿ 1", price: 3500, img: "images/paminak2.jpg" }
    // Այստեղ ավելացրու մնացած ապրանքները նույն ձևով
];

let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let cart = [];
let tempQty = {}; // Յուրաքանչյուր ապրանքի ընտրված քանակը պահելու համար

// Կատալոգի արտածում
function renderCatalog() {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;
    grid.innerHTML = "";

    products.forEach(p => {
        if (!tempQty[p.id]) tempQty[p.id] = 1;

        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <div class="product-img-container">
                <img src="${p.img}" alt="${p.name}">
            </div>
            <h3>${p.name}</h3>
            <p>${p.price} դրամ</p>
            
            <div class="qty-controls">
                <button class="qty-btn" onclick="changeTempQty('${p.id}', -1)">-</button>
                <span id="qty-${p.id}">${tempQty[p.id]}</span>
                <button class="qty-btn" onclick="changeTempQty('${p.id}', 1)">+</button>
            </div>
            
            <button class="add-to-cart-btn" onclick="confirmAddToCart('${p.id}')">Ավելացնել</button>
        `;
        grid.appendChild(div);
    });
}

// Ժամանակավոր քանակի փոփոխություն (կատալոգի մեջ)
function changeTempQty(id, delta) {
    if (!tempQty[id]) tempQty[id] = 1;
    tempQty[id] += delta;
    if (tempQty[id] < 1) tempQty[id] = 1;
    document.getElementById(`qty-${id}`).innerText = tempQty[id];
}

// Ավելացում զամբյուղ ընտրված քանակով
function confirmAddToCart(id) {
    const product = products.find(p => p.id === id);
    const qtyToAdd = tempQty[id] || 1;
    
    const inCart = cart.find(item => item.id === id);
    if (inCart) {
        inCart.qty += qtyToAdd;
    } else {
        cart.push({ ...product, qty: qtyToAdd });
    }
    
    tempQty[id] = 1; // Հետ բերել սկզբնական քանակին
    document.getElementById(`qty-${id}`).innerText = 1;
    
    updateCartCount();
    alert(`${product.name} (${qtyToAdd} հատ) ավելացվեց զամբյուղ`);
}

function updateCartCount() {
    const countEl = document.getElementById("cart-count");
    if (countEl) {
        countEl.innerText = cart.reduce((s, i) => s + i.qty, 0);
    }
}

// Բաժինների փոխում (Կատալոգ / Պատմություն)
function showSection(section) {
    const catalogSec = document.getElementById("catalog-section");
    const historySec = document.getElementById("history-section");
    const title = document.getElementById("page-title");
    
    if (section === 'catalog') {
        catalogSec.style.display = "block";
        historySec.style.display = "none";
        title.innerText = "ԿԱՏԱԼՈԳ";
    } else {
        catalogSec.style.display = "none";
        historySec.style.display = "block";
        title.innerText = "ՊԱՏՎԵՐՆԵՐ";
        renderHistory();
    }
}

// Զամբյուղի ֆունկցիաներ
function openCart() {
    const modal = document.getElementById("cart-modal");
    const container = document.getElementById("cart-items");
    if (!modal || !container) return;

    modal.style.display = "block";
    container.innerHTML = "";

    cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <span>${item.name} (${item.qty} հատ)</span>
            <span>${item.price * item.qty} դրամ</span>
            <button onclick="removeFromCart('${item.id}')">❌</button>
        `;
        container.appendChild(div);
    });

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    document.getElementById("cart-total").innerText = total;
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    openCart();
    updateCartCount();
}

function closeCart() {
    document.getElementById("cart-modal").style.display = "none";
}

// Պատվերի հաստատում
function checkout() {
    if (cart.length === 0) return alert("Զամբյուղը դատարկ է");
    const user = prompt("Պատվիրատուի անունը:");
    if (!user) return;

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const newOrder = {
        id: Date.now(),
        customer: user,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        total: total,
        date: new Date().toLocaleString("hy-AM")
    };

    history.unshift(newOrder);
    localStorage.setItem("orderHistory", JSON.stringify(history));

    cart = [];
    updateCartCount();
    closeCart();
    showSection('history');
}

// Պատմության արտածում
function renderHistory() {
    const list = document.getElementById("history-list");
    if (!list) return;
    list.innerHTML = "";

    history.forEach(order => {
        const div = document.createElement("div");
        div.className = "history-card";
        div.innerHTML = `
            <p><b>${order.customer}</b> - ${order.date}</p>
            <ul>${order.items.map(i => `<li>${i.name} x${i.qty}</li>`).join('')}</ul>
            <p>Գումար: <b>${order.total}</b> դրամ</p>
            <hr>
        `;
        list.appendChild(div);
    });
}

window.onload = () => {
    renderCatalog();
    updateCartCount();
};
