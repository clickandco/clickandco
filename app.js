// ==========================================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    addDoc, 
    deleteDoc, 
    updateDoc, 
    query, 
    orderBy,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🌟 1. เพิ่มโค้ด 5 บรรทัดนี้เพื่อดึงระบบ Auth เข้ามาใช้งาน
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDyxAYfD8OKX2SCzPhLyPxjTrTtphTKeuA",
  authDomain: "clickandco-9d7fd.firebaseapp.com",
  projectId: "clickandco-9d7fd",
  storageBucket: "clickandco-9d7fd.firebasestorage.app",
  messagingSenderId: "616249001235",
  appId: "1:616249001235:web:40d5d3b40b7a962373c6e6",
  measurementId: "G-DF8S045YY9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🌟 2. เพิ่มบรรทัดนี้เพื่อสร้างตัวแปร auth ให้ระบบรู้จัก
const auth = getAuth(app);

const productsCollection = collection(db, "products");
const statsCollection = collection(db, "stats");
const categoriesCollection = collection(db, "categories");

/* ==========================================================================
   SECTION 1: APPLICATION DATA STATE (ข้อมูลเริ่มต้นและการเชื่อมต่อ Firebase / LocalStorage)
   ========================================================================== */

let products = [];
let categories = {
    main: ["คีย์บอร์ด", "เมาส์"],
    sub: ["คีย์บอร์ด Magnetic", "Wireless Mouse"],
    brand: ["TickType", "Logitech"]
};

let currentFilterCategory = "ทั้งหมด";
let adminLoggedIn = JSON.parse(sessionStorage.getItem('6ickboy_admin_logged')) || false;
let stats = {};

// ฟังก์ชันดึงข้อมูลสินค้าทั้งหมดจาก Firestore
async function loadProducts() {
    try {
        const q = query(productsCollection, orderBy("sortOrder", "asc"));
        const querySnapshot = await getDocs(q);
        
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // ❌ ลบหรือคอมเมนต์บล็อกนี้ออก เพื่อไม่ให้สินค้าเริ่มต้นเด้งกลับมาตอนฐานข้อมูลว่างเปล่า
        /* 
        if (products.length === 0) {
            await initializeDefaultProducts();
        } else {
            renderSidebar();
            renderProducts();
        }
        */

        // ✅ เปลี่ยนมาใช้คำสั่งเรนเดอร์หน้าจอโดยตรงแทน (แม้จะไม่มีสินค้าเหลืออยู่ก็ตาม)
        renderSidebar();
        renderProducts();

    } catch (error) {
        console.error("Error loading products from Firestore: ", error);
        // Fallback หาก Firebase ติดปัญหา ให้ใช้ LocalStorage สำรอง
        products = JSON.parse(localStorage.getItem('6ickboy_products')) || [];
        renderSidebar();
        renderProducts();
    }
}

// ฟังก์ชันดึงข้อมูลหมวดหมู่จาก Firestore
async function loadCategories() {
    try {
        const querySnapshot = await getDocs(categoriesCollection);
        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                categories[doc.id] = doc.data().items || [];
            });
        } else {
            // ถ้าไม่มีข้อมูลใน Firestore ให้เซ็ตค่าเริ่มต้นขึ้นไป
            await setDoc(doc(db, "categories", "main"), { items: categories.main });
            await setDoc(doc(db, "categories", "sub"), { items: categories.sub });
            await setDoc(doc(db, "categories", "brand"), { items: categories.brand });
        }
    } catch (error) {
        console.error("Error loading categories: ", error);
    }
}

// ฟังก์ชันสร้างสินค้าเริ่มต้นหากใน Database ว่างเปล่า
async function initializeDefaultProducts() {
    let defaultProducts = [
        {
            name: "TickType 61 Pro Neo",
            mainCat: "คีย์บอร์ด",
            subCat: "คีย์บอร์ด Magnetic",
            brand: "TickType",
            mainImg: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
            images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500", "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500"],
            price: 3590,
            discountCode: "25%=2000",
            desc: "คีย์บอร์ดสวิตช์แม่เหล็กตอบสนองไวที่สุด เหมาะสำหรับการเล่นเกม Esport ทุกประเภท",
            keywords: "keyboard, magnetic, คีย์บอร์ด",
            orderLink: "https://google.com",
            isMall: true,
            isComingSoon: false,
            isNew: true,
            isHot: true,
            sortOrder: 0
        },
        {
            name: "Superlight Ultra X",
            mainCat: "เมาส์",
            subCat: "Wireless Mouse",
            brand: "Logitech",
            mainImg: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500",
            images: ["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500"],
            price: 4990,
            discountCode: "",
            desc: "เมาส์ไร้สายน้ำหนักเบาพิเศษ เซนเซอร์แม่นยำระดับมือโปร",
            keywords: "mouse, wireless, เมาส์",
            orderLink: "https://google.com",
            isMall: false,
            isComingSoon: false,
            isNew: false,
            isHot: true,
            sortOrder: 1
        }
    ];

    for (let p of defaultProducts) {
        await addDoc(productsCollection, p);
    }
    await loadProducts();
}

// ฟังก์ชันดึงข้อมูลสถิติ
async function loadStats() {
    let todayKey = getTodayKey();
    try {
        const docRef = doc(db, "stats", todayKey);
        const docSnap = await getDocs(query(statsCollection));
        
        // ดึงสถิติต่างๆ ลงมาเก็บใน Local state
        docSnap.forEach(d => {
            stats[d.id] = d.data();
        });

        if (!stats[todayKey]) {
            stats[todayKey] = { views: 0, clicks: {} };
        }
        
        // เพิ่มยอด View ทันทีเมื่อเข้าเว็บ (เพิ่มทั้งบน Cloud และ Local)
        stats[todayKey].views = (stats[todayKey].views || 0) + 1;
        await setDoc(doc(db, "stats", todayKey), stats[todayKey], { merge: true });
        localStorage.setItem('6ickboy_stats', JSON.stringify(stats));
    } catch (e) {
        console.error("Error loading stats: ", e);
    }
}

// บันทึกสำรองลง LocalStorage เผื่อกรณีฉุกเฉิน
function saveDataBackup() {
    localStorage.setItem('6ickboy_products', JSON.stringify(products));
    localStorage.setItem('6ickboy_stats', JSON.stringify(stats));
}

// เรียกใช้งานตอนโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", async () => {
    await loadCategories();
    await loadProducts();
    await loadStats();
});

/* ==========================================================================
   SECTION 2: HELPER FUNCTIONS (ฟังก์ชันสนับสนุนหลัก เช่น ปัดเศษส่วนลด)
   ========================================================================== */

