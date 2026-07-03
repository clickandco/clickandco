// ====== INITIAL SEED DATA SYSTEM ======
let heroSlides = [
    { img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80", link: "https://shopee.co.th" },
    { img: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=1200&q=80", link: "" },
    { img: "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=1200&q=80", link: "" }
];

let heroBtnSettings = {
    text: "เก็บโค้ดส่วนลดประจำเดือน",
    link: "https://shopee.co.th"
};

let categories = [
    { id: "cat-1", main: "Gaming", sub: "เม้าส์", brand: "Logitech", order: 1 },
    { id: "cat-2", main: "Gaming", sub: "เม้าส์", brand: "Razer", order: 2 },
    { id: "cat-3", main: "Gaming", sub: "คีย์บอร์ด", brand: "Corsair", order: 3 },
    { id: "cat-4", main: "PlayStation 5", sub: "จอย", brand: "Sony", order: 4 }
];

let products = [
    {
        id: "prod-1",
        name: "Logitech G Pro X Superlight Wireless Gaming Mouse",
        categoryId: "cat-1",
        img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
        price: 4990,
        discountCode: "25%=2500", // 25% สูงสุด 2500 บาท
        keywords: "เม้าส์, wireless, logitech, gpro",
        linkShopee1: "https://shopee.co.th",
        linkShopee2: "https://shopee.co.th",
        linkLazada: "https://lazada.co.th"
    },
    {
        id: "prod-2",
        name: "Razer DeathAdder V3 Pro High-performance",
        categoryId: "cat-2",
        img: "https://images.unsplash.com/photo-1625842268584-8f329043c341?auto=format&fit=crop&w=600&q=80",
        price: 5690,
        discountCode: "10%=500",
        keywords: "เม้าส์, razer, deathadder",
        linkShopee1: "https://shopee.co.th",
        linkShopee2: "",
        linkLazada: "https://lazada.co.th"
    }
];

let isAdmin = false;
let currentSlideIndex = 0;
let activeCategoryFilter = null;

// ====== DOM SELECTION ARRAYS ======
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');
const btnAdminMenu = document.getElementById('btnAdminMenu');
const loginModal = document.getElementById('loginModal');
const btnCloseLogin = document.getElementById('btnCloseLogin');
const adminUser = document.getElementById('adminUser');
const adminPass = document.getElementById('adminPass');
const loginError = document.getElementById('loginError');
const adminStatusText = document.getElementById('adminStatusText');
const adminShortcuts = document.getElementById('adminShortcuts');
const btnLogout = document.getElementById('btnLogout');
const adminPanel = document.getElementById('adminPanel');
const clearFilterBtn = document.getElementById('clearFilterBtn');

// Hero sliders variables
const heroSlider = document.getElementById('heroSlider');
const heroActionBtn = document.getElementById('heroActionBtn');
const slidePrev = document.getElementById('slidePrev');
const slideNext = document.getElementById('slideNext');

// Search and listings
const searchBar = document.getElementById('searchBar');
const sortSelect = document.getElementById('sortSelect');
const productsGrid = document.getElementById('productsGrid');
const categoryNavList = document.getElementById('categoryNavList');

// ====== SYSTEM INITIALIZATION ENGINE ======
document.addEventListener("DOMContentLoaded", () => {
    renderHeroSlider();
    renderStorefrontCategories();
    renderProducts();
    setupAdminControls();
    
    // Primary User Interface triggers
    menuToggle.addEventListener('click', () => sidebar.classList.add('active'));
    sidebarClose.addEventListener('click', () => sidebar.classList.remove('active'));
    
    btnAdminMenu.addEventListener('click', () => { 
        loginModal.classList.add('active'); 
        sidebar.classList.remove('active'); 
    });
    
    btnCloseLogin.addEventListener('click', () => loginModal.classList.remove('active'));
    
    // Core login handler validation via text fields
    [adminUser, adminPass].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') handleLogin();
        });
    });

    btnLogout.addEventListener('click', handleLogout);

    // Event Triggers for Slider
    slidePrev.addEventListener('click', () => shiftSlide(-1));
    slideNext.addEventListener('click', () => shiftSlide(1));

    // Live Query UI filters
    searchBar.addEventListener('input', renderProducts);
    sortSelect.addEventListener('change', renderProducts);
    
    clearFilterBtn.addEventListener('click', () => {
        activeCategoryFilter = null;
        clearFilterBtn.classList.add('hidden');
        renderProducts();
    });
});

