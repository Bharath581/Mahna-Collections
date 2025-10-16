// Demo catalog
const products = [
  { id: 1, name: "Classic White Shirt", category: "men", price: 1299, mrp: 1999, colors:["White"], sizes:["S","M","L"], rating: 4.5, image: "https://img.drz.lazcdn.com/g/kf/S68f75d24515e437aa81787882d93db4ca.jpg_720x720q80.jpg" },
  { id: 2, name: "Linen Blend Kurta", category: "men", price: 1699, mrp: 2499, colors:["Blue"], sizes:["M","L","XL"], rating: 4.3, image: "https://i.pinimg.com/originals/77/95/10/7795106ea5c8f1de76269c396d79d2f0.png" },
  { id: 3, name: "Floral Midi Dress", category: "women", price: 1999, mrp: 2999, colors:["Red","White"], sizes:["S","M","L"], rating: 4.7, image: "https://cdn-img.prettylittlething.com/1/9/5/b/195bdba8054bed9dec6f88babcf3a9cb3e3a3220_CLW7880_5.JPG" },
  { id: 4, name: "Kids Graphic Tee", category: "kids", price: 499, mrp: 799, colors:["Green"], sizes:["XS","S"], rating: 4.4, image: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_2000,h_2000/global/627394/24/mod01/fnd/PNA/fmt/png/PUMA-x-PLAYMOBIL%C2%AE-Little-Kids'-Graphic-Tee" },
  { id: 5, name: "Decor Cushion Cover", category: "home", price: 399, mrp: 599, colors:["Blue"], sizes:["M"], rating: 4.2, image: "https://images.woodenstreet.de/image/data/tara-sparkling-homes/set-of-2-noor-embroidered-cotton-silk-pastel-pink-and-green-cushion-cover/updated/TSH-1.jpg" },
  { id: 6, name: "Denim Jacket", category: "women", price: 2499, mrp: 3499, colors:["Blue","Black"], sizes:["S","M","L"], rating: 4.6, image: "https://ultimateleather.pk/wp-content/uploads/2017/12/New-Look-Denim-Jacket.jpg" },
];

// Global state
let filters = { category:"all", size:null, color:null, min:0, max:9999, sort:"relevance", search:"" };
let cart = JSON.parse(localStorage.getItem("cart")||"[]");
let wishlist = JSON.parse(localStorage.getItem("wishlist")||"[]");
let coupon = localStorage.getItem("coupon") || null;
let session = JSON.parse(localStorage.getItem("session")||"null");
let address = JSON.parse(localStorage.getItem("address")||"null");

// Routes
const routes = ["home","catalog","checkout","shipping","payment","summary","success","login","account"];
function showRoute(hash){
  const r = (hash || location.hash || "#home").replace("#","");
  routes.forEach(id=>document.getElementById(id)?.classList.add("hidden"));
  const to = routes.includes(r) ? r : "home";
  document.getElementById(to)?.classList.remove("hidden");
  highlightNav(to);
  if (to==="catalog") { ensureCatalogBound(); renderGrid(); }
  if (to==="checkout") { renderCheckout(); }
  if (to==="shipping") { guardLogin(); prefillAddress(); }
  if (to==="payment") { guardCheckout(); }
  if (to==="summary") { renderSummary(); }
  if (to==="login") { prepLogin(); }
  if (to==="account") { guardLogin(); renderAccount(); }
}
window.addEventListener("hashchange", ()=>showRoute());
document.addEventListener("DOMContentLoaded", ()=>showRoute());

function highlightNav(route){
  document.querySelectorAll('nav a[data-route]').forEach(a=>{
    a.classList.toggle("active", a.getAttribute("href")==="#"+route);
  });
  document.getElementById("navLogin")?.classList.toggle("hidden", !!session);
  document.getElementById("navAccount")?.classList.toggle("hidden", !session);
}

// Bind catalog once
let catalogBound = false;
function ensureCatalogBound(){
  if (catalogBound) return;
  catalogBound = true;

  const searchEl = document.getElementById("search");
  const filterCategory = document.getElementById("filterCategory");
  const priceMin = document.getElementById("priceMin");
  const priceMax = document.getElementById("priceMax");
  const minVal = document.getElementById("minVal");
  const maxVal = document.getElementById("maxVal");
  const sortBy = document.getElementById("sortBy");

  searchEl.addEventListener("input",()=>{ filters.search = searchEl.value.trim().toLowerCase(); renderGrid(); });
  filterCategory.addEventListener("change",()=>{ filters.category = filterCategory.value; renderGrid(); });
  document.querySelectorAll('.chip[data-size]').forEach(btn=>{
    btn.addEventListener("click",()=>{ document.querySelectorAll('.chip[data-size]').forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); filters.size = btn.dataset.size; renderGrid(); });
  });
  document.querySelectorAll('.chip[data-color]').forEach(btn=>{
    btn.addEventListener("click",()=>{ document.querySelectorAll('.chip[data-color]').forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); filters.color = btn.dataset.color; renderGrid(); });
  });
  priceMin.addEventListener("input",()=>{ filters.min = +priceMin.value; minVal.textContent = filters.min; renderGrid(); });
  priceMax.addEventListener("input",()=>{ filters.max = +priceMax.value; maxVal.textContent = filters.max; renderGrid(); });
  sortBy.addEventListener("change",()=>{ filters.sort = sortBy.value; renderGrid(); });
  document.getElementById("clearFilters").addEventListener("click",()=>{
    filters = { category:"all", size:null, color:null, min:0, max:9999, sort:"relevance", search:"" };
    searchEl.value=""; filterCategory.value="all"; minVal.textContent="0"; maxVal.textContent="9999";
    priceMin.value=0; priceMax.value=9999;
    document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active"));
    renderGrid();
  });

  // Cart / Wishlist
  document.getElementById("wishlistBtn").addEventListener("click",()=>openWishlist());
  document.getElementById("closeWishlist").addEventListener("click",()=>closeWishlist());
  document.getElementById("cartBtn").addEventListener("click",()=>openCart());
  document.getElementById("closeCart").addEventListener("click",()=>closeCart());
  document.getElementById("applyCoupon").addEventListener("click",()=>{
    coupon = document.getElementById("couponCode").value.trim().toUpperCase() || null;
    localStorage.setItem("coupon", coupon || "");
    renderCartItems();
  });
  document.getElementById("goCheckout").addEventListener("click",()=>{ updateSummary(); });
}

