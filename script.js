// 1. ԱՊՐԱՆՔՆԵՐԻ ՑՈՒՑԱԿԸ (Ավելացրու քո բոլոր ապրանքները այստեղ)
// Համոզվիր, որ img դաշտում գրված անունը տառ առ տառ համընկնում է GitHub-ի նկարի անվան հետ
const products = [
    { 
        id: "1", 
        name: "ՊԱՄԻՆԱԿ ՏՈՒՓՈՎ", 
        price: 5500, 
        img: "images/paminak.png" 
    },
    { 
        id: "2", 
        name: "ՆԱՐԻՆԱԿ", 
        price: 4800, 
        img: "images/narinak.jpg"
    },
    { 
        id: "3", 
        name: "ՊԱՄԻՆԱԿ 1", 
        price: 3500, 
        img: "images/paminak2.jpg"
    }
];

// Փոփոխականներ
let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let cart = [];

// Էկրանին ցուցադրելու ֆունկցիա
function renderCatalog() {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;
    grid.innerHTML = "";

    products.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <img src="${p.img}" alt="${p.name}" style="width:100%; border-radius:8px;">
            <h3>${p.name}</h3>
            <p>${p.price} դրամ</p>
            <button onclick="addToCart('${p.id}')">Ավելացնել</button>
        `;
        grid.appendChild(div);
    });
}

// Զամբյուղի ֆունկցիաներ
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const inCart = cart.find(item => item.id === id);

    if (inCart) {
        inCart.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartCount();
    alert(product.name + " ավելացվեց զամբյուղ");
}

function updateCartCount() {
    const countEl = document.getElementById("cart-count");
    if (countEl) {
        countEl.innerText = cart.reduce((s, i) => s + i.qty, 0);
    }
}

function openCart() {
    const modal = document.getElementById("cart-modal");
    const container = document.getElementById("cart-items");
    if (!modal || !container) return;
    
    modal.style.display = "block";
    container.innerHTML = "";

    cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.marginBottom = "10px";
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

// ՊԱՏՎԵՐԻ ՀԱՍՏԱՏՈՒՄ (Առանց նկարների, որ localStorage-ը չլցվի)
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

// Բաժինների փոփոխություն (Կատալոգ / Պատմություն)
function showSection(section) {
    const catalogSec = document.getElementById("catalog-section");
    const historySec = document.getElementById("history-section");
    
    if (section === 'catalog') {
        catalogSec.style.display = "block";
        historySec.style.display = "none";
    } else {
        catalogSec.style.display = "none";
        historySec.style.display = "block";
        renderHistory();
    }
}

function renderHistory() {
    const list = document.getElementById("history-list");
    if (!list) return;
    list.innerHTML = "<h2>Պատվերների պատմություն</h2>";

    if (history.length === 0) {
        list.innerHTML += "<p>Պատմությունը դատարկ է</p>";
        return;
    }

    history.forEach(order => {
        const div = document.createElement("div");
        div.className = "history-card";
        div.style.border = "1px solid #ccc";
        div.style.padding = "10px";
        div.style.marginBottom = "10px";
        div.style.borderRadius = "8px";
        div.innerHTML = `
            <p><b>${order.customer}</b> - ${order.date}</p>
            <ul>${order.items.map(i => `<li>${i.name} x${i.qty} - ${i.price * i.qty} դրամ</li>`).join('')}</ul>
            <p>Ընդհանուր գումար: <b>${order.total}</b> դրամ</p>
        `;
        list.appendChild(div);
    });
}

// Սկզբնական բեռնում
window.onload = () => {
    renderCatalog();
    updateCartCount();
};