// ====== FINANCIAL MATHEMATICS & FORMATTERS ======
function formatCurrency(value) {
    return Math.round(value).toLocaleString('th-TH');
}

// Shopee Math Rule Calculator Logic
function calculateDiscountedPrice(price, discountCode) {
    if (!discountCode || !discountCode.includes('=')) return price;
    try {
        const parts = discountCode.split('=');
        const percent = parseFloat(parts[0].replace('%', ''));
        const maxReduction = parseFloat(parts[1]);
        
        let calculatedReduction = price * (percent / 100);
        if (calculatedReduction > maxReduction) {
            calculatedReduction = maxReduction;
        }
        return Math.max(0, price - calculatedReduction);
    } catch (e) {
        return price;
    }
}

// ====== SECURITY AUTHENTICATION PROCESSOR ======
function handleLogin() {
    if (adminUser.value === 'admin' && adminPass.value === '1234') {
        isAdmin = true;
        loginModal.classList.remove('active');
        adminStatusText.innerHTML = `<i class="fas fa-shield-alt"></i> Mode ผู้ดูแลระบบ`;
        adminShortcuts.classList.remove('hidden');
        adminPanel.classList.remove('hidden');
        
        adminUser.value = ''; adminPass.value = ''; loginError.style.display = 'none';
        
        // Refresh component architectures
        renderProducts();
        renderAdminHeroPanel();
        renderAdminCategoryPanel();
        updateCategoryOptionsForProductForm();
    } else {
        loginError.style.display = 'block';
    }
}

function handleLogout() {
    isAdmin = false;
    adminStatusText.innerText = '';
    adminShortcuts.classList.add('hidden');
    adminPanel.classList.add('hidden');
    renderProducts();
    sidebar.classList.remove('active');
}

// ====== HERO BANNER BANNER SLIDER CONTROLLER ======
function renderHeroSlider() {
    heroSlider.innerHTML = '';
    if(heroSlides.length === 0) {
        heroSlider.innerHTML = `<div class="slide active"><div style="padding:50px; text-align:center; color:#8e8e93;">ไม่มีภาพแบนเนอร์กิจกรรมจัดแสดง</div></div>`;
        return;
    }
    
    heroSlides.forEach((slide, idx) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `slide ${idx === currentSlideIndex ? 'active' : ''}`;
        
        const img = document.createElement('img');
        img.src = slide.img;
        img.alt = `Banner Slide ${idx + 1}`;
        if(slide.link) {
            img.addEventListener('click', () => window.open(slide.link, '_blank'));
        }
        
        slideDiv.appendChild(img);
        heroSlider.appendChild(slideDiv);
    });

    heroActionBtn.innerText = heroBtnSettings.text;
    heroActionBtn.onclick = () => {
        if(heroBtnSettings.link) window.open(heroBtnSettings.link, '_blank');
    };
}

function shiftSlide(direction) {
    if(heroSlides.length <= 1) return;
    currentSlideIndex += direction;
    if (currentSlideIndex >= heroSlides.length) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = heroSlides.length - 1;
    
    const slides = document.querySelectorAll('#heroSlider .slide');
    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === currentSlideIndex);
    });
}