// Grid render
function renderGrid(){
  const grid = document.getElementById("productGrid");
  let list = products.slice();
  if (filters.category!=="all") list = list.filter(p=>p.category===filters.category);
  if (filters.size) list = list.filter(p=>p.sizes.includes(filters.size));
  if (filters.color) list = list.filter(p=>p.colors.includes(filters.color));
  list = list.filter(p=>p.price>=filters.min && p.price<=filters.max);
  if (filters.search) list = list.filter(p=>p.name.toLowerCase().includes(filters.search));
  if (filters.sort==="priceAsc") list.sort((a,b)=>a.price-b.price);
  if (filters.sort==="priceDesc") list.sort((a,b)=>b.price-a.price);
  if (filters.sort==="ratingDesc") list.sort((a,b)=>b.rating-a.rating);
  grid.innerHTML = list.map(cardHTML).join("");
  grid.querySelectorAll(".add-cart").forEach(btn=>btn.addEventListener("click",()=>addToCart(+btn.dataset.id)));
  grid.querySelectorAll(".add-wish").forEach(btn=>btn.addEventListener("click",()=>toggleWishlist(+btn.dataset.id)));
  grid.querySelectorAll(".open-pdp").forEach(btn=>btn.addEventListener("click",()=>openPdp(+btn.dataset.id)));
}
function cardHTML(p){
  const inWish = wishlist.includes(p.id);
  return `
    <article class="card">
      <img src="${p.image}" alt="${p.name}" class="img open-pdp" data-id="${p.id}">
      <div class="body">
        <div class="muted">${p.category.toUpperCase()}</div>
        <h4>${p.name}</h4>
        <div class="price">₹${p.price} <span class="muted" style="text-decoration:line-through">₹${p.mrp}</span></div>
        <div class="rating">★ ${p.rating.toFixed(1)}</div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn add-cart" data-id="${p.id}">Add to Cart</button>
          <button class="btn-light add-wish" data-id="${p.id}">${inWish ? "Wishlisted" : "Wishlist"}</button>
        </div>
      </div>
    </article>
  `;
}