function formatMoney(amount) {
    let number = Math.floor(Number(amount));
    if (isNaN(number)) return "0";
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculateDiscountedPrice(price, code) {
    if (!code || !code.includes('=')) return price;
    try {
        let parts = code.split('=');
        let pct = parseFloat(parts[0].replace('%', ''));
        let maxCap = parseFloat(parts[1]);
        
        let calculatedDiscount = (price * pct) / 100;
        if (calculatedDiscount > maxCap) {
            calculatedDiscount = maxCap;
        }
        let finalPrice = price - calculatedDiscount;
        return Math.max(0, Math.floor(finalPrice));
    } catch (e) {
        return price;
    }
}

/* ==========================================================================
   SECTION 3: WEB UI RENDERING (PC / MOBILE)
   ========================================================================== */

function renderSidebar() {
    const container = document.getElementById('categoryListContainer');
    if (!container) return;
    
    let html = `<li class="category-item ${currentFilterCategory === 'ทั้งหมด' ? 'active' : ''}" data-cat="ทั้งหมด">
                    <span>ทั้งหมด</span>
                    <span class="category-count">${products.length}</span>
                </li>`;
                
    categories.main.forEach(mainCat => {
        let count = products.filter(p => p.mainCat === mainCat).length;
        html += `<li class="category-item ${currentFilterCategory === mainCat ? 'active' : ''}" data-cat="${mainCat}">
                    <span>${mainCat}</span>
                    <span class="category-count">${count}</span>
                 </li>`;
    });
    container.innerHTML = html;

    document.querySelectorAll('.category-item').forEach(item => {
        item.replaceWith(item.cloneNode(true)); // ล้าง Event Listener เก่าป้องกัน Memory Leak
    });

    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            currentFilterCategory = this.getAttribute('data-cat');
            renderSidebar();
            if (currentFilterCategory !== "ทั้งหมด") {
                openSubCatPopup(currentFilterCategory);
            } else {
                renderProducts();
            }
        });
    });
}

function renderProducts(customProductsList = null) {
    const container = document.getElementById('productsGridContainer');
    if (!container) return;
    
    let sourceList = customProductsList || [...products];
    
    if (!customProductsList && currentFilterCategory !== "ทั้งหมด") {
        sourceList = sourceList.filter(p => p.mainCat === currentFilterCategory);
    }

    container.innerHTML = "";
    
    if (sourceList.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#aaa;">ไม่มีสินค้าแสดงในส่วนนี้</div>`;
        return;
    }

    sourceList.forEach((prod) => {
        let displayPrice = calculateDiscountedPrice(prod.price, prod.discountCode);
        
        let badgeHtml = '';
        if (prod.isComingSoon) badgeHtml += `<span class="badge-cs">Coming Soon...</span>`;
        if (prod.isNew) badgeHtml += `<span class="badge-new">NEW</span>`;
        if (prod.isHot) badgeHtml += `<span class="badge-hot">HOT</span>`;

        let adminActionsHtml = '';
        if (adminLoggedIn) {
            adminActionsHtml = `
                <div class="admin-actions-trigger">
                    <button class="btn-action-sm edit-p" data-id="${prod.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action-sm delete-p" data-id="${prod.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        }

        let card = document.createElement('div');
        card.className = "product-card";
        card.setAttribute('data-id', prod.id);
        card.innerHTML = `
            ${adminActionsHtml}
            <div class="product-img-holder">
                <div class="badge-container">
                    ${badgeHtml}
                </div>
                <img src="${prod.mainImg}" alt="${prod.name}">
            </div>
            <div>
                <div class="product-title">
                    ${prod.isMall ? '<span class="mall-prefix">MALL</span>' : ''}${prod.name}
                </div>
                <div class="product-meta">${prod.mainCat} > ${prod.subCat} > ${prod.brand}</div>
                <div class="product-price">${formatMoney(displayPrice)} บาท</div>
            </div>
            ${prod.isComingSoon ? '<button class="order-btn" disabled style="opacity:0.6;">เร็วๆ นี้</button>' : `<a href="${prod.orderLink}" class="order-btn order-click-track" data-id="${prod.id}" target="_blank">สั่งซื้อ</a>`}
        `;
        
        // แตะส่วนอื่นของ Card เพื่อเปิดดูรายละเอียดสินค้า
        card.addEventListener('click', (e) => {
            if (e.target.closest('.order-btn') || e.target.closest('.admin-actions-trigger') || e.target.closest('a')) return;
            openProductDetailPopup(prod.id);
        });

        // ดักจับ Event สำหรับ Admin (แก้ไข/ลบ) โดยตรงที่ระดับ Element ของ Card
        if (adminLoggedIn) {
            const editBtn = card.querySelector('.edit-p');
            const deleteBtn = card.querySelector('.delete-p');

            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // ป้องกันไม่ให้ทะลุไปโดน Click Event ของแผ่น Card
                    populateFormDropdowns();
                    document.getElementById('editProductId').value = prod.id;
                    document.getElementById('formProdName').value = prod.name || "";
                    document.getElementById('formMainImg').value = prod.mainImg.includes("No+Image") ? "" : prod.mainImg;
                    document.getElementById('formNormalPrice').value = prod.price || "";
                    document.getElementById('formDiscountCode').value = prod.discountCode || "";
                    document.getElementById('formProdDesc').value = prod.desc || "";
                    document.getElementById('formKeywords').value = prod.keywords || "";
                    document.getElementById('formOrderLink').value = prod.orderLink || "";
                    document.getElementById('formMall').checked = !!prod.isMall;
                    document.getElementById('formComingSoon').checked = !!prod.isComingSoon;
                    document.getElementById('formNew').checked = !!prod.isNew;
                    document.getElementById('formHot').checked = !!prod.isHot;
                    
                    for(let i = 1; i <= 8; i++) {
                        let targetInput = document.getElementById(`formThumbUrl${i}`);
                        if (targetInput) {
                            targetInput.value = (prod.images && prod.images[i-1]) ? prod.images[i-1] : "";
                        }
                    }
                    
                    document.getElementById('productFormTitle').innerText = "กำลังแก้ไขสินค้า: " + (prod.name || "ไม่มีชื่อ");
                    document.getElementById('cancelEditBtn').classList.remove('hidden');
                    openModal('productFormModal');
                });
            }

            // 🛠️ [จุดแก้ไขสําคัญ] เพิ่มตัวแปร e ในวงเล็บและจัดการ Array ให้ปลอดภัยที่สุด
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // 1. หยุดคำสั่งคลิกไม่ให้ทะลุไปเปิดป๊อปอัปสินค้า
                    
                    if (confirm(`คุณต้องการลบสินค้า "${prod.name}" จริงหรือไม่?`)) {
                        try {
                            // 2. ส่งคำสั่งลบไปยัง Firebase Server
                            await deleteDoc(doc(db, "products", prod.id));
                            
                            // 3. กรองเอาสินค้าที่ถูกลบออกจากสถานะหน่วยความจำในเครื่องคอมพิวเตอร์ทันที
                            products = products.filter(p => p.id !== prod.id);
                            
                            // 4. สั่งถอนแผ่นแรนเดอร์ Card ชิ้นนั้นออกจากหน้าจอผู้ใช้งานทันที
                            card.remove();
                            
                            saveDataBackup();
                            alert('ลบสินค้าสำเร็จเรียบร้อยแล้ว!');
                            
                            // 5. กรณีที่ยังมีสินค้าเหลืออยู่ ให้รีโหลดหน้าจอเพื่อซิงค์ข้อมูลจริงล่าสุด
                            if (products.length > 0) {
                                await loadProducts();
                            } else {
                                // ถ้าลบจนเกลี้ยงหน้าจอ ให้แสดงพื้นที่ว่างเปล่าโดยไม่ต้องให้สินค้าเริ่มต้นเด้งกลับมา
                                renderSidebar();
                                const gridContainer = document.getElementById('productsGridContainer');
                                if (gridContainer) {
                                    gridContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#aaa;">ไม่มีสินค้าแสดงในส่วนนี้</div>`;
                                }
                            }
                        } catch (err) {
                            console.error("Error deleting from Firebase: ", err);
                            alert('เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง');
                        }
                    }
                });
            }
        }

        container.appendChild(card);
    });

    initProductDragAndDrop();
}