// ====== THE POPUP FIX: STRUCTURAL CATEGORY NAVIGATION SYSTEM ======
function renderStorefrontCategories() {
    categoryNavList.innerHTML = '';
    
    // Construct layered dictionary configurations mapping tree nodes
    const tree = {};
    const sortedCats = [...categories].sort((a,b) => a.order - b.order);
    
    sortedCats.forEach(cat => {
        if (!tree[cat.main]) tree[cat.main] = {};
        if (!tree[cat.main][cat.sub]) tree[cat.main][cat.sub] = [];
        tree[cat.main][cat.sub].push({ brand: cat.brand, id: cat.id });
    });

    // Generate valid explicit DOM layout structures
    Object.keys(tree).forEach(mainKey => {
        const itemElement = document.createElement('div');
        itemElement.className = 'category-item';
        // เปลี่ยนลูกศรให้แสดงมิติที่ชัดเจน
        itemElement.innerHTML = `<span>${mainKey}</span> <i class="fas fa-chevron-down toggle-arrow"></i>`;
        
        // Modal level popup list instantiation
        const popupElement = document.createElement('div');
        popupElement.className = 'category-popup';
        
        Object.keys(tree[mainKey]).forEach(subKey => {
            const heading = document.createElement('div');
            heading.className = 'sub-cat-title';
            heading.innerText = subKey;
            popupElement.appendChild(heading);
            
            tree[mainKey][subKey].forEach(brandNode => {
                const link = document.createElement('a');
                link.href = '#';
                link.className = 'brand-item-link';
                link.innerText = brandNode.brand;
                
                // CRITICAL FIX: Intercept default trigger behaviors and filter data accurately
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Halt bubbling leaks
                    filterByCategoryId(brandNode.id);
                    // ปิด Popup หลังจากเลือกเสร็จ
                    popupElement.classList.remove('show-popup');
                });
                popupElement.appendChild(link);
            });
        });
        
        itemElement.appendChild(popupElement);
        
        // แก้ไข Event: เมื่อกดที่หมวดหมู่หลัก จะเด้งเปิด/ปิด Popup ยี่ห้อและแบรนด์
        itemElement.addEventListener('click', (e) => {
            e.stopPropagation();
            // ปิด popup ตัวอื่นก่อนเปิดตัวที่เลือก
            document.querySelectorAll('.category-popup').forEach(pop => {
                if(pop !== popupElement) pop.classList.remove('show-popup');
            });
            popupElement.classList.toggle('show-popup');
        });
        
        categoryNavList.appendChild(itemElement);
    });

    // ปิด Popup ทุกตัวเมื่อกดพื้นที่อื่นบนหน้าจอ
    document.addEventListener('click', () => {
        document.querySelectorAll('.category-popup').forEach(pop => pop.classList.remove('show-popup'));
    });
}

function filterByCategoryId(catId) {
    activeCategoryFilter = catId;
    clearFilterBtn.classList.remove('hidden');
    
    const selectedCat = categories.find(c => c.id === catId);
    if(selectedCat) {
        clearFilterBtn.innerText = `ล้างกรอง: ${selectedCat.main} > ${selectedCat.brand}`;
    }
    renderProducts();
}