// Cart
function persistCart(){ localStorage.setItem("cart", JSON.stringify(cart)); }
function subtotal(){ return cart.reduce((s,x)=>s+x.qty*x.price,0); }
function discountAmount(){ return (localStorage.getItem("coupon")||coupon)==="FASHION10" ? Math.round(subtotal()*0.10) : 0; }
function total(){ return Math.max(0, subtotal()-discountAmount()); }
function refreshCartUI(){
  document.getElementById("cartCount").textContent = cart.reduce((s,x)=>s+x.qty,0);
  document.getElementById("wishlistCount").textContent = wishlist.length;
}
function addToCart(id){
  const p = products.find(p=>p.id===id);
  const existing = cart.find(x=>x.id===id);
  if (existing) existing.qty += 1; else cart.push({ id, qty:1, price:p.price, name:p.name, image:p.image });
  persistCart(); refreshCartUI();
}
function removeFromCart(id){ cart = cart.filter(x=>x.id!==id); persistCart(); refreshCartUI(); renderCartItems(); }
function changeQty(id,delta){
  const it = cart.find(x=>x.id===id); if (!it) return;
  it.qty += delta; if (it.qty<=0) removeFromCart(id); persistCart(); refreshCartUI(); renderCartItems();
}
function openCart(){ document.getElementById("cartDrawer").classList.remove("hidden"); renderCartItems(); }
function closeCart(){ document.getElementById("cartDrawer").classList.add("hidden"); }
function renderCartItems(){
  const box = document.getElementById("cartItems");
  if (cart.length===0){ box.innerHTML = `<p class="muted">Your cart is empty.</p>`; }
  else {
    box.innerHTML = cart.map(x=>`
      <div class="cart-row">
        <img src="${x.image}" alt="${x.name}">
        <div>
          <div>${x.name}</div>
          <div class="muted">₹${x.price}</div>
          <div class="cart-qty">
            <button class="btn-light" onclick="changeQty(${x.id},-1)">-</button>
            <span>${x.qty}</span>
            <button class="btn-light" onclick="changeQty(${x.id},1)">+</button>
            <button class="btn-light" onclick="removeFromCart(${x.id})">Remove</button>
          </div>
        </div>
        <div>₹${x.qty * x.price}</div>
      </div>
    `).join("");
  }
  document.getElementById("subtotal").textContent = "₹"+subtotal();
  document.getElementById("discount").textContent = "-₹"+discountAmount();
  document.getElementById("total").textContent = "₹"+total();
}

// Wishlist
function toggleWishlist(id){
  if (wishlist.includes(id)) wishlist = wishlist.filter(x=>x!==id); else wishlist.push(id);
  localStorage.setItem("wishlist", JSON.stringify(wishlist)); refreshCartUI(); renderGrid();
}
document.getElementById("wishlistBtn").addEventListener("click",()=>openWishlist());
document.getElementById("closeWishlist").addEventListener("click",()=>closeWishlist());
function openWishlist(){
  document.getElementById("wishlistModal").classList.remove("hidden");
  const box = document.getElementById("wishlistItems");
  const w = products.filter(p=>wishlist.includes(p.id));
  box.innerHTML = w.length? w.map(p=>`
    <div class="cart-row">
      <img src="${p.image}" alt="${p.name}">
      <div>
        <div>${p.name}</div>
        <div class="muted">₹${p.price}</div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn" onclick="addToCart(${p.id})">Add to Cart</button>
          <button class="btn-light" onclick="toggleWishlist(${p.id})">Remove</button>
        </div>
      </div>
    </div>
  `).join("") : `<p class="muted">No items in wishlist.</p>`;
}
function closeWishlist(){ document.getElementById("wishlistModal").classList.add("hidden"); }

// PDP
function openPdp(id){
  const p = products.find(x=>x.id===id);
  const box = document.getElementById("pdpContent");
  document.getElementById("pdpTitle").textContent = p.name;
  box.innerHTML = `
    <div class="grid-2">
      <img src="${p.image}" alt="${p.name}" style="width:100%; border-radius:12px; object-fit:cover;">
      <div>
        <div class="price">₹${p.price} <span class="muted" style="text-decoration:line-through">₹${p.mrp}</span></div>
        <div class="rating" style="margin:8px 0;">★ ${p.rating.toFixed(1)}</div>
        <div style="margin:8px 0;">Sizes: ${p.sizes.map(s=>`<span class="chip">${s}</span>`).join(" ")}</div>
        <div style="margin:8px 0;">Colors: ${p.colors.map(c=>`<span class="chip">${c}</span>`).join(" ")}</div>
        <button class="btn" onclick="addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  `;
  document.getElementById("pdpModal").classList.remove("hidden");
}
document.getElementById("closePdp").addEventListener("click",()=>document.getElementById("pdpModal").classList.add("hidden"));

