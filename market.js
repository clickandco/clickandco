import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, orderBy, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);

// --- 🛠️ ระบบควบคุมหน้าต่างแอดมินแก้ไขสินค้า Popup ---
const editModal = document.getElementById('adminEditModal');
const editForm = document.getElementById('adminEditForm');

document.getElementById('btnCloseEditModal')?.addEventListener('click', () => { editModal.style.display = 'none'; });
document.getElementById('btnCancelEdit')?.addEventListener('click', () => { editModal.style.display = 'none'; });

let currentLoginMode = "user"; // "user" หรือ "admin"
let currentUserProfile = null; 

// --- 🧭 ระบบสลับแถบหน้าเมนู (Tabs) ---
const tabs = {
    home: { btn: document.getElementById('tabHome'), sec: document.getElementById('sectionHome') },
    post: { btn: document.getElementById('tabPost'), sec: document.getElementById('sectionPost') },
    manage: { btn: document.getElementById('tabManage'), sec: document.getElementById('sectionManage') },
    admin: { btn: document.getElementById('tabAdmin'), sec: document.getElementById('sectionAdmin') }
};

// --- 🔄 ฟังก์ชันสลับหน้าแท็บเมนู (Tab Switcher) ---
function switchTab(tabKey) {
    if (!tabs[tabKey]) return;

    // เช็คว่าปัจจุบันเป็นแอดมินจริงไหมจากข้อมูล Profile ที่เก็บไว้ตอนล็อกอิน
    const isAdmin = currentUserProfile && currentUserProfile.role === 'admin';

    Object.keys(tabs).forEach(key => {
        if (key === 'admin') {
            // 🔒 ถ้าไม่ใช่แอดมิน บังคับซ่อนแท็บแอดมิน (ทั้งบน Navbar และ Sidebar)
            if (!isAdmin) {
                if (tabs[key].btn) tabs[key].btn.style.setProperty('display', 'none', 'important');
                const sideAdmin = document.getElementById('tabAdminSide');
                if (sideAdmin) sideAdmin.style.setProperty('display', 'none', 'important');
            } else {
                if (tabs[key].btn) tabs[key].btn.style.display = 'inline-flex';
            }
        } else {
            if (tabs[key].btn) tabs[key].btn.style.display = 'inline-flex';
        }
        if (tabs[key].sec) tabs[key].sec.style.display = 'none';
        if (tabs[key].btn) tabs[key].btn.classList.remove('active');
    });

    // ป้องกันการแอบเข้าหน้า Admin section
    if (tabKey === 'admin' && !isAdmin) {
        if (tabs['home'].sec) tabs['home'].sec.style.display = 'block';
        if (tabs['home'].btn) tabs['home'].btn.classList.add('active');
    } else {
        if (tabs[tabKey].sec) tabs[tabKey].sec.style.display = 'block';
        if (tabs[tabKey].btn) tabs[tabKey].btn.classList.add('active');
    }
}

tabs.home.btn?.addEventListener('click', () => switchTab('home'));
tabs.post.btn?.addEventListener('click', () => switchTab('post'));
tabs.manage.btn?.addEventListener('click', () => switchTab('manage'));
tabs.admin.btn?.addEventListener('click', () => switchTab('admin'));

// --- ระบบเปิด/ปิดหน้าต่างล็อกอิน Popup ---
const modal = document.getElementById('marketAuthModal');
const loginSub = document.getElementById('loginFormSub');
const registerSub = document.getElementById('registerFormSub');

document.getElementById('btnOpenLogin')?.addEventListener('click', () => { 
    modal.style.display = 'flex'; 
    loginSub.style.display = 'block'; 
    registerSub.style.display = 'none'; 
    resetLoginMode(); 
});
document.getElementById('btnOpenRegister')?.addEventListener('click', () => { 
    modal.style.display = 'flex'; 
    loginSub.style.display = 'none'; 
    registerSub.style.display = 'block'; 
});
document.getElementById('btnCloseAuthModal')?.addEventListener('click', () => { 
    modal.style.display = 'none'; 
});
document.getElementById('linkToRegister')?.addEventListener('click', (e) => { 
    e.preventDefault(); 
    loginSub.style.display = 'none'; 
    registerSub.style.display = 'block'; 
});
document.getElementById('linkToLogin')?.addEventListener('click', (e) => { 
    e.preventDefault(); 
    loginSub.style.display = 'block'; 
    registerSub.style.display = 'none'; 
});