// ====== STOREFRONT PRODUCTS GRID CONTROLLER ======
function renderProducts() {
    productsGrid.innerHTML = '';
    let filtered = [...products];
    const searchVal = searchBar.value.toLowerCase().trim();
    
    if (activeCategoryFilter) {
        filtered = filtered.filter(p => p.categoryId === activeCategoryFilter);
    }
    
    if (searchVal !== '') {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchVal) || 
            (p.keywords && p.keywords.toLowerCase().includes(searchVal))
        );
    }

    // Dynamic sorting system arrays rules
    const sortVal = sortSelect.value;
    if (sortVal === 'price-asc') {
        filtered.sort((a,b) => calculateDiscountedPrice(a.price, a.discountCode) - calculateDiscountedPrice(b.price, b.discountCode));
    } else if (sortVal === 'price-desc') {
        filtered.sort((a,b) => calculateDiscountedPrice(b.price, b.discountCode) - calculateDiscountedPrice(a.price, a.discountCode));
    } else if (sortVal === 'latest' && isAdmin) {
        // Drag manual reordering is enabled in Admin mode
    }

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<p style="padding:40px; grid-column:1/-1; text-align:center; color:#8e8e93; font-weight:500;">ไม่มีรายการสินค้าจัดแสดงในเงื่อนไขนี้</p>`;
        return;
    }

    filtered.forEach((prod) => {
        const finalPrice = calculateDiscountedPrice(prod.price, prod.discountCode);
        const card = document.createElement('div');
        card.className = 'product-card glass-card';
        
        if (isAdmin && sortSelect.value === 'latest') {
            card.draggable = true;
            card.dataset.id = prod.id;
            setupDragAndDropProductEvents(card);
        }

        let adminActionsHtml = '';
        if (isAdmin) {
            adminActionsHtml = `
                <div class="admin-card-actions">
                    <button class="btn-card-edit" onclick="initiateProductEdit('${prod.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-card-delete" onclick="deleteProduct('${prod.id}')"><i class="fas fa-trash"></i></button>
                </div>
            `;
        }

        let shopeeBtnHtml = '';
        if (prod.linkShopee1 && prod.linkShopee2) {
            shopeeBtnHtml = `
                <a href="${prod.linkShopee1}" target="_blank" class="btn-aff btn-shopee"><i class="fas fa-shopping-bag"></i> Shopee 1</a>
                <a href="${prod.linkShopee2}" target="_blank" class="btn-aff btn-shopee"><i class="fas fa-shopping-bag"></i> Shopee 2</a>
            `;
        } else if (prod.linkShopee1 || prod.linkShopee2) {
            const targetLink = prod.linkShopee1 || prod.linkShopee2;
            shopeeBtnHtml = `<a href="${targetLink}" target="_blank" class="btn-aff btn-shopee"><i class="fas fa-shopping-bag"></i> Shopee</a>`;
        }

        let lazadaBtnHtml = '';
        if (prod.linkLazada) {
            lazadaBtnHtml = `<a href="${prod.linkLazada}" target="_blank" class="btn-aff btn-lazada"><i class="fas fa-shopping-cart"></i> Lazada</a>`;
        }

        card.innerHTML = `
            ${adminActionsHtml}
            <div class="product-img-wrapper">
                <img src="${prod.img}" alt="${prod.name}" onclick="if('${prod.linkShopee1}' !== '') window.open('${prod.linkShopee1}', '_blank')">
            </div>
            <div class="product-info">
                <div class="product-name">${prod.name}</div>
                <div class="price-container">
                    ${prod.discountCode ? `<div class="original-price">฿${formatCurrency(prod.price)}</div>` : ''}
                    <div class="current-price">฿${formatCurrency(finalPrice)}</div>
                </div>
                <div class="affiliate-buttons">
                    ${shopeeBtnHtml}
                    ${lazadaBtnHtml}
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// ====== CONTROL OPERATIONS PANEL (ADMIN FUNCTIONALITIES) ======
function setupAdminControls() {
    // (1) Save configuration properties of slider
    document.getElementById('btnSaveHeroSettings').addEventListener('click', () => {
        for(let i=0; i<5; i++) {
            const imgVal = document.getElementById(`heroImg_${i}`).value.trim();
            const linkVal = document.getElementById(`heroLink_${i}`).value.trim();
            
            if(imgVal !== '') {
                heroSlides[i] = { img: imgVal, link: linkVal };
            } else if (heroSlides[i]) {
                heroSlides.splice(i, 1);
            }
        }
        heroBtnSettings.text = document.getElementById('adminHeroBtnText').value;
        heroBtnSettings.link = document.getElementById('adminHeroBtnLink').value;
        
        currentSlideIndex = 0;
        renderHeroSlider();
        alert('บันทึกการตั้งค่าแบนเนอร์สำเร็จ!');
    });

    // (2) Save/Edit Action form data processor mapping systems
    document.getElementById('productForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editProductId').value;
        
        const data = {
            name: document.getElementById('prodName').value,
            categoryId: document.getElementById('prodCategorySelect').value,
            img: document.getElementById('prodImg').value,
            price: parseFloat(document.getElementById('prodPrice').value),
            discountCode: document.getElementById('prodDiscountCode').value,
            keywords: document.getElementById('prodKeywords').value,
            linkShopee1: document.getElementById('linkShopee1').value,
            linkShopee2: document.getElementById('linkShopee2').value,
            linkLazada: document.getElementById('linkLazada').value
        };

        if(editId) {
            const targetIdx = products.findIndex(p => p.id === editId);
            products[targetIdx] = { id: editId, ...data };
            alert('แก้ไขสินค้าชิ้นนี้เสร็จสมบูรณ์');
        } else {
            const newProd = { id: 'prod-' + Date.now(), ...data };
            products.push(newProd);
            alert('เพิ่มสินค้าใหม่เข้าระบบสำเร็จ');
        }

        resetProductForm();
        renderProducts();
    });

    document.getElementById('btnProductCancel').addEventListener('click', resetProductForm);

    // (3) Layered category creation parameters engine
    document.getElementById('btnAddCategory').addEventListener('click', () => {
        const main = document.getElementById('catMain').value.trim();
        const sub = document.getElementById('catSub').value.trim();
        const brand = document.getElementById('catBrand').value.trim();

        if(!main || !sub || !brand) {
            alert('กรุณากรอกมิติโครงสร้างสาขาย่อยของหมวดหมู่ให้ครบถ้วน');
            return;
        }

        const newCat = {
            id: 'cat-' + Date.now(), main, sub, brand,
            order: categories.length + 1
        };
        categories.push(newCat);
        
        document.getElementById('catMain').value = '';
        document.getElementById('catSub').value = '';
        document.getElementById('catBrand').value = '';

        renderStorefrontCategories();
        renderAdminCategoryPanel();
        updateCategoryOptionsForProductForm();
    });
}