/* ==========================================================================
   SECTION 4: POPUPS WORKFLOWS & LIGHTBOX (ฟังก์ชันการทำงานป๊อปอัปทั้งหมด)
   ========================================================================== */

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        if (!history.state || history.state.popup !== true) {
            history.pushState({ popup: true }, "");
        }
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay, #bulkKeywordModal').forEach(modal => {
        modal.classList.remove('active');
    });
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this || e.target.classList.contains('close-modal-btn')) {
            this.classList.remove('active');
        }
    });
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(o => o.classList.remove('active'));
    }
});

function openSubCatPopup(mainCatTitle) {
    document.getElementById('subCatTitle').innerText = mainCatTitle;
    const subArea = document.getElementById('subCatGroupArea');
    const brandArea = document.getElementById('brandGroupArea');
    
    subArea.innerHTML = ""; brandArea.innerHTML = "";

    const availableSubsInThisCat = categories.sub.filter(sub => {
        return products.some(p => p.mainCat === mainCatTitle && p.subCat === sub);
    });

    if (availableSubsInThisCat.length === 0) {
        subArea.innerHTML = `<span style="font-size:0.9rem; color:#aaa; padding:5px;">ไม่มีหมวดหมู่ย่อยในหมวดหมู่นี้</span>`;
    } else {
        availableSubsInThisCat.forEach(sub => {
            let btn = document.createElement('button'); btn.className = "pill-btn"; btn.innerText = sub;
            btn.onclick = () => { filterBySpecifics(mainCatTitle, sub, null); closeModal('subCatPopup'); };
            subArea.appendChild(btn);
        });
    }

    const availableBrandsInThisCat = categories.brand.filter(b => {
        return products.some(p => p.mainCat === mainCatTitle && p.brand === b);
    });

    if (availableBrandsInThisCat.length === 0) {
        brandArea.innerHTML = `<span style="font-size:0.9rem; color:#aaa; padding:5px;">ไม่มีแบรนด์สินค้าในหมวดหมู่นี้</span>`;
    } else {
        availableBrandsInThisCat.forEach(b => {
            let btn = document.createElement('button'); btn.className = "pill-btn"; btn.innerText = b;
            btn.onclick = () => { filterBySpecifics(mainCatTitle, null, b); closeModal('subCatPopup'); };
            brandArea.appendChild(btn);
        });
    }

    openModal('subCatPopup');
}

function filterBySpecifics(main, sub, brand) {
    let list = products.filter(p => p.mainCat === main);
    if (sub) list = list.filter(p => p.subCat === sub);
    if (brand) list = list.filter(p => p.brand === brand);
    renderProducts(list);
}

// 🌟 ตัวแปรกลางสำหรับระบบ Lightbox เต็มจอเท่านั้น
let lightboxImagesArray = [];
let currentLightboxIndex = 0;

// 🌟 [ปรับปรุงใหม่] ฟังก์ชันเปิดแสดงรายละเอียดสินค้าและลากจัดเรียงรูปภาพย่อยอย่างอิสระ
function openProductDetailPopup(id) {
    let prod = products.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('detailTitle').innerHTML = `${prod.isMall ? '<span class="mall-prefix">MALL</span>':''}${prod.name}`;
    document.getElementById('detailPrice').innerText = formatMoney(calculateDiscountedPrice(prod.price, prod.discountCode));
    document.getElementById('detailDesc').innerText = prod.desc;
    
    let oBtn = document.getElementById('detailOrderBtn');
    if (prod.isComingSoon) {
        oBtn.style.display = 'none';
    } else {
        oBtn.style.display = 'block';
        oBtn.href = prod.orderLink;
        oBtn.setAttribute('data-id', prod.id);
    }

    let mainImgElement = document.getElementById('detailMainImg');
    mainImgElement.src = prod.mainImg;

    let thumbContainer = document.getElementById('detailThumbStrip');
    thumbContainer.innerHTML = "";

    let dotsContainer = document.getElementById('detailMainImgDots');
    if (dotsContainer) dotsContainer.innerHTML = "";

    // ดึงชุดข้อมูลรูปภาพของสินค้าชิ้นปัจจุบันออกมาอย่างเป็นเอกเทศ
    let localImagesArray = [prod.mainImg, ...(prod.images || [])].filter(url => url && url.trim() !== "");

    localImagesArray.forEach((url, index) => {
        let img = document.createElement('img');
        img.className = `thumb-img ${index === 0 ? 'active' : ''}`;
        img.src = url;
        img.setAttribute('data-index', index);
        img.setAttribute('data-url', url); // ระบุ URL แท้จริงไว้ที่ตัว Element
        
        let dot = document.createElement('div');
        dot.className = `preview-dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('data-index', index);

        function updateActiveElements() {
            if (!thumbContainer) return;
            thumbContainer.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
            img.classList.add('active');
            if (dotsContainer) {
                dotsContainer.querySelectorAll('.preview-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
            }
            mainImgElement.src = url;
        }

        // ล้าง Event Listener ซ้ำซ้อนที่เคยมีออก ป้องกันการเรียกใช้เบิ้ลสองรอบ
        img.onclick = function(e) { 
            if (e) e.stopPropagation(); 
            updateActiveElements(); 
        };
        
        dot.onclick = function(e) { 
            if (e) e.stopPropagation(); 
            updateActiveElements(); 
        };

        thumbContainer.appendChild(img);
        if (dotsContainer) dotsContainer.appendChild(dot);
    });

    // เปิดระบบลากจัดเรียงรูปภาพย่อยเฉพาะฝั่งแอดมิน (Force Fallback เพื่อให้มือถือลากได้อย่างอิสระต่อเนื่อง)
    if (adminLoggedIn) {
        // หากเคยมีตัวตรวจจับเก่าค้างอยู่ ให้ทำลายทิ้งก่อนเพื่อป้องกัน ID สินค้าสับสน
        if (thumbContainer.sortableInstance) {
            thumbContainer.sortableInstance.destroy();
        }

        thumbContainer.sortableInstance = new Sortable(thumbContainer, {
            animation: 150,
            forceFallback: true, // บังคับใช้โหมดเสมือนเพื่อให้มือถือลากได้ราบรื่นต่อเนื่อง
            fallbackTolerance: 3,
            onEnd: async function() {
                let reorderedUrls = [];
                // วนลูปอ่านค่าเฉพาะรูปภาพที่อยู่ในกล่องแสดงผลของสินค้าปัจจุบันเท่านั้น
                thumbContainer.querySelectorAll('.thumb-img').forEach(img => {
                    reorderedUrls.push(img.getAttribute('data-url'));
                });
                
                if (reorderedUrls.length > 0) {
                    // ตรวจสอบเช็คความปลอดภัย ค้นหา Object สินค้าใหม่อีกรอบผ่าน ID ป้องกันการจำผิดชิ้น
                    let currentProd = products.find(p => p.id === id);
                    if (!currentProd) return;

                    currentProd.mainImg = reorderedUrls[0];
                    currentProd.images = reorderedUrls.slice(1);
                    
                    // บันทึกลงฐานข้อมูลเฉพาะของสินค้า ID นั้นๆ โดยตรง
                    await updateDoc(doc(db, "products", currentProd.id), {
                        mainImg: currentProd.mainImg,
                        images: currentProd.images
                    });

                    saveDataBackup();
                    renderProducts();
                    // รีโหลดหน้าต่างป๊อปอัปให้แสดงลำดับใหม่ล่าสุดทันที
                    openProductDetailPopup(currentProd.id);
                }
            }
        });
    }

    // เมื่อคลิกที่รูปใหญ่เพื่อขยายโหมด Lightbox เต็มจอ
    mainImgElement.onclick = function() {
        lightboxImagesArray = localImagesArray; // ส่งค่าส่งต่อให้ Lightbox สไลด์ภาพได้ถูกต้อง
        currentLightboxIndex = 0;
        let activeThumb = thumbContainer.querySelector('.thumb-img.active');
        if (activeThumb) currentLightboxIndex = parseInt(activeThumb.getAttribute('data-index'));
        
        document.getElementById('lightboxImg').src = lightboxImagesArray[currentLightboxIndex];
        openModal('lightboxModal');
    };

    openModal('productDetailModal');

    // 📱 ระบบปัดหน้าจอ (Swipe) สำหรับเปลี่ยนรูปบนมือถือ
    let touchStartX = 0;
    let touchEndX = 0;

    mainImgElement.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    mainImgElement.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });

    function handleSwipeGesture() {
        const activeThumb = thumbContainer.querySelector('.thumb-img.active');
        if (!activeThumb) return;

        let currentIndex = parseInt(activeThumb.getAttribute('data-index'));
        let nextIndex = currentIndex;
        const swipeThreshold = 50; 
        
        if (touchStartX - touchEndX > swipeThreshold) {
            nextIndex = (currentIndex + 1) % localImagesArray.length;
            triggerImageChange(nextIndex);
        } 
        else if (touchEndX - touchStartX > swipeThreshold) {
            nextIndex = (currentIndex - 1 + localImagesArray.length) % localImagesArray.length;
            triggerImageChange(nextIndex);
        }
    }

    function triggerImageChange(index) {
        const targetThumb = thumbContainer.querySelector(`.thumb-img[data-index="${index}"]`);
        if (targetThumb) {
            targetThumb.click();
        }
    }

    // 🚀 ระบบลูกศร ซ้าย-ขวา บนคีย์บอร์ดคอมพิวเตอร์ (ปรับปรุงให้รองรับโหมดขยายรูป Lightbox เต็มจอด้วย)
    const handleKeyDown = function(e) {
        const detailModal = document.getElementById('productDetailModal');
        const lightboxModal = document.getElementById('lightboxModal');
        
        // ถ้ายกเลิกการเปิดหน้าต่างทั้งคู่ไปแล้ว ให้ถอด Event Listener ออกป้องกัน Memory Leak
        if ((!detailModal || !detailModal.classList.contains('active')) && 
            (!lightboxModal || !lightboxModal.classList.contains('active'))) {
            window.removeEventListener('keydown', handleKeyDown);
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();

            // 🎯 เคสที่ 1: ถ้าเปิดหน้าต่างขยายรูปเต็มจอ (Lightbox) ตามในรูปของคุณอยู่
            if (lightboxModal && lightboxModal.classList.contains('active')) {
                if (e.key === 'ArrowLeft') {
                    document.getElementById('lightboxPrev').click(); // สั่งคลิกปุ่มซ้ายของ Lightbox
                } else if (e.key === 'ArrowRight') {
                    document.getElementById('lightboxNext').click(); // สั่งคลิกปุ่มขวาของ Lightbox
                }
            } 
            // เคสที่ 2: ถ้าเปิดอยู่แค่หน้าต่างรายละเอียดธรรมดา (ไม่ได้ขยายรูปเต็มจอ)
            else if (detailModal && detailModal.classList.contains('active')) {
                const activeThumb = thumbContainer.querySelector('.thumb-img.active');
                if (!activeThumb) return;
                
                let currentIndex = parseInt(activeThumb.getAttribute('data-index'));
                let nextIndex = currentIndex;

                if (e.key === 'ArrowLeft') {
                    nextIndex = (currentIndex - 1 + localImagesArray.length) % localImagesArray.length;
                } else if (e.key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % localImagesArray.length;
                }

                const targetThumb = thumbContainer.querySelector(`.thumb-img[data-index="${nextIndex}"]`);
                if (targetThumb) {
                    targetThumb.click();
                }
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
}

document.getElementById('lightboxPrev').onclick = () => {
    currentLightboxIndex = (currentLightboxIndex - 1 + lightboxImagesArray.length) % lightboxImagesArray.length;
    document.getElementById('lightboxImg').src = lightboxImagesArray[currentLightboxIndex];
};
document.getElementById('lightboxNext').onclick = () => {
    currentLightboxIndex = (currentLightboxIndex + 1) % lightboxImagesArray.length;
    document.getElementById('lightboxImg').src = lightboxImagesArray[currentLightboxIndex];
};
/* ==========================================================================
   SECTION 5: ADMIN SYSTEM CONTROLLERS (ระบบผู้ดูแลความปลอดภัย)
   ========================================================================== */

// ฟังก์ชัน Login ผ่าน Firebase Authentication (เปลี่ยนมาใช้ Email/Password บน Cloudแทนการเช็คแบบ Hardcode)
document.getElementById('loginForm').onsubmit = async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginUser').value.trim(); 
    const pass = document.getElementById('loginPass').value;

    try {
        // ยืนยันตัวตนผ่าน Firebase Auth
        await signInWithEmailAndPassword(auth, email, pass);
        
        adminLoggedIn = true;
        sessionStorage.setItem('6ickboy_admin_logged', JSON.stringify(true));
        
        document.body.classList.add('admin-mode-active');
        document.getElementById('statusText').innerText = `โหมดผู้ดูแล`;
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        
        closeModal('loginModal');
        closeModal('sideMenuModal');
        renderProducts();
        alert('เข้าสู่ระบบสำเร็จแล้ว!');
    } catch (error) {
        console.error("Firebase Login Error: ", error);
        if (error.code === 'auth/invalid-email') {
            alert('รูปแบบอีเมลไม่ถูกต้อง!');
        } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            alert('อีเมล หรือ รหัสผ่านไม่ถูกต้อง!');
        } else {
            alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message);
        }
    }
};

// ฟังก์ชัน Logout ออกจากระบบ Firebase Auth
document.getElementById('adminLogoutBtn').onclick = async () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        try {
            await signOut(auth);
            
            adminLoggedIn = false;
            sessionStorage.removeItem('6ickboy_admin_logged');
            
            document.body.classList.remove('admin-mode-active');
            document.getElementById('statusText').innerText = "โหมดผู้เยี่ยมชม";
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
            
            closeModal('sideMenuModal');
            renderProducts();
            alert('ออกจากระบบเรียบร้อยแล้ว');
        } catch (error) {
            console.error("Firebase Logout Error: ", error);
            alert('เกิดข้อผิดพลาดในการออกจากระบบ');
        }
    }
};

const formThumbsArea = document.getElementById('formThumbUrlsContainer');
if (formThumbsArea) {
    formThumbsArea.innerHTML = "";
    for(let i=1; i<=8; i++) {
        formThumbsArea.innerHTML += `<input type="url" id="formThumbUrl${i}" placeholder="รูปย่อยที่ ${i} (URL)" style="margin-bottom:5px;">`;
    }
}

function populateFormDropdowns() {
    let mainSel = document.getElementById('formMainCat');
    let subSel = document.getElementById('formSubCat');
    let brandSel = document.getElementById('formBrand');
    
    if(!mainSel || !subSel || !brandSel) return;
    mainSel.innerHTML = ""; subSel.innerHTML = ""; brandSel.innerHTML = "";
    categories.main.forEach(c => mainSel.innerHTML += `<option value="${c}">${c}</option>`);
    categories.sub.forEach(c => subSel.innerHTML += `<option value="${c}">${c}</option>`);
    categories.brand.forEach(c => brandSel.innerHTML += `<option value="${c}">${c}</option>`);
}

document.getElementById('productForm').onsubmit = async function(e) {
    e.preventDefault();
    let editId = document.getElementById('editProductId').value;
    
    let thumbs = [];
    for(let i=1; i<=8; i++) {
        let val = document.getElementById(`formThumbUrl${i}`).value;
        if(val && val.trim() !== "") thumbs.push(val.trim());
    }

    let rawPrice = document.getElementById('formNormalPrice').value;
    let finalPrice = rawPrice === "" ? 0 : parseFloat(rawPrice);
    let mainImgInput = document.getElementById('formMainImg').value.trim();
    let finalMainImg = mainImgInput || "https://placehold.co/500x500/eef2f5/a3b1c6?text=No+Image";

    let prodData = {
        name: document.getElementById('formProdName').value.trim() || "สินค้าที่ยังไม่ตั้งชื่อ",
        mainCat: document.getElementById('formMainCat').value || (categories.main[0] || ""),
        subCat: document.getElementById('formSubCat').value || (categories.sub[0] || ""),
        brand: document.getElementById('formBrand').value || (categories.brand[0] || ""),
        mainImg: finalMainImg,
        images: thumbs,
        price: finalPrice,
        discountCode: (document.getElementById('formDiscountCode').value || "").trim(),
        desc: (document.getElementById('formProdDesc').value || "").trim(),
        keywords: (document.getElementById('formKeywords').value || "").trim(),
        orderLink: document.getElementById('formOrderLink').value.trim() || "https://google.com",
        isMall: document.getElementById('formMall').checked,
        isComingSoon: document.getElementById('formComingSoon').checked,
        isNew: document.getElementById('formNew').checked,
        isHot: document.getElementById('formHot').checked
    };

    try {
        if (editId) {
            // อัปเดตสินค้าบน Firebase
            await updateDoc(doc(db, "products", editId), prodData);
            alert('แก้ไขสินค้าเรียบร้อยแล้ว');
        } else {
            // เพิ่มสินค้าใหม่บน Firebase + ตั้งค่า sortOrder ล่าสุดไว้บนสุด
            prodData.sortOrder = products.length > 0 ? products[0].sortOrder - 1 : 0;
            await addDoc(productsCollection, prodData);
            alert('เพิ่มสินค้าชิ้นใหม่เรียบร้อยแล้ว');
        }
        
        await loadProducts(); // ดึงข้อมูลชุดใหม่จาก Firebase
        resetProductForm();
        closeModal('productFormModal');
    } catch (err) {
        console.error("Error saving product to Firebase: ", err);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลระบบคลาวด์!");
    }
};

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = "";
    document.getElementById('productFormTitle').innerText = "เพิ่มสินค้าใหม่";
    document.getElementById('cancelEditBtn').classList.add('hidden');
}
document.getElementById('cancelEditBtn').onclick = resetProductForm;

/* ==========================================================================
   SECTION 6: DRAG SORTABLE & BULK ACTIONS (การลากจัดเรียงและการแก้ไขชุดใหญ่)
   ========================================================================== */

let mainSortableInstance = null;
function initProductDragAndDrop() {
    let grid = document.getElementById('productsGridContainer');
    if (!grid) return;
    
    // 1. ตรวจสอบสิทธิ์แอดมินและการฟิลเตอร์หมวดหมู่หลัก (หากไม่ใช่หมวดหมู่ "ทั้งหมด" แนะนำให้ปิดชั่วคราวเพื่อป้องกันลำดับฐานข้อมูลพัง)
    if (!adminLoggedIn || currentFilterCategory !== "ทั้งหมด") {
        if (mainSortableInstance) { 
            mainSortableInstance.destroy(); 
            mainSortableInstance = null; 
        }
        return;
    }
    
    let sortSelect = document.getElementById('productSortSelect');
    let currentSortMode = sortSelect ? sortSelect.value : 'default';
    
    // 2. อนุญาตให้ลากได้เฉพาะโหมดเริ่มต้น (default) หรือโหมดล่าสุด (latest) เท่านั้น
    if (currentSortMode === 'default' || currentSortMode === 'latest') {
        if (mainSortableInstance) return; // ถ้ามี instance ทำงานอยู่แล้ว ไม่สร้างซ้ำ
        
        mainSortableInstance = new Sortable(grid, {
            animation: 150,
            handle: '.product-img-holder', // นิ้วจับลากได้เฉพาะบริเวณพื้นที่รูปภาพสินค้า
            
            // 🌟 [ชุดคำสั่งสำหรับแก้ปัญหามือถือล็อกรอบสอง] 🌟
            delay: 150,             // ต้องใช้นิ้วแตะค้างไว้ 0.15 วินาที เพื่อให้ไม่ชนกับการปัดหน้าจอเพื่อเลื่อนดูเว็บปกติ
            delayOnTouchOnly: true, // หน่วงเวลาเฉพาะบนอุปกรณ์สัมผัส/มือถือ เท่านั้น คอมพิวเตอร์ลากได้ทันที
            touchStartThreshold: 5, // ถ้านิ้วขยับเกิน 5px ระหว่างแตะค้าง ถือเป็นการเลื่อนหน้าจอปกติ ไม่ใช่การลากสินค้า
            forceFallback: true,    // 💥 บังคับใช้ Fallback Mode (สำคัญที่สุด) ป้องกันไม่ให้ระบบสัมผัสของเบราว์เซอร์มือถือค้างหลังลากเสร็จ
            fallbackTolerance: 3,   // ช่วยเพิ่มความไวในการจำลองวัตถุเคลื่อนที่ตามนิ้ว
            
            onEnd: async function (evt) {
                // หากลากแล้ววางตำแหน่งเดิม ไม่ต้องคำนวณใหม่
                if (evt.oldIndex === evt.newIndex) return;
                
                // 3. สลับข้อมูลสินค้าในตัวแปร 'products' ภายในหน่วยความจำตามจริงทันที (แม่นยำกว่าการลูปอ่าน DOM ใหม่บนมือถือ)
                const movedItem = products.splice(evt.oldIndex, 1)[0];
                products.splice(evt.newIndex, 0, movedItem);
                
                // 4. บันทึกสำรองข้อมูลลำดับล่าสุดเก็บไว้ในเครื่อง
                saveDataBackup();
                
                // 5. เตรียมชุดคำสั่งเพื่อเตรียมอัปเดตขึ้น Firebase Firestore พร้อมกันทั้งหมด
                const batch = writeBatch(db);
                products.forEach((prod, index) => {
                    prod.sortOrder = index; // อัปเดตโครงสร้างลำดับในวัตถุสินค้า
                    const docRef = doc(db, "products", prod.id);
                    batch.update(docRef, { sortOrder: index });
                });
                
                try {
                    // ส่งคำสั่งอัปเดต sortOrder ทั้งแผงขึ้น Cloud
                    await batch.commit();
                    console.log("บันทึกลำดับสินค้าใหม่เรียบร้อย!");
                    
                    // 🌟 6. รีเซ็ตเคลียร์ Touch Session ล้างอาการหน่วงค้าง เพื่อให้ลากรอบถัดไปได้ทันที
                    setTimeout(() => {
                        if (mainSortableInstance) {
                            mainSortableInstance.destroy();
                            mainSortableInstance = null;
                        }
                        initProductDragAndDrop(); // สั่งรันคำสั่งลากรอบใหม่ให้แสตนบายพร้อมทำงานทันที
                    }, 50);
                    
                } catch (err) {
                    console.error("เกิดข้อผิดพลาดในการเซ็ตลำดับบน Firebase: ", err);
                    alert("ไม่สามารถบันทึกลำดับสินค้าได้ กรุณาลองใหม่อีกครั้ง");
                }
            }
        });
    } else {
        if (mainSortableInstance) { 
            mainSortableInstance.destroy(); 
            mainSortableInstance = null; 
        }
    }
}

function openCategoryManageModal() {
    const listMain = document.getElementById('dragMainCatList');
    const listSub = document.getElementById('dragSubCatList');
    const listBrand = document.getElementById('dragBrandList');
    
    if(!listMain || !listSub || !listBrand) return;

    const renderDragItems = (ul, typeArray, typeKey) => {
        ul.innerHTML = "";
        typeArray.forEach((name, idx) => {
            ul.innerHTML += `
                <li class="drag-item" data-name="${name}">
                    <span>${name}</span>
                    <div>
                        <i class="fa-solid fa-pen" style="cursor:pointer; margin-right:8px; color:#3498db;" onclick="renameCategory('${typeKey}', ${idx})"></i>
                        <i class="fa-solid fa-trash" style="cursor:pointer; color:#e74c3c;" onclick="deleteCategory('${typeKey}', ${idx})"></i>
                    </div>
                </li>`;
        });
    };

    renderDragItems(listMain, categories.main, 'main');
    renderDragItems(listSub, categories.sub, 'sub');
    renderDragItems(listBrand, categories.brand, 'brand');

    const makeSortable = (el, key) => {
        new Sortable(el, {
            animation: 150,
            onEnd: async () => {
                let ordered = [];
                el.querySelectorAll('.drag-item').forEach(item => ordered.push(item.getAttribute('data-name')));
                categories[key] = ordered;
                
                // อัปเดตขึ้นคลาวด์
                await setDoc(doc(db, "categories", key), { items: ordered });
                saveDataBackup();
                renderSidebar();
            }
        });
    };

    makeSortable(listMain, 'main');
    makeSortable(listSub, 'sub');
    makeSortable(listBrand, 'brand');
    openModal('categoryManageModal');
}

window.renameCategory = async function(key, idx) {
    let old = categories[key][idx];
    let n = prompt("แก้ไขชื่อหมวดหมู่:", old);
    if (n && n.trim() !== "") {
        categories[key][idx] = n.trim();
        await setDoc(doc(db, "categories", key), { items: categories[key] });
        openCategoryManageModal(); renderSidebar();
    }
};

window.deleteCategory = async function(key, idx) {
    if (confirm("ยืนยันการลบหมวดหมู่นี้?")) {
        categories[key].splice(idx, 1);
        await setDoc(doc(db, "categories", key), { items: categories[key] });
        openCategoryManageModal(); renderSidebar();
    }
};

document.getElementById('addNewCatBtn').onclick = async () => {
    let name = document.getElementById('newCatName').value.trim();
    let type = document.getElementById('newCatType').value;
    if(!name) return alert('กรุณาใส่ชื่อหมวดหมู่');
    categories[type].push(name);
    
    await setDoc(doc(db, "categories", type), { items: categories[type] });
    document.getElementById('newCatName').value = "";
    openCategoryManageModal();
    renderSidebar();
};

function openBulkDiscountModal() {
    const tbody = document.getElementById('bulkProductTableBody');
    if(!tbody) return;
    tbody.innerHTML = "";
    
    products.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><input type="checkbox" class="bulk-item-check" data-id="${p.id}" data-mall="${p.isMall}" data-code="${p.discountCode}"></td>
                <td>${p.isMall?'[MALL] ':''}${p.name}</td>
                <td><input type="number" value="${p.price}" style="width:100px;" onkeydown="updateSinglePriceInline(event, '${p.id}', this.value)"></td>
                <td><span class="badge-hot" style="background:#7f8c8d;">${p.discountCode || 'ไม่มี'}</span></td>
            </tr>`;
    });
    openModal('bulkDiscountModal');
}