// --- 🔒 ปุ่มสลับประเภทผู้ใช้งานในฟอร์ม Login ---
const typeUserBtn = document.getElementById('loginTypeUser');
const typeAdminBtn = document.getElementById('loginTypeAdmin');
const btnLoginSubmit = document.getElementById('btnLoginSubmit');
const emailLabelTitle = document.getElementById('emailLabelTitle');
const registerSwitchBox = document.getElementById('registerSwitchBox');

typeUserBtn?.addEventListener('click', () => {
    currentLoginMode = "user";
    typeUserBtn.style.background = "var(--text-main)";
    typeUserBtn.style.color = "white";
    typeUserBtn.style.borderColor = "var(--text-main)";
    typeAdminBtn.style.background = "white";
    typeAdminBtn.style.color = "var(--text-muted)";
    typeAdminBtn.style.borderColor = "#e1e4e6";
    btnLoginSubmit.innerText = "เข้าสู่ระบบสมาชิก";
    emailLabelTitle.innerText = "ชื่อผู้ใช้งาน (Username ผู้ใช้ทั่วไป)";
    registerSwitchBox.style.display = "block";
});

typeAdminBtn?.addEventListener('click', () => {
    currentLoginMode = "admin";
    typeAdminBtn.style.background = "#d9383a";
    typeAdminBtn.style.color = "white";
    typeAdminBtn.style.borderColor = "#d9383a";
    typeUserBtn.style.background = "white";
    typeUserBtn.style.color = "var(--text-muted)";
    typeUserBtn.style.borderColor = "#e1e4e6";
    btnLoginSubmit.innerText = "เข้าสู่ระบบผู้ดูแล";
    emailLabelTitle.innerText = "ชื่อผู้ใช้";
    registerSwitchBox.style.display = "none";
});

function resetLoginMode() {
    typeUserBtn?.click();
}

// --- 🔐 ระบบควบคุมความเสถียรของหน้าจอและสิทธิ์ (UI Renderer) ---
function renderUIForUser(profileData) {
    const userInfoDisplay = document.getElementById('userInfoDisplay');
    const btnOpenLogin = document.getElementById('btnOpenLogin');
    const btnOpenRegister = document.getElementById('btnOpenRegister');
    const userPostSection = document.getElementById('userPostSection');
    const postAuthNotice = document.getElementById('postAuthNotice');
    const myProductsGrid = document.getElementById('myProductsGrid');
    const manageAuthNotice = document.getElementById('manageAuthNotice');
    const tabAdmin = document.getElementById('tabAdmin');
    const currentUserName = document.getElementById('currentUserName');
    const currentUserFB = document.getElementById('currentUserFB');
    const badge = document.getElementById('userRoleBadge');

    if (profileData) {
        if (btnOpenLogin) btnOpenLogin.style.display = 'none';
        if (btnOpenRegister) btnOpenRegister.style.display = 'none';
        if (userInfoDisplay) userInfoDisplay.style.display = 'inline-flex';
        
        if (currentUserName) currentUserName.innerText = profileData.username || "Admin";

        if (badge) {
            if (profileData.role === "admin") {
                badge.innerText = "ผู้ดูแลระบบ";
                badge.style.backgroundColor = "#d9383a";
                badge.style.color = "white";
                badge.style.padding = "6px 12px";
                badge.style.borderRadius = "6px";
                badge.style.fontWeight = "bold";
                badge.style.display = "inline-block";
                
                if (currentUserFB) currentUserFB.innerHTML = `<i class="fa-solid fa-screwdriver-wrench"></i> ควบคุมระบบแอดมิน`;
                
                // 🔓 แสดงผลแบบ inline-flex เฉพาะตอนที่เป็นแอดมินเท่านั้น และใช้ !important พังทลายการซ่อนใน HTML
                if (tabAdmin) tabAdmin.style.setProperty('display', 'inline-flex', 'important');
                loadAdminDashboard(); 
            } else {
                badge.innerText = "ผู้ใช้งานทั่วไป";
                badge.style.backgroundColor = "#00c853";
                badge.style.color = "white";
                badge.style.padding = "6px 12px";
                badge.style.borderRadius = "6px";
                badge.style.fontWeight = "bold";
                badge.style.display = "inline-block";

                if (currentUserFB) currentUserFB.innerHTML = `<i class="fa-brands fa-facebook"></i> ${profileData.facebook || 'ไม่มีข้อมูลเฟส'}`;
                
                // 🔒 บังคับซ่อนทันทีถ้าเป็นผู้ใช้ทั่วไป
                if (tabAdmin) tabAdmin.style.setProperty('display', 'none', 'important');
            }
        }

        if (userPostSection) userPostSection.style.display = 'block';
        if (postAuthNotice) postAuthNotice.style.display = 'none';
        if (myProductsGrid) myProductsGrid.style.display = 'grid';
        if (manageAuthNotice) manageAuthNotice.style.display = 'none';

        const myId = profileData.uid || profileData.username;
        loadMyProducts(myId, profileData.role);
    } else {
        if (btnOpenLogin) btnOpenLogin.style.display = 'inline-flex';
        if (btnOpenRegister) btnOpenRegister.style.display = 'inline-flex';
        if (userInfoDisplay) userInfoDisplay.style.display = 'none';
        if (userPostSection) userPostSection.style.display = 'none';
        if (postAuthNotice) postAuthNotice.style.display = 'block';
        if (myProductsGrid) myProductsGrid.style.display = 'none';
        if (manageAuthNotice) manageAuthNotice.style.display = 'block';
        
        // 🔒 บังคับซ่อนถ้าผู้ใช้ทั่วไปยังไม่ได้เข้าสู่ระบบ
        if (tabAdmin) tabAdmin.style.setProperty('display', 'none', 'important');
    }
    loadMarketProducts();
}