function renderAdminHeroPanel() {
    const tbody = document.getElementById('adminHeroTableBody');
    tbody.innerHTML = '';
    
    for(let i=0; i<5; i++) {
        const slide = heroSlides[i] || { img: '', link: '' };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i+1}</td>
            <td><input type="text" id="heroImg_${i}" value="${slide.img}" placeholder="วางลิงค์รูปภาพ..."></td>
            <td><input type="text" id="heroLink_${i}" value="${slide.link}" placeholder="วางลิงค์ปลายทางสินค้า..."></td>
            <td>${slide.img ? `<button class="btn-cat-del" onclick="clearHeroRow(${i})">เคลียร์</button>` : '<span style="color:#8e8e93">ว่าง</span>'}</td>
        `;
        tbody.appendChild(tr);
    }
    document.getElementById('adminHeroBtnText').value = heroBtnSettings.text;
    document.getElementById('adminHeroBtnLink').value = heroBtnSettings.link;
}

window.clearHeroRow = function(idx) {
    document.getElementById(`heroImg_${idx}`).value = '';
    document.getElementById(`heroLink_${idx}`).value = '';
};

window.initiateProductEdit = function(id) {
    const prod = products.find(p => p.id === id);
    if(!prod) return;

    document.getElementById('productFormTitle').innerText = "(2) ระบบแก้ไขข้อมูลสินค้า";
    document.getElementById('editProductId').value = prod.id;
    document.getElementById('prodName').value = prod.name;
    document.getElementById('prodCategorySelect').value = prod.categoryId;
    document.getElementById('prodImg').value = prod.img;
    document.getElementById('prodPrice').value = prod.price;
    document.getElementById('prodDiscountCode').value = prod.discountCode || '';
    document.getElementById('prodKeywords').value = prod.keywords || '';
    document.getElementById('linkShopee1').value = prod.linkShopee1 || '';
    document.getElementById('linkShopee2').value = prod.linkShopee2 || '';
    document.getElementById('linkLazada').value = prod.linkLazada || '';

    document.getElementById('btnProductSubmit').innerText = "บันทึกการแก้ไขข้อมูล";
    document.getElementById('btnProductCancel').classList.remove('hidden');
    
    document.getElementById('admin-product-section').scrollIntoView();
};

function resetProductForm() {
    document.getElementById('productFormTitle').innerText = "(2) ระบบเพิ่มสินค้า";
    document.getElementById('editProductId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('btnProductSubmit').innerText = "เพิ่มสินค้า";
    document.getElementById('btnProductCancel').classList.add('hidden');
}

window.deleteProduct = function(id) {
    if(confirm('คุณต้องการลบข้อมูลผลิตภัณฑ์ชิ้นนี้ใช่หรือไม่?')) {
        products = products.filter(p => p.id !== id);
        renderProducts();
    }
};

function updateCategoryOptionsForProductForm() {
    const select = document.getElementById('prodCategorySelect');
    select.innerHTML = '';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.innerText = `${cat.main} > ${cat.sub} > ${cat.brand}`;
        select.appendChild(opt);
    });
}

function renderAdminCategoryPanel() {
    const container = document.getElementById('adminCatListContainer');
    container.innerHTML = '';
    const sorted = [...categories].sort((a,b) => a.order - b.order);

    sorted.forEach((cat, index) => {
        const div = document.createElement('div');
        div.className = 'admin-cat-item';
        div.innerHTML = `
            <span>${cat.main} &gt; ${cat.sub} &gt; ${cat.brand}</span>
            <div class="cat-item-controls">
                <button class="btn-arrow" onclick="moveCategory(${index}, -1)"><i class="fas fa-arrow-up"></i></button>
                <button class="btn-arrow" onclick="moveCategory(${index}, 1)"><i class="fas fa-arrow-down"></i></button>
                <button class="btn-cat-del" onclick="deleteCategory('${cat.id}')">ลบ</button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.moveCategory = function(index, direction) {
    const sorted = [...categories].sort((a,b) => a.order - b.order);
    const targetIdx = index + direction;
    if(targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap position indices parameters keys
    const temp = sorted[index].order;
    sorted[index].order = sorted[targetIdx].order;
    sorted[targetIdx].order = temp;

    renderStorefrontCategories();
    renderAdminCategoryPanel();
};

window.deleteCategory = function(id) {
    if(confirm('ยืนยันลบหมวดหมู่นี้? ผลิตภัณฑ์ภายใต้เงื่อนไขโครงสร้างนี้จะไม่แสดงผลบนตัวกรองหน้าแรก')) {
        categories = categories.filter(c => c.id !== id);
        renderStorefrontCategories();
        renderAdminCategoryPanel();
        updateCategoryOptionsForProductForm();
    }
};

// ====== MANUAL PRODUCT DRAG SORTING ENGINE ======
let dragSrcEl = null;
function setupDragAndDropProductEvents(card) {
    card.addEventListener('dragstart', function(e) {
        dragSrcEl = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragover', function(e) {
        if (e.preventDefault) e.preventDefault();
        return false;
    });
    card.addEventListener('drop', function(e) {
        if (e.stopPropagation) e.stopPropagation();
        
        if (dragSrcEl !== this) {
            const srcId = dragSrcEl.dataset.id;
            const targetId = this.dataset.id;
            
            const srcIdx = products.findIndex(p => p.id === srcId);
            const targetIdx = products.findIndex(p => p.id === targetId);
            
            // Perform splice operation manipulation to shuffle array data ordering keys
            const temp = products[srcIdx];
            products.splice(srcIdx, 1);
            products.splice(targetIdx, 0, temp);
            
            renderProducts();
        }
        return false;
    });
    card.addEventListener('dragend', function() {
        this.classList.remove('dragging');
    });
}