window.updateSinglePriceInline = async function(e, id, val) {
    if (e.key === 'Enter') {
        let p = products.find(prod => prod.id === id);
        if(p) {
            p.price = parseFloat(val);
            await updateDoc(doc(db, "products", id), { price: p.price });
            saveDataBackup();
            renderProducts();
            alert('เปลี่ยนราคาสินค้าเรียบร้อย!');
        }
    }
};

document.getElementById('masterBulkCheck').onchange = function() {
    document.querySelectorAll('.bulk-item-check').forEach(c => c.checked = this.checked);
};
document.getElementById('bulkSelectAllBtn').onclick = () => {
    document.querySelectorAll('.bulk-item-check').forEach(c => c.checked = true);
};
document.getElementById('bulkSelectMallBtn').onclick = () => {
    document.querySelectorAll('.bulk-item-check').forEach(c => {
        c.checked = (c.getAttribute('data-mall') === 'true');
    });
};
document.getElementById('selectByDiscountBtn').onclick = () => {
    let targetCode = document.getElementById('bulkSearchSelector').value.trim();
    document.querySelectorAll('.bulk-item-check').forEach(c => {
        c.checked = (c.getAttribute('data-code') === targetCode);
    });
};

document.getElementById('applyBulkDiscountBtn').onclick = async () => {
    let newCode = document.getElementById('bulkDiscountInput').value.trim();
    let checkedBoxes = document.querySelectorAll('.bulk-item-check:checked');
    if(checkedBoxes.length === 0) return alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
    
    const batch = writeBatch(db);
    checkedBoxes.forEach(cb => {
        let id = cb.getAttribute('data-id');
        let p = products.find(prod => prod.id === id);
        if(p) {
            p.discountCode = newCode;
            batch.update(doc(db, "products", id), { discountCode: newCode });
        }
    });
    
    await batch.commit();
    saveDataBackup();
    renderProducts();
    closeModal('bulkDiscountModal');
    alert('อัปเดตโค้ดส่วนลดชุดใหญ่สำเร็จแล้ว!');
};