// 🌐 ดักจับรักษาเสถียรภาพสิทธิ์ของ Firebase Auth (แอดมิน)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserProfile = {
            uid: user.uid,
            username: "ผู้ดูแลระบบ (Admin)",
            email: user.email,
            role: "admin",
            status: "approved"
        };
        renderUIForUser(currentUserProfile);
    } else {
        checkClientSession();
    }
});

function checkClientSession() {
    const savedUser = localStorage.getItem("market_client_session");
    if (savedUser) {
        currentUserProfile = JSON.parse(savedUser);
        renderUIForUser(currentUserProfile);
    } else {
        currentUserProfile = null;
        renderUIForUser(null);
    }
}

// --- 🔑 ฟอร์มกดยืนยันเข้าสู่ระบบ (Login) ---
document.getElementById('marketLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userInput = document.getElementById('loginEmail').value.trim();
    const passwordElem = document.getElementById('loginPass') || document.getElementById('loginPassword');
    const passwordInput = passwordElem ? passwordElem.value : '';

    if (!userInput) {
        alert("❌ กรุณากรอกชื่อผู้ใช้หรืออีเมล");
        return;
    }
    if (!passwordInput) {
        alert("❌ กรุณากรอกรหัสผ่าน");
        return;
    }

    if (currentLoginMode === "admin") {
        try {
            await signInWithEmailAndPassword(auth, userInput, passwordInput);
            alert("🔒 แอดมินเข้าสู่ระบบสำเร็จ!");
            
            if (typeof modal !== 'undefined' && modal) modal.style.display = 'none';
            const currentModal = document.getElementById('marketAuthModal') || document.getElementById('authModal');
            if (currentModal) currentModal.style.display = 'none';
            document.getElementById('marketLoginForm').reset();
        } catch (error) {
            console.error("Admin Login Error: ", error);
            alert("❌ ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง");
        }
    } else {
        try {
            const pendingDocSnap = await getDoc(doc(db, "checkuser", userInput));
            if (pendingDocSnap.exists()) {
                alert("⏳ บัญชีอยู่ระหว่างรอตรวจและอนุมัติเปิดระบบจากผู้ดูแลระบบ (Admin)");
                return;
            }

            const userDocSnap = await getDoc(doc(db, "market_users", userInput));

            if (!userDocSnap.exists()) {
                alert("❌ ชื่อผู้ใช้หรือรหัสผ่านผู้ใช้งานทั่วไปไม่ถูกต้อง");
                return;
            }

            const userData = userDocSnap.data();

            if (userData.username === userInput && userData.password === passwordInput) {
                localStorage.setItem("market_client_session", JSON.stringify(userData));
                currentUserProfile = userData;
                
                alert(`🎉 ยินดีต้อนรับคุณ ${userData.username}`);
                
                if (typeof modal !== 'undefined' && modal) modal.style.display = 'none';
                const currentModal = document.getElementById('marketAuthModal') || document.getElementById('authModal');
                if (currentModal) currentModal.style.display = 'none';
                
                document.getElementById('marketLoginForm').reset();
                renderUIForUser(currentUserProfile);
            } else {
                alert("❌ ชื่อผู้ใช้หรือรหัสผ่านผู้ใช้งานทั่วไปไม่ถูกต้อง");
            }

        } catch (error) {
            console.error("User Login Error: ", error);
            alert("ฐานข้อมูลขัดข้อง: " + error.message);
        }
    }
});

