function navigate(pageId) {
    if (pageId === 'home') window.location.href = 'index.html';
    else window.location.href = pageId + '.html';
}

let cartItems = JSON.parse(localStorage.getItem('mamaMiaCart')) || [];

// Failsafe: Kalau data lama nyimpen error (NaN), otomatis bersihkan cart
if(cartItems.some(item => isNaN(item.price))) {
    cartItems = [];
    localStorage.setItem('mamaMiaCart', JSON.stringify(cartItems));
}

function saveCart() { localStorage.setItem('mamaMiaCart', JSON.stringify(cartItems)); }

function renderCart() {
    const cartContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total');
    const cartCountEl = document.getElementById('cart-count');
    
    let total = 0, totalQty = 0;
    cartItems.forEach(item => { total += item.price * item.qty; totalQty += item.qty; });
    if(cartCountEl) cartCountEl.innerText = totalQty;

    if (cartContainer && cartTotalEl) {
        cartContainer.innerHTML = '';
        if (cartItems.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p>Your cart is empty.</p>
                </div>`;
        } else {
            cartItems.forEach((item, index) => {
                const subtotal = item.price * item.qty;
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item-row';
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price-unit">$${item.price} each</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="cart-qty-box">
                            <button class="cart-qty-btn dec-cart" data-index="${index}">-</button>
                            <span class="cart-qty-val">${item.qty}</span>
                            <button class="cart-qty-btn inc-cart" data-index="${index}">+</button>
                        </div>
                        <div class="cart-item-subtotal">$${subtotal}</div>
                        <button class="cart-item-del del-cart" data-index="${index}">
                            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                        </button>
                    </div>`;
                cartContainer.appendChild(itemEl);
            });
        }
        cartTotalEl.innerText = total;

        document.querySelectorAll('.inc-cart').forEach(btn => btn.addEventListener('click', (e) => { cartItems[e.currentTarget.dataset.index].qty++; saveCart(); renderCart(); updateMenuUI(); }));
        document.querySelectorAll('.dec-cart').forEach(btn => btn.addEventListener('click', (e) => { let idx = e.currentTarget.dataset.index; if (cartItems[idx].qty > 1) cartItems[idx].qty--; else cartItems.splice(idx, 1); saveCart(); renderCart(); updateMenuUI(); }));
        document.querySelectorAll('.del-cart').forEach(btn => btn.addEventListener('click', (e) => { cartItems.splice(e.currentTarget.dataset.index, 1); saveCart(); renderCart(); updateMenuUI(); }));
    }
}

function updateMenuUI() {
    if(document.querySelectorAll('.menu-item').length > 0) {
        document.querySelectorAll('.menu-item').forEach(el => {
            const name = el.querySelector('.item-name').innerText;
            const qtyEl = el.querySelector('.item-qty');
            const item = cartItems.find(i => i.name === name);
            qtyEl.innerText = item ? item.qty : '0';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateMenuUI();

    document.querySelectorAll('.menu-item').forEach(itemEl => {
        const incBtn = itemEl.querySelector('.inc-btn');
        const decBtn = itemEl.querySelector('.dec-btn');
        const name = itemEl.querySelector('.item-name').innerText;
        
        // BUG FIX DI SINI: Panggil .item-price-val agar cuma baca angkanya (misal: 35), bukan simbol dolarnya ($35)
        const priceEl = itemEl.querySelector('.item-price-val');
        const price = priceEl ? parseInt(priceEl.innerText) : 0;
        
        incBtn.addEventListener('click', () => {
            let item = cartItems.find(i => i.name === name);
            if(item) item.qty++; else cartItems.push({name, price, qty: 1});
            saveCart(); renderCart(); updateMenuUI();
        });

        decBtn.addEventListener('click', () => {
            let index = cartItems.findIndex(i => i.name === name);
            if(index > -1) {
                if(cartItems[index].qty > 1) cartItems[index].qty--; else cartItems.splice(index, 1);
                saveCart(); renderCart(); updateMenuUI();
            }
        });
    });

    const checkoutForm = document.getElementById('checkout-form');
    if(checkoutForm) {
        const errorDiv = document.getElementById('form-error');
        const successDiv = document.getElementById('form-success');
        const orderContent = document.getElementById('order-content');

        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            errorDiv.style.display = 'none'; errorDiv.innerText = '';
            
            const name = document.getElementById('order-name').value.trim();
            const phone = document.getElementById('order-phone').value.trim();
            const payment = document.getElementById('order-payment').value;
            const serviceRadios = document.getElementsByName('service');
            
            if(cartItems.length === 0) return showError('Your cart is empty. Please add items before checking out.');

            let isServiceSelected = false;
            for(let i=0; i<serviceRadios.length; i++) if(serviceRadios[i].checked) isServiceSelected = true;
            if(!isServiceSelected) return showError('Please select a Service Option (Dine-in or Take-away).');

            if(name === '') return showError('Full Name is required.');
            let isAlpha = true;
            for (let i = 0; i < name.length; i++) {
                let code = name.charCodeAt(i);
                if (!(code > 64 && code < 91) && !(code > 96 && code < 123) && !(code === 32)) { isAlpha = false; break; }
            }
            if(!isAlpha) return showError('Name can only contain alphabetic characters and spaces.');

            if(phone === '') return showError('Phone Number is required.');
            let isNumeric = true;
            for(let i=0; i<phone.length; i++) {
                if(phone[i] < '0' || phone[i] > '9') { isNumeric = false; break; }
            }
            if(!isNumeric) return showError('Phone Number must contain only numbers.');
            if(phone.length < 8) return showError('Phone Number must be at least 8 digits long.');
            if(payment === '') return showError('Please select a Payment Method.');

            orderContent.style.display = 'none';
            successDiv.style.display = 'block';
            window.scrollTo(0, 0);
            
            cartItems = []; saveCart(); renderCart();
            setTimeout(() => { checkoutForm.reset(); orderContent.style.display = 'flex'; successDiv.style.display = 'none'; }, 6000);
        });

        function showError(msg) {
            errorDiv.innerText = msg; errorDiv.style.display = 'block';
            window.scrollTo({ top: document.getElementById('order').offsetTop, behavior: 'smooth' });
        }
    }
});