/* ==========================================================================
   SECTION 7: STATISTICS & SEARCH FILTERS (ระบบหลังบ้านสถิติ ค้นหา และ คัดกรอง)
   ========================================================================== */

function getTodayKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// บันทึกคลิกแทร็กกิ้งขึ้น Firebase
document.addEventListener('click', async (e) => {
    let trackBtn = e.target.closest('.order-click-track');
    if (trackBtn) {
        let id = trackBtn.getAttribute('data-id');
        let currentDay = getTodayKey();
        
        if (!stats[currentDay]) stats[currentDay] = { views: 1, clicks: {} };
        if (!stats[currentDay].clicks) stats[currentDay].clicks = {};
        
        stats[currentDay].clicks[id] = (stats[currentDay].clicks[id] || 0) + 1;
        
        await setDoc(doc(db, "stats", currentDay), stats[currentDay], { merge: true });
        saveDataBackup();
    }
});

function openStatsModal() {
    const datePicker = document.getElementById('statDatePicker');
    if (datePicker && !datePicker.value) {
        datePicker.value = getTodayKey();
    }
    updateStatsUI();
    openModal('statsModal');
}

function updateStatsUI() {
    const datePicker = document.getElementById('statDatePicker');
    if (!datePicker) return;

    const selectedDate = datePicker.value;
    if (!selectedDate) return;

    const dayStats = stats[selectedDate] || { views: 0, clicks: {} };
    if (!dayStats.clicks) dayStats.clicks = {};
    
    let totalClicks = Object.values(dayStats.clicks).reduce((a, b) => a + b, 0);

    const viewsEl = document.getElementById('statTotalViews');
    const clicksEl = document.getElementById('statTotalClicks');
    if (viewsEl) viewsEl.innerText = dayStats.views || 0;
    if (clicksEl) clicksEl.innerText = totalClicks;

    const tbody = document.getElementById('statsTableBody');
    if (tbody) {
        tbody.innerHTML = "";
        products.forEach(p => {
            let clickCount = dayStats.clicks[p.id] || 0;
            tbody.innerHTML += `
                <tr>
                    <td>${p.isMall ? '[MALL] ' : ''}${p.name}</td>
                    <td style="text-align:center; font-weight:bold; color:#2ecc71;">${clickCount} ครั้ง</td>
                </tr>`;
        });
    }
}