// --- 📝 ฟอร์มลงทะเบียนสมาชิกทั่วไป (เขียนข้อมูลไปรอที่ checkuser) ---
document.getElementById('marketRegisterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const facebookProfile = document.getElementById('regFacebook').value.trim();
    const phoneNumber = document.getElementById('regPhone').value.trim();

    if (password.length < 4) return alert("❌ รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร");
    if (password !== passwordConfirm) return alert("❌ รหัสผ่านยืนยันไม่ตรงกัน");

    try {
        const checkApprovedDoc = await getDoc(doc(db, "market_users", username));
        if (checkApprovedDoc.exists()) {
            alert("❌ ชื่อ Username นี้ถูกเปิดใช้งานในระบบแล้วครับ");
            return;
        }

        const checkPendingDoc = await getDoc(doc(db, "checkuser", username));
        if (checkPendingDoc.exists()) {
            alert("❌ ชื่อ Username นี้อยู่ในระหว่างการรอแอดมินอนุมัติอยู่แล้วครับ");
            return;
        }

        await setDoc(doc(db, "checkuser", username), {
            username: username,
            email: email,
            password: password, 
            facebook: facebookProfile || "ไม่ได้ระบุ",
            phone: phoneNumber || "ไม่ได้ระบุ",
            status: "pending",
            role: "user",
            createdAt: new Date().getTime()
        });

        alert("🎯 สมัครสมาชิกสำเร็จ! ข้อมูลของคุณถูกส่งไปรอการอนุมัติแล้ว กรุณารอแอดมินตรวจสอบครับ");
        
        if (typeof modal !== 'undefined' && modal) modal.style.display = 'none';
        const currentModal = document.getElementById('marketAuthModal') || document.getElementById('authModal');
        if (currentModal) currentModal.style.display = 'none';

        document.getElementById('marketRegisterForm').reset();
    } catch (error) {
        console.error("Register Error: ", error);
        alert("สมัครสมาชิกไม่สำเร็จ: " + error.message);
    }
});

// --- 🚪 ปุ่มออกจากระบบ (Logout) เคลียร์ทุกอย่างแล้ว Refresh ทันที ---
document.getElementById('btnUserLogout')?.addEventListener('click', async () => {
    if(confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        localStorage.removeItem("market_client_session");
        currentUserProfile = null;
        await signOut(auth);
        location.reload();
    }
});

// --- 📥 ระบบลงประกาศขายสินค้าใหม่ (เก็บข้อมูล จังหวัด และ เขต/อำเภอ) ---
document.getElementById('marketPostForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUserProfile) {
        const savedUser = localStorage.getItem("market_client_session");
        if (savedUser) {
            currentUserProfile = JSON.parse(savedUser);
        } else {
            return alert("กรุณาเข้าสู่ระบบก่อนดำเนินการครับ");
        }
    }

    const imageFile = document.getElementById('postImgFile').files[0];
    if(!imageFile) return alert("กรุณาเลือกไฟล์รูปภาพก่อนอัปโหลดครับ");

    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const IMGBB_API_KEY = '61396dd5826499ba211381d7218d3418';
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const resData = await response.json(); 
        if (!resData || !resData.data || !resData.data.url) throw new Error("ระบบรับฝากรูปภาพขัดข้อง");

        const newProduct = {
            title: document.getElementById('postTitle').value,
            price: Number(document.getElementById('postPrice').value),
            imgUrl: resData.data.url, 
            linkUrl: document.getElementById('postLinkUrl').value,
            province: document.getElementById('postProvince').value.trim(),
            district: document.getElementById('postDistrict').value.trim(),
            sellerName: currentUserProfile.facebook || currentUserProfile.username || "ผู้ใช้งาน",
            sellerUid: currentUserProfile.uid || currentUserProfile.username,
            createdAt: new Date().getTime()
        };

        await addDoc(collection(db, "market_products"), newProduct);
        alert("✅ เพิ่มสินค้าลงสู่หน้าตลาด Market สำเร็จแล้ว!");
        
        document.getElementById('marketPostForm').reset();
        switchTab('home');
        loadMarketProducts();
        loadMyProducts(currentUserProfile.uid || currentUserProfile.username, currentUserProfile.role);
    } catch (error) {
        alert("เพิ่มประกาศสินค้าล้มเหลว: " + error.message);
    }
});

