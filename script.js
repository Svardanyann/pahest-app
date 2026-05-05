const products = [
    { id: "1", name: "ՊԱՄԻՆԱԿ ՏՈՒՓՈՎ", price: 5500, img: "images/paminak_tup.jpg" },
    { id: "2", name: "ՆԱՐԻՆԱԿ", price: 4800, img: "images/narinak.jpg" },
    { id: "3", name: "ՊԱՄԻՆԱԿ 1", price: 3500, img: "images/paminak1.jpg" }
    // Ավելացրու մնացածը այստեղ
];

let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let cart = JSON.parse(localStorage.getItem("activeCart")) || [];

function renderCatalog() {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;
    grid.innerHTML = "";

    products.forEach(p => {
        const cartItem = cart.find(item => item.id === p.id);
        const currentQty = cartItem ? cartItem.qty : 0;

        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <div class="product-img-container">
                <img src="${p.img}" alt="${p.name}">
            </div>
            <h3>${p.name}</h3>
            <p>${p.price} դրամ</p>
            
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateCart('${p.id}', -1)">-</button>
                <span class="qty-num" id="qty-${p.id}">${currentQty}</span>
                <button class="qty-btn" onclick="updateCart('${p.id}', 1)">+</button>
            </div>
        `;
        grid.appendChild(div);
    });
}

function updateCart(id, delta) {
    const product = products.find(p => p.id === id);
    const cartItem = cart.find(item => item.id === id);

    if (cartItem) {
        cartItem.qty += delta;
        if (cartItem.qty <= 0) {
            cart = cart.filter(item => item.id !== id);
        }
    } else if (delta > 0) {
        cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem("activeCart", JSON.stringify(cart));
    updateCartCount();
    
    // Թարմացնել միայն տվյալ ապրանքի թիվը էկրանին
    const qtySpan = document.getElementById(`qty-${id}`);
    const updatedItem = cart.find(item => item.id === id);
    if (qtySpan) qtySpan.innerText = updatedItem ? updatedItem.qty : 0;
}

function updateCartCount() {
    const countEl = document.getElementById("cart-count");
    if (countEl) {
        countEl.innerText = cart.reduce((s, i) => s + i.qty, 0);
    }
}

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

function openCart() {
    const modal = document.getElementById("cart-modal");
    const container = document.getElementById("cart-items");
    modal.style.display = "block";
    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = "<p>Զամբյուղը դատարկ է</p>";
    }

    cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.padding = "5px 0";
        div.innerHTML = `
            <span>${item.name} (${item.qty} հատ)</span>
            <span>${item.price * item.qty} դրամ</span>
        `;
        container.appendChild(div);
    });

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    document.getElementById("cart-total").innerText = total;
}

function closeCart() {
    document.getElementById("cart-modal").style.display = "none";
}

function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    if (history.length === 0) {
        list.innerHTML = "<p>Պատմությունը դատարկ է</p>";
        return;
    }
    history.forEach(order => {
        const div = document.createElement("div");
        div.className = "history-card";
        div.style.border = "1px solid #ddd";
        div.style.padding = "10px";
        div.style.margin = "10px 0";
        div.style.borderRadius = "8px";
        div.innerHTML = `
            <p><b>${order.customer}</b> - ${order.date}</p>
            <ul>${order.items.map(i => `<li>${i.name} x${i.qty}</li>`).join('')}</ul>
            <p>Ընդհանուր: <b>${order.total}</b> դրամ</p>
        `;
        list.appendChild(div);
    });
}

window.onload = () => {
    renderCatalog();
    updateCartCount();
};