document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'clearViewsBtn') {
        const datePicker = document.getElementById('statDatePicker');
        if (!datePicker || !datePicker.value) return;
        const selectedDate = datePicker.value;

        if (confirm(`คุณต้องการล้าง "ยอดเข้าชม" ของวันที่ ${selectedDate} ใช่หรือไม่?`)) {
            if (stats[selectedDate]) {
                stats[selectedDate].views = 0;
                await setDoc(doc(db, "stats", selectedDate), { views: 0 }, { merge: true });
                saveDataBackup();
                updateStatsUI();
            }
        }
    }

    if (e.target && e.target.id === 'clearClicksBtn') {
        const datePicker = document.getElementById('statDatePicker');
        if (!datePicker || !datePicker.value) return;
        const selectedDate = datePicker.value;

        if (confirm(`คุณต้องการล้าง "ยอดคลิกทั้งหมด" ของวันที่ ${selectedDate} ใช่หรือไม่?`)) {
            if (stats[selectedDate]) {
                stats[selectedDate].clicks = {};
                await setDoc(doc(db, "stats", selectedDate), { clicks: {} }, { merge: true });
                saveDataBackup();
                updateStatsUI();
            }
        }
    }
});

document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'statDatePicker') {
        updateStatsUI();
    }
});

document.getElementById('productSearchInput').addEventListener('input', function() {
    let val = this.value.toLowerCase().trim();
    if (val === "") { renderProducts(); return; }
    
    let filtered = products.filter(p => {
        return p.name.toLowerCase().includes(val) || 
               p.mainCat.toLowerCase().includes(val) || 
               p.subCat.toLowerCase().includes(val) ||
               p.brand.toLowerCase().includes(val) ||
               (p.keywords && p.keywords.toLowerCase().includes(val));
    });
    renderProducts(filtered);
});

document.getElementById('productSortSelect').addEventListener('change', function() {
    let mode = this.value;
    let listToSort = [...products];
    
    if (currentFilterCategory !== "ทั้งหมด") {
        listToSort = listToSort.filter(p => p.mainCat === currentFilterCategory);
    }

    if (mode === 'price-desc') {
        listToSort.sort((a,b) => calculateDiscountedPrice(b.price, b.discountCode) - calculateDiscountedPrice(a.price, a.discountCode));
    } else if (mode === 'price-asc') {
        listToSort.sort((a,b) => calculateDiscountedPrice(a.price, a.discountCode) - calculateDiscountedPrice(b.price, b.discountCode));
    }
    
    renderProducts(listToSort);
});

/* ==========================================================================
   SECTION 8: APP INITIALIZATION & MOBILE BACK BUTTON FOR POPUPS
   ========================================================================== */

document.getElementById('menuToggleBtn').onclick = () => openModal('sideMenuModal');
document.getElementById('loginMenuBtn').onclick = () => openModal('loginModal');
document.getElementById('adminAddProductBtn').onclick = () => { populateFormDropdowns(); openModal('productFormModal'); };
document.getElementById('adminManageCatBtn').onclick = openCategoryManageModal;
document.getElementById('adminManageDiscountBtn').onclick = openBulkDiscountModal;
document.getElementById('adminStatsBtn').onclick = openStatsModal;

if (adminLoggedIn) {
    document.body.classList.add('admin-mode-active');
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.innerText = "โหมดผู้ดูแล (Admin)";
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
} else {
    document.body.classList.remove('admin-mode-active');
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
}

// 1. ตั้งค่า State แรกสุดของหน้าเว็บป้องกันการเออร์เรอร์
if (!history.state) {
    history.replaceState({ page: "home", category: "ทั้งหมด" }, "");
}

// 2. ดักจับและเขียนทับฟังก์ชันเปิด Modal หลัก เพื่อเก็บประวัติสำหรับการย้อนกลับ (Back)
const originalOpenModal = window.openModal;
window.openModal = function(modalId) {
    if (typeof originalOpenModal === 'function') {
        originalOpenModal(modalId);
    }
    // สั่งผลัก State เข้าไปในระบบเบราว์เซอร์ เมื่อมีการเปิดป๊อปอัปใด ๆ
    history.pushState({ modalOpen: true, activeId: modalId }, null, "");
};

// 3. ดักจับฟังก์ชันเปิดคีย์บอร์ดกลุ่ม (Bulk Keyword Modal) เพื่อเก็บประวัติด้วยเช่นกัน
const originalOpenBulkKeywordModal = window.openBulkKeywordModal;
window.openBulkKeywordModal = function() {
    if (typeof originalOpenBulkKeywordModal === 'function') {
        originalOpenBulkKeywordModal();
    }
    // สั่งผลัก State เข้าไปในระบบเบราว์เซอร์ เมื่อเปิดตัวแก้ไขคีย์บอร์ดกลุ่ม
    history.pushState({ modalOpen: true, activeId: 'bulkKeywordModal' }, null, "");
};

// 📱 4. ระบบดักจับปุ่ม Back บนมือถือเพื่อปิดทุกๆ Popup แบบสมบูรณ์
window.addEventListener('popstate', function(event) {
    // 1. หาหน้าต่างธรรมดาที่กำลังเปิดอยู่ (.active)
    const activeOverlay = document.querySelector('.modal-overlay.active');
    
    // 2. หาหน้าต่างคีย์บอร์ดกลุ่มที่กำลังเปิดอยู่ (.active)
    const bulkModal = document.getElementById('bulkKeywordModal');
    const isBulkActive = bulkModal && bulkModal.classList.contains('active');

    if (activeOverlay || isBulkActive) {
        // แทนที่จะปิดปูพรมพร้อมกันหมด ให้เช็คปิดตัวที่เปิดอยู่ล่าสุดทีละตัว เพื่อให้ CSS อนิเมชั่นทำงานได้สมบูรณ์
        if (isBulkActive) {
            // ถ้าหน้าต่างคีย์บอร์ดกลุ่มเปิดอยู่ ให้จำลองการคลิกปุ่มปิดของมันเองเพื่อความนุ่มนวล
            const closeBtn = bulkModal.querySelector('.close-modal-btn') || bulkModal.querySelector('button');
            if (closeBtn) {
                closeBtn.click();
            } else {
                bulkModal.classList.remove('active');
            }
        } else if (activeOverlay) {
            // ถ้าเป็นป๊อปอัปทั่วไป ให้หาปุ่มปิด (กากบาท) ด้านในป๊อปอัปนั้นแล้วสั่ง Click() 
            const closeBtn = activeOverlay.querySelector('.close-modal-btn') || activeOverlay.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.click(); // ลื่นไหลแน่นอนเพราะใช้ Logic ปิดเดิมของระบบ
            } else {
                activeOverlay.classList.remove('active');
            }
        }
        
        // ดันสถานะประวัติหน้าเว็บให้อยู่กับที่ ไม่ให้เว็บย้อนถอยหลังข้ามหน้า
        history.pushState({ page: "home", category: currentFilterCategory }, "");
    } 
    else if (currentFilterCategory !== "ทั้งหมด") {
        currentFilterCategory = "ทั้งหมด";
        if (typeof renderSidebar === 'function') renderSidebar();
        if (typeof renderProducts === 'function') renderProducts();
        history.replaceState({ page: "home", category: "ทั้งหมด" }, "");
    }
});