// ==========================================
// 🎲 ฟังก์ชันสำหรับสุ่มตำแหน่ง Array (ระบบ Dynamic)
// ==========================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- 🌐 ดึงรายการสินค้าตลาดหน้าแรก (รวมระบบจัดเรียง และแก้บั๊กปีกกา) ---
async function loadMarketProducts() {
    const grid = document.getElementById('marketProductsGrid');
    if (!grid) return;
    const isAdmin = currentUserProfile && currentUserProfile.role === "admin";

    // ดึงค่าการจัดเรียงจาก Dropdown บนหน้า HTML
    const sortSelect = document.getElementById('marketSortSelect');
    const sortBy = sortSelect ? sortSelect.value : 'dynamic';

    try {
        // ดึงข้อมูลพื้นฐานเรียงตามล่าสุดจาก Firestore
        const q = query(collection(db, "market_products"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (snap.empty) { 
            grid.innerHTML = `<p style="text-align:center; padding:30px;">ยังไม่มีสินค้าวางขายในขณะนี้</p>`; 
            return; 
        }

        let products = [];
        snap.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // 🔄 คัดกรองการจัดเรียงตามที่ผู้ใช้เลือก
        if (sortBy === 'dynamic') {
            products = shuffleArray(products); // สุ่มทุกครั้งที่โหลด
        } else if (sortBy === 'price_asc') {
            products.sort((a, b) => a.price - b.price); // ราคา น้อย -> มาก
        } else if (sortBy === 'price_desc') {
            products.sort((a, b) => b.price - a.price); // ราคา มาก -> น้อย
        } else if (sortBy === 'latest') {
            products.sort((a, b) => b.createdAt - a.createdAt); // ใหม่สุดอยู่บน
        }

        grid.innerHTML = "";
        products.forEach((prod) => {
            const prodId = prod.id;

            const adminActionButtons = isAdmin ? `
                <div class="admin-quick-actions" style="position: absolute !important; top: 12px !important; right: 12px !important; z-index: 9999 !important; display: flex !important; gap: 6px !important;">
                    <button onclick="event.preventDefault(); event.stopPropagation(); adminEditProductLink('${prodId}');" style="background: #24292f !important; color: white !important; border: none !important; padding: 6px 12px !important; border-radius: 6px !important; font-size: 0.8rem !important; font-weight: bold !important; cursor: pointer !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; display: inline-flex !important; align-items: center !important; gap: 4px !important;"><i class="fa-solid fa-pen-to-square"></i> แก้ไข</button>
                    <button onclick="event.preventDefault(); event.stopPropagation(); adminDeleteProduct('${prodId}');" style="background: #d9383a !important; color: white !important; border: none !important; padding: 6px 12px !important; border-radius: 6px !important; font-size: 0.8rem !important; font-weight: bold !important; cursor: pointer !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; display: inline-flex !important; align-items: center !important; gap: 4px !important;"><i class="fa-solid fa-trash"></i> ลบ</button>
                </div>
            ` : '';

            const locationText = (prod.province && prod.district) ? `${prod.district}, จ.${prod.province}` : (prod.province || "ไม่ได้ระบุพื้นที่");

            const html = `
                <a href="${prod.linkUrl}" target="_blank" class="product-card" style="position: relative !important; display: block;">
                    ${adminActionButtons}
                    <div class="product-img-box"> <img src="${prod.imgUrl}" alt="${prod.title}"> </div>
                    <div class="product-info">
                        <div class="seller-name"><i class="fa-brands fa-facebook"></i> ${prod.facebook || prod.sellerName}</div>
                        <h3 class="product-title">${prod.title}</h3>
                        <div class="product-location" style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;"><i class="fa-solid fa-map-pin" style="color: #d9383a;"></i> ${locationText}</div>
                        <div class="product-footer">
                            <span class="product-price">฿${prod.price.toLocaleString()}</span>
                            <span class="visit-link-text">ไปหน้าโพสต์ <i class="fa-solid fa-chevron-right"></i></span>
                        </div>
                    </div>
                </a>`;
            grid.insertAdjacentHTML('beforeend', html);
        });
    } catch (err) { console.error(err); }
}

// --- 🛠️ ส่วนจัดการโพสต์ส่วนตัว ---
async function loadMyProducts(uid, role) {
    const grid = document.getElementById('myProductsGrid');
    if (!grid) return;
    grid.innerHTML = "";

    try {
        let q;
        if (role === "admin") {
            q = query(collection(db, "market_products"), orderBy("createdAt", "desc"));
        } else {
            q = query(collection(db, "market_products"), where("sellerUid", "==", uid));
        }

        const snap = await getDocs(q);
        if (snap.empty) { grid.innerHTML = `<p style="text-align:center; color:gray; padding:30px;">ยังไม่พบประวัติข้อมูลโพสต์ประกาศสินค้า</p>`; return; }

        snap.forEach((docSnap) => {
            const prod = docSnap.data();
            const prodId = docSnap.id;
            const locationText = (prod.province && prod.district) ? `${prod.district}, จ.${prod.province}` : (prod.province || "ไม่ได้ระบุพื้นที่");

            const html = `
                <div class="product-card" style="cursor:default;">
                    <div class="product-img-box"> <img src="${prod.imgUrl}"> </div>
                    <div class="product-info">
                        <h3 class="product-title">${prod.title}</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;"><i class="fa-solid fa-map-pin"></i> พื้นที่: ${locationText}</p>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px; word-break:break-all;">ลิงก์: ${prod.linkUrl}</p>
                        <div style="display:flex; gap:8px; margin-top:auto;">
                            <button onclick="adminEditProductLink('${prodId}')" style="flex:1; background:#24292f; color:white; border:none; padding:8px; border-radius:6px; font-size:0.8rem; cursor:pointer;"><i class="fa-solid fa-edit"></i> แก้ไขข้อมูล</button>
                            <button onclick="deleteProduct('${prodId}')" style="background:#ffebe9; color:#d9383a; border:1px solid #ff8585; padding:8px 12px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash"></i> ลบ</button>
                        </div>
                    </div>
                </div>`;
            grid.insertAdjacentHTML('beforeend', html);
        });
    } catch (err) { console.error(err); }
}

// --- 👑 หน้าควบคุมแดชบอร์ดหลังบ้านของแอดมิน ---
async function loadAdminDashboard() {
    const grid = document.getElementById('adminProductsGrid');
    if (grid) {
        grid.innerHTML = "";
        try {
            const q = query(collection(db, "market_products"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            snap.forEach((docSnap) => {
                const prod = docSnap.data();
                const prodId = docSnap.id;
                const locationText = (prod.province && prod.district) ? `${prod.district}, จ.${prod.province}` : (prod.province || "ไม่ได้ระบุพื้นที่");

                const html = `
                    <div class="product-card" style="cursor:default; border: 1px dashed #d9383a;">
                        <div class="product-img-box"> <img src="${prod.imgUrl}"> </div>
                        <div class="product-info">
                            <div style="font-size:0.75rem; color:#d9383a; font-weight:600;"><i class="fa-solid fa-user-tag"></i> ผู้ขาย: ${prod.sellerName}</div>
                            <h3 class="product-title" style="margin-top:4px;">${prod.title}</h3>
                            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;"><i class="fa-solid fa-map-pin"></i> พื้นที่: ${locationText}</p>
                            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px; word-break:break-all;">ลิงก์ปลายทาง: ${prod.linkUrl}</p>
                            <div style="display:flex; gap:8px; margin-top:auto;">
                                <button onclick="adminEditProductLink('${prodId}')" style="flex:1; background:#d9383a; color:white; border:none; padding:8px; border-radius:6px; font-size:0.8rem; cursor:pointer;"><i class="fa-solid fa-screwdriver-wrench"></i> บังคับแก้ไขลิงก์</button>
                                <button onclick="adminDeleteProduct('${prodId}')" style="background:#ff4d4d; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash-can"></i> ลบโพสต์</button>
                            </div>
                        </div>
                    </div>`;
                grid.insertAdjacentHTML('beforeend', html);
            });
        } catch (err) { console.error(err); }
    }

    const clientApprovalArea = document.getElementById('clientApprovalArea');
    if (clientApprovalArea) {
        clientApprovalArea.innerHTML = "<h4>รายชื่อสมาชิกที่รอกดอนุมัติ (Pending Users)</h4>";
        try {
            const qUsers = query(collection(db, "market_clients"), where("status", "==", "pending"));
            const snapUsers = await getDocs(qUsers);
            if(snapUsers.empty) {
                clientApprovalArea.innerHTML += "<p style='color:gray; font-size:0.9rem; padding:10px;'>ไม่มีผู้ใช้งานค้างรออนุมัติในระบบ</p>";
            } else {
                snapUsers.forEach((uDoc) => {
                    const uData = uDoc.data();
                    const htmlUser = `
                        <div style="background:#f8f9fa; border:1px solid #e1e4e6; padding:12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <div>
                                <strong>Username:</strong> ${uData.username} | <strong>Email:</strong> ${uData.email}<br>
                                <small>FB: ${uData.facebook || 'ไม่มี'} | โทร: ${uData.phone || 'ไม่มี'}</small>
                            </div>
                            <div style="margin-left:auto;">
                                <button onclick="approveClientUser('${uData.uid}')" style="background:#00c853; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.8rem;"><i class="fa-solid fa-check"></i> อนุมัติสิทธิ์</button>
                            </div>
                        </div>`;
                    clientApprovalArea.insertAdjacentHTML('beforeend', htmlUser);
                });
            }
        } catch (err) { console.error(err); }
    }
}

// --- ฟังก์ชันช่วยเหลือควบคุมระบบ ---
window.approveClientUser = async function(uid) {
    if (!currentUserProfile || currentUserProfile.role !== "admin") return;
    if (confirm("คุณต้องการอนุมัติสิทธิ์ให้ผู้ใช้งานรายนี้ล็อกอินเข้าสู่ระบบตลาดใช่หรือไม่?")) {
        try {
            await updateDoc(doc(db, "market_clients", uid), { status: "approved" });
            alert("✅ อนุมัติสิทธิ์การใช้งานของสมาชิกท่านนี้เรียบร้อย!");
            loadAdminDashboard();
        } catch (e) { alert("เกิดข้อผิดพลาดในการปรับสถานะสมาชิก"); }
    }
};

window.deleteProduct = async function(id) {
    if (!currentUserProfile) return;
    try {
        const docRef = doc(db, "market_products", id);
        const item = await getDoc(docRef);
        
        if (!item.exists()) return alert("❌ ไม่พบข้อมูลสินค้านี้");

        const currentUserId = currentUserProfile.uid || currentUserProfile.username;
        if (currentUserProfile.role !== "admin" && item.data().sellerUid !== currentUserId) {
            return alert("❌ ปฏิเสธ: คุณไม่ใช่เจ้าของโพสต์");
        }

        if(confirm("คุณต้องการลบโพสต์ประกาศสินค้านี้ใช่หรือไม่?")) {
            await deleteDoc(docRef);
            alert("ลบโพสต์สินค้าเสร็จสิ้น");
            
            const myId = currentUserProfile.uid || currentUserProfile.username;
            loadMyProducts(myId, currentUserProfile.role);
            loadMarketProducts();
        }
    } catch(e) { 
        console.error(e); 
        alert("เกิดข้อผิดพลาดในการลบ: " + e.message);
    }
};

window.adminDeleteProduct = async function(id) {
    if (!currentUserProfile || currentUserProfile.role !== "admin") return;
    if(confirm("⚠️ [ADMIN] คุณต้องการลบโพสต์ชิ้นนี้ใช่หรือไม่?")) {
        await deleteDoc(doc(db, "market_products", id));
        alert("แอดมินลบโพสต์เรียบร้อย");
        loadMarketProducts();
        loadAdminDashboard();
    }
};

// --- ฟังก์ชันดึงข้อมูลกางใส่ Popup แก้ไขข้อมูล ---
window.adminEditProductLink = async function(id) {
    if (!currentUserProfile) return alert("กรุณาเข้าสู่ระบบก่อนดำเนินการครับ");
    
    try {
        const docRef = doc(db, "market_products", id);
        const item = await getDoc(docRef);
        
        if (!item.exists()) return alert("❌ ไม่พบข้อมูลสินค้านี้ในระบบ");

        const prodData = item.data();
        
        const currentUserId = currentUserProfile.uid || currentUserProfile.username;
        if (currentUserProfile.role !== "admin" && prodData.sellerUid !== currentUserId) {
            return alert("❌ ปฏิเสธ: คุณไม่มีสิทธิ์แก้ไขโพสต์ของสมาชิกท่านอื่น");
        }

        document.getElementById('editProductId').value = id;
        document.getElementById('editProductTitle').value = prodData.title || "";
        document.getElementById('editProductPrice').value = prodData.price || 0;
        document.getElementById('editProductLinkUrl').value = prodData.linkUrl || "";
        document.getElementById('editProductProvince').value = prodData.province || "";
        document.getElementById('editProductDistrict').value = prodData.district || "";
        document.getElementById('editProductOldImgUrl').value = prodData.imgUrl || "";
        document.getElementById('editProductImgFile').value = "";
        
        if (editModal) {
            editModal.style.display = 'flex';
        } else {
            alert("❌ ไม่พบโครงสร้างหน้าต่างแก้ไขในหน้าเว็บ");
        }
    } catch (err) {
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + err.message);
    }
};

// 💾 ฟอร์มกดยืนยันบันทึกการแก้ไขสินค้าลงสู่ Firestore
editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserProfile) return alert("กรุณาเข้าสู่ระบบก่อนดำเนินการครับ");

    const id = document.getElementById('editProductId').value;
    const updatedTitle = document.getElementById('editProductTitle').value.trim();
    const updatedPrice = Number(document.getElementById('editProductPrice').value);
    const updatedLinkUrl = document.getElementById('editProductLinkUrl').value.trim();
    const updatedProvince = document.getElementById('editProductProvince').value.trim();
    const updatedDistrict = document.getElementById('editProductDistrict').value.trim();
    const oldImgUrl = document.getElementById('editProductOldImgUrl').value;
    const newImageFile = document.getElementById('editProductImgFile').files[0];
    
    const btnSubmit = document.getElementById('btnSubmitEditForm');
    let finalImgUrl = oldImgUrl;

    try {
        if (newImageFile) {
            if (btnSubmit) {
                btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังอัปโหลดรูปใหม่...`;
                btnSubmit.style.pointerEvents = 'none';
                btnSubmit.style.opacity = '0.7';
            }

            const formData = new FormData();
            formData.append('image', newImageFile);

            const IMGBB_API_KEY = '61396dd5826499ba211381d7218d3418';
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });

            const resData = await response.json();
            if (!resData || !resData.data || !resData.data.url) throw new Error("ระบบรับฝากรูปภาพขัดข้อง");
            
            finalImgUrl = resData.data.url;
        }

        const docRef = doc(db, "market_products", id);
        
        await updateDoc(docRef, {
            title: updatedTitle,
            price: updatedPrice,
            linkUrl: updatedLinkUrl,
            province: updatedProvince,
            district: updatedDistrict,
            imgUrl: finalImgUrl
        });

        alert("🎯 บันทึกการแก้ไขข้อมูลสินค้าเรียบร้อยแล้ว!");
        editModal.style.display = 'none';
        
        loadMarketProducts();
        const myId = currentUserProfile.uid || currentUserProfile.username;
        loadMyProducts(myId, currentUserProfile.role);
        if (currentUserProfile.role === "admin") {
            loadAdminDashboard();
        }
    } catch (error) {
        alert("บันทึกข้อมูลไม่สำเร็จ: " + error.message);
    } finally {
        if (btnSubmit) {
            btnSubmit.innerHTML = `บันทึกข้อมูล`;
            btnSubmit.style.pointerEvents = 'auto';
            btnSubmit.style.opacity = '1';
        }
    }
});

// ดักจับเมื่อผู้ใช้กดเปลี่ยนค่าในคอมโบดรอปดาวน์จัดเรียง
document.getElementById('marketSortSelect')?.addEventListener('change', () => {
    loadMarketProducts();
});

// เริ่มต้นโหลดสินค้าหน้าแรก
loadMarketProducts();