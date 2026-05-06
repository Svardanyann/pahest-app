// GitHub-ի images թղթապանակի հասցեն (եթե օգտագործում ես)
const imgPath = "images/"; 

// Ապրանքների ցուցակը (Կարող ես ավելացնել ձեռքով կամ Modal-ով)
let products = JSON.parse(localStorage.getItem("myProducts")) || [
    { id: 1, name: "Paminak", price: 100, img: "paminak.jpg" },
    { id: 2, name: "Paminak 1", price: 120, img: "paminak1.jpg" }
];

let history = JSON.parse(localStorage.getItem("orderHistory")) || [];
let tempOrderQty = {}; // Ժամանակավոր քանակները պահելու համար

function showSection(section) {
    document.getElementById("catalog-section").classList.toggle("hidden", section !== "catalog");
    document.getElementById("history-section").classList.toggle("hidden", section !== "history");
    if (section === "history") renderHistory();
}

function renderCatalog() {
    const list = document.getElementById("product-list");
    list.innerHTML = "";
    
    products.forEach((p) => {
        if (!tempOrderQty[p.id]) tempOrderQty[p.id] = 1;

        list.innerHTML += `
            <div class="bg-white p-2 rounded-lg shadow border border-gray-100 flex flex-col justify-between">
                <div>
                    <div class="img-container">
                        <img src="${p.img.includes('http') ? p.img : imgPath + p.img}" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                    </div>
                    <div class="font-bold text-sm mt-2">${p.name}</div>
                    <div class="text-blue-600 font-bold">${p.price} ֏</div>
                </div>
                
                <div class="mt-3">
                    <div class="flex items-center justify-between mb-2 bg-gray-50 rounded-lg p-1">
                        <button onclick="changeQty(${p.id}, -1)" class="qty-btn">-</button>
                        <span class="qty-input" id="qty-${p.id}">${tempOrderQty[p.id]}</span>
                        <button onclick="changeQty(${p.id}, 1)" class="qty-btn plus">+</button>
                    </div>
                    <button onclick="confirmOrder(${p.id})" class="w-full bg-green-600 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
                        Գրանցել Պատվեր
                    </button>
                </div>
            </div>
        `;
    });
}

function changeQty(id, delta) {
    if (!tempOrderQty[id]) tempOrderQty[id] = 1;
    tempOrderQty[id] += delta;
    if (tempOrderQty[id] < 1) tempOrderQty[id] = 1;
    document.getElementById(`qty-${id}`).innerText = tempOrderQty[id];
}

function confirmOrder(id) {
    const p = products.find(prod => prod.id === id);
    const qty = tempOrderQty[id];
    
    const order = {
        id: Date.now(),
        text: p.name + " (x" + qty + ")",
        total: p.price * qty,
        date: new Date().toLocaleString("hy-AM"),
    };

    history.unshift(order);
    localStorage.setItem("orderHistory", JSON.stringify(history));
    
    // Հետ բերել 1-ի
    tempOrderQty[id] = 1;
    renderCatalog();
    alert("Պատվերը գրանցվեց!");
}

// Modal-ի ֆունկցիաները (Ավելացնել ապրանք)
function openModal() { document.getElementById("modal").classList.remove("hidden"); }
function closeModal() { document.getElementById("modal").classList.add("hidden"); }

function addProduct() {
    const name = document.getElementById("prod-name").value;
    const price = document.getElementById("prod-price").value;
    const img = document.getElementById("prod-img").value || "no-image.jpg";

    if (name && price) {
        products.push({ id: Date.now(), name, price, img });
        localStorage.setItem("myProducts", JSON.stringify(products));
        renderCatalog();
        closeModal();
    }
}

function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = history.length === 0 ? '<p class="text-center text-gray-400">Դեռ պատվերներ չկան</p>' : "";
    history.forEach((h) => {
        list.innerHTML += `
            <div class="bg-white p-3 rounded shadow-sm border-l-4 border-green-500">
                <div class="flex justify-between font-bold">
                    <span>${h.text}</span>
                    <span class="text-green-600">${h.total} ֏</span>
                </div>
                <div class="text-[10px] text-gray-400 italic">${h.date}</div>
            </div>
        `;
    });
}

// Սկզբնական բեռնում
window.onload = renderCatalog;