// 5. ปรับปรุงแถบเมนูด้านข้างเพื่อเก็บบันทึกประวัติสเตทเวลาเปลี่ยนประเภทสินค้า
const originalRenderSidebar = renderSidebar;
renderSidebar = function() {
    if (typeof originalRenderSidebar === 'function') originalRenderSidebar();
    
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            let selectedCat = this.getAttribute('data-cat');
            if (selectedCat === "ทั้งหมด") {
                history.replaceState({ page: "home", category: "ทั้งหมด" }, "");
            } else {
                history.pushState({ page: "home", category: selectedCat }, "");
            }
        });
    });
};

/* ==========================================================================
   SECTION 9: ระบบเคลียร์ข้อจำกัด URL อัตโนมัติ
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    const pForm = document.getElementById('productForm');
    if (pForm) {
        pForm.setAttribute('novalidate', 'true');
        const mainImgInput = document.getElementById('formMainImg');
        const orderLinkInput = document.getElementById('formOrderLink');
        if (mainImgInput) mainImgInput.setAttribute('type', 'text');
        if (orderLinkInput) orderLinkInput.setAttribute('type', 'text');
    }
});

/* ==========================================================================
   SECTION 10: ระบบจัดการ KEYWORD สินค้าแบบกลุ่ม (BULK KEYWORD MANAGER)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function() {
    const kwBtn = document.getElementById('adminManageKeywordsBtn');
    if (kwBtn) {
        kwBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('sideMenuModal');
            openBulkKeywordModal();
        });
    }

    const selectAllCb = document.getElementById('bulkSelectAllCheckbox');
    if (selectAllCb) {
        selectAllCb.addEventListener('change', function() {
            const rowCheckboxes = document.querySelectorAll('.bulk-item-checkbox');
            rowCheckboxes.forEach(cb => cb.checked = this.checked);
        });
    }

    const catSelect = document.getElementById('bulkFilterCategorySelect');
    if (catSelect) {
        catSelect.addEventListener('change', renderBulkKeywordTable);
    }

    const bulkSubmitBtn = document.getElementById('submitBulkKeywordBtn');
    if (bulkSubmitBtn) {
        bulkSubmitBtn.addEventListener('click', applyBulkKeywords);
    }
});

function openBulkKeywordModal() {
    populateBulkCategoryDropdown();
    renderBulkKeywordTable();
    openModal('bulkKeywordModal');
}

function populateBulkCategoryDropdown() {
    const catSelect = document.getElementById('bulkFilterCategorySelect');
    if (!catSelect) return;

    let html = `<option value="all">แสดงสินค้าทุกหมวดหมู่ (${products.length} ชิ้น)</option>`;
    
    categories.main.forEach(mainCat => {
        let mainCount = products.filter(p => p.mainCat === mainCat).length;
        html += `<option value="main:${mainCat}">📁 ${mainCat} ทั้งหมด (${mainCount} ชิ้น)</option>`;
        
        categories.sub.forEach(subCat => {
            let hasProduct = products.some(p => p.mainCat === mainCat && p.subCat === subCat);
            if (hasProduct) {
                let subCount = products.filter(p => p.mainCat === mainCat && p.subCat === subCat).length;
                html += `<option value="sub:${mainCat}>${subCat}">&nbsp;&nbsp;&nbsp;&nbsp;🔹 ${subCat} (${subCount} ชิ้น)</option>`;
            }
        });
    });

    catSelect.innerHTML = html;
}

function renderBulkKeywordTable() {
    const tableBody = document.getElementById('bulkKeywordTableBody');
    const catSelect = document.getElementById('bulkFilterCategorySelect');
    const selectAllCb = document.getElementById('bulkSelectAllCheckbox');
    if (!tableBody) return;

    if (selectAllCb) selectAllCb.checked = false;
    
    let filtered = [...products];

    if (catSelect && catSelect.value !== 'all') {
        const [type, val] = catSelect.value.split(':');
        if (type === 'main') {
            filtered = filtered.filter(p => p.mainCat === val);
        } else if (type === 'sub') {
            const [mainPart, subPart] = val.split('>');
            filtered = filtered.filter(p => p.mainCat === mainPart && p.subCat === subPart);
        }
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#aaa;">ไม่พบสินค้าในหมวดหมู่ที่เลือก</td></tr>`;
        return;
    }

    let html = "";
    filtered.forEach(prod => {
        let currentKw = prod.keywords || "";
        html += `
            <tr class="bulk-keyword-row" data-id="${prod.id}">
                <td style="padding:10px; text-align:center;">
                    <input type="checkbox" class="bulk-item-checkbox" data-id="${prod.id}" style="transform: scale(1.1); cursor:pointer;">
                </td>
                <td style="padding:10px;">
                    <img src="${prod.mainImg}" style="width:40px; height:40px; object-fit:cover; border-radius:8px; border:1px solid rgba(0,0,0,0.05);">
                </td>
                <td style="padding:10px; font-weight:500; color:var(--text-main); font-size:0.85rem;">
                    ${prod.name}
                </td>
                <td style="padding:10px; color:var(--text-sub); font-size:0.8rem;">
                    ${prod.mainCat} &gt; ${prod.subCat}
                </td>
                <td style="padding:10px;">
                    <input type="text" class="bulk-kw-inline-input" value="${currentKw}" placeholder="พิมพ์ Keyword แล้วกด Enter..." data-id="${prod.id}" onkeydown="handleBulkInlineKwKeydown(event, '${prod.id}')">
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

window.handleBulkInlineKwKeydown = async function(event, productId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const inputField = event.target;
        const newKwValue = inputField.value.trim();

        const prodIndex = products.findIndex(p => p.id === productId);
        if (prodIndex !== -1) {
            products[prodIndex].keywords = newKwValue;
            
            // อัปเดต Keyword ลง Firestore ทันทีเมื่อกด Enter
            await updateDoc(doc(db, "products", productId), { keywords: newKwValue });
            
            saveDataBackup();
            renderProducts();
            
            inputField.style.backgroundColor = "rgba(46, 204, 113, 0.15)";
            setTimeout(() => { inputField.style.backgroundColor = "transparent"; }, 500);
        }
    }
};

window.applyBulkKeywords = async function() {
    const kwInput = document.getElementById('bulkKeywordInput');
    if (!kwInput) return;

    const newKeywords = kwInput.value.trim();
    if (newKeywords === "") {
        alert("กรุณาระบุ Keyword ที่ต้องการบันทึกเป็นกลุ่มก่อนครับ!");
        return;
    }

    const checkedBoxes = document.querySelectorAll('.bulk-item-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert("กรุณาทำเครื่องหมาย Checkbox เลือกสินค้าที่ต้องการแก้ไขอย่างน้อย 1 ชิ้น!");
        return;
    }

    const batch = writeBatch(db);
    checkedBoxes.forEach(cb => {
        const pId = cb.getAttribute('data-id');
        const prodIndex = products.findIndex(p => p.id === pId);
        if (prodIndex !== -1) {
            products[prodIndex].keywords = newKeywords;
            batch.update(doc(db, "products", pId), { keywords: newKeywords });
        }
    });

    await batch.commit(); // สั่งรันอัปเดตแบบกลุ่มขึ้นคลาวด์
    saveDataBackup();
    renderProducts();
    renderBulkKeywordTable();
    kwInput.value = "";
    
    alert(`อัปเดต Keyword ให้สินค้าทั้งหมด ${checkedBoxes.length} รายการเรียบร้อยแล้ว!`);
};