// Checkout page
function renderCheckout(){
  const box = document.getElementById("checkoutItems");
  if (!cart.length) { box.innerHTML = `<p class="muted">Cart empty. <a href="#catalog">Shop now</a></p>`; }
  else {
    box.innerHTML = cart.map(x=>`
      <div class="summary-line"><span>${x.name} × ${x.qty}</span><span>₹${x.qty*x.price}</span></div>
    `).join("");
  }
  document.getElementById("ckSubtotal").textContent="₹"+subtotal();
  document.getElementById("ckDiscount").textContent="-₹"+discountAmount();
  document.getElementById("ckTotal").textContent="₹"+total();
  document.getElementById("ckApply").onclick = ()=>{
    const c = document.getElementById("ckCoupon").value.trim().toUpperCase();
    coupon = c || null; localStorage.setItem("coupon", coupon || "");
    renderCheckout();
  };
}

// Shipping
function prefillAddress(){
  if (address){
    document.getElementById("fullName").value = address.fullName||"";
    document.getElementById("phone").value = address.phone||"";
    document.getElementById("line1").value = address.line1||"";
    document.getElementById("city").value = address.city||"";
    document.getElementById("state").value = address.state||"";
    document.getElementById("pin").value = address.pin||"";
  }
}
document.getElementById("addressForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  address = {
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    line1: document.getElementById("line1").value.trim(),
    city: document.getElementById("city").value.trim(),
    state: document.getElementById("state").value.trim(),
    pin: document.getElementById("pin").value.trim(),
  };
  localStorage.setItem("address", JSON.stringify(address));
  location.hash = "#payment";
});

// Success toast
function showToast(message) {
  const box = document.getElementById("toast");
  const msg = document.getElementById("toastMsg");
  msg.textContent = message || "Your order was placed successfully. Visit again!";
  box.classList.remove("hidden");
  void box.offsetWidth; // reflow to enable transition
  box.classList.add("show");
  setTimeout(()=>{
    box.classList.remove("show");
    setTimeout(()=>box.classList.add("hidden"), 250);
  }, 3000);
}

// Payment (client demo)
document.getElementById("payNow").addEventListener("click", ()=>{
  if (!cart.length) return alert("Cart empty");
  const method = document.querySelector('input[name="paymethod"]:checked')?.value || "razorpay";
  if (method==="cod"){
    completeOrder("COD-DEMO");
  } else {
    const options = {
      key: "rzp_test_1234567890",
      amount: total()*100,
      currency: "INR",
      name: "Fashion",
      description: "Test Transaction",
      handler: function (response){
        completeOrder(response.razorpay_payment_id || "RZP-DEMO");
      },
      prefill: { name: address?.fullName || "Fashion Customer", email: session?.email || "test@example.com", contact: address?.phone || "9999999999" },
      theme: { color: "#111111" }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }
});

function completeOrder(paymentId){
  const order = {
    id: "ORD-"+Date.now(),
    paymentId,
    items: cart.slice(),
    total: total(),
    address
  };
  localStorage.setItem("lastOrder", JSON.stringify(order));
  cart = []; persistCart(); refreshCartUI();
  showToast("Your order was successfully completed. Visit again!");
  location.hash = "#success"; // or "#summary" if summary first
}

// Summary
function renderSummary(){
  const order = JSON.parse(localStorage.getItem("lastOrder")||"null");
  const box = document.getElementById("summaryItems");
  if (!order){ box.innerHTML = `<p class="muted">No recent order.</p>`; return; }
  box.innerHTML = order.items.map(x=>`
    <div class="summary-line"><span>${x.name} × ${x.qty}</span><span>₹${x.qty*x.price}</span></div>
  `).join("");
  document.getElementById("summaryTotal").textContent = "₹"+order.total;
}

// Guards
function guardLogin(){
  if (!session){ alert("Login required"); location.hash="#login"; }
}
function guardCheckout(){
  if (!cart.length){ alert("Cart empty"); location.hash="#catalog"; return; }
  if (!address){ alert("Add shipping address"); location.hash="#shipping"; }
}

// Login
function prepLogin(){
  document.getElementById("loginForm").onsubmit = (e)=>{
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if (!email || !password) return;
    session = { email, token: "demo-"+Math.random().toString(36).slice(2) };
    if (document.getElementById("remember").checked){
      localStorage.setItem("session", JSON.stringify(session));
    }
    document.getElementById("accountEmail").textContent = email;
    location.hash = "#account";
  };
}
function renderAccount(){
  document.getElementById("accountEmail").textContent = session?.email || "";
}
document.getElementById("logoutBtn").addEventListener("click", ()=>{
  session = null; localStorage.removeItem("session"); highlightNav("home"); location.hash="#home";
});

// Init
refreshCartUI();
// Hamburger toggle
const hamburger = document.getElementById('hamburgerBtn');
const nav = document.getElementById('mainNav');
hamburger.addEventListener('click', () => {
  nav.classList.toggle('nav-open');
});
