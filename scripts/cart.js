// Cart functionality for FoodCrave with M-Pesa Till Number 3628254
let cart = JSON.parse(localStorage.getItem('foodcraveCart')) || [];
let currentCategory = 'burgers';

// WhatsApp Business API Configuration
const WhatsAppConfig = {
  apiUrl: 'https://api.waboxapp.com/v1/send/chat',
  token: '757dd55e6145da0d7756b5aa088012776842028ac368e', // Your WABOXAPP token
  uid: '254728671638' // Your WhatsApp number
};

// Find item by ID
function findItemById(id) {
    for (const category in menuData) {
        const item = menuData[category].find(item => item.id === id);
        if (item) return item;
    }
    return null;
}

// Add to cart
function addToCart(itemId) {
    const item = findItemById(itemId);
    if (!item) return;
    
    const existingItem = cart.find(cartItem => cartItem.itemId === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.totalPrice = existingItem.basePrice * existingItem.quantity;
    } else {
        const cartItem = {
            id: Date.now(),
            itemId: itemId,
            name: item.name,
            basePrice: item.basePrice,
            image: item.image,
            quantity: 1,
            totalPrice: item.basePrice
        };
        cart.push(cartItem);
    }
    
    saveCart();
    updateCartDisplay();
    showNotification(`${item.name} added to cart!`);
}

// Toggle cart visibility
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        overlay.classList.remove('hidden');
        setTimeout(() => {
            sidebar.classList.remove('translate-x-full');
        }, 10);
    } else {
        sidebar.classList.add('translate-x-full');
        setTimeout(() => {
            sidebar.classList.add('hidden');
            overlay.classList.add('hidden');
        }, 300);
    }
}

// Update cart display
function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-12">
                <p class="text-gray-500 text-lg mb-4">Your cart is empty</p>
                <p class="text-gray-400">Add some delicious items to get started!</p>
            </div>
        `;
        cartSummary.classList.add('hidden');
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="flex items-start space-x-4 p-4 border rounded-lg mb-4">
            <div class="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-800">${item.name}</h4>
                <div class="flex justify-between items-center mt-2">
                    <span class="font-semibold text-primary">KSh ${item.totalPrice}</span>
                    <div class="flex items-center space-x-2">
                        <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" 
                                class="bg-gray-200 hover:bg-gray-300 w-6 h-6 rounded text-sm">-</button>
                        <span class="w-8 text-center text-sm">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" 
                                class="bg-gray-200 hover:bg-gray-300 w-6 h-6 rounded text-sm">+</button>
                        <button onclick="removeFromCart(${item.id})" 
                                class="text-red-500 hover:text-red-700 w-6 h-6 text-sm">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    updateCartSummary();
    cartSummary.classList.remove('hidden');
}

// Update cart summary
function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const deliveryFee = 200;
    const total = subtotal + deliveryFee;
    
    document.getElementById('subtotal').textContent = `KSh ${subtotal.toLocaleString()}`;
    document.getElementById('total').textContent = `KSh ${Math.round(total).toLocaleString()}`;
}

// Update item quantity
function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return;
    
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        cart[itemIndex].totalPrice = cart[itemIndex].basePrice * newQuantity;
        saveCart();
        updateCartDisplay();
    }
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartDisplay();
    showNotification('Item removed from cart');
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('foodcraveCart', JSON.stringify(cart));
}

// Show customer details modal
function showCustomerDetails() {
    toggleCart();
    document.getElementById('customer-details-modal').classList.remove('hidden');
}

// Hide customer details modal
function hideCustomerDetails() {
    document.getElementById('customer-details-modal').classList.add('hidden');
}

// Enhanced WhatsApp Business API function
async function sendWhatsAppMessage(phone, message) {
    try {
        // Format phone number
        let formattedPhone = phone.replace(/[+\s]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('7')) {
            formattedPhone = '254' + formattedPhone;
        }
        
        if (!/^254[17]\d{8}$/.test(formattedPhone)) {
            console.error('Invalid Kenyan phone number:', phone);
            return false;
        }

        const payload = {
            token: WhatsAppConfig.token,
            uid: WhatsAppConfig.uid,
            to: formattedPhone,
            text: message,
            custom_uid: `msg-${Date.now()}`
        };

        console.log('Sending WhatsApp to:', formattedPhone);
        console.log('Using API Token:', WhatsAppConfig.token);
        
        const response = await fetch(WhatsAppConfig.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.success) {
            return true;
        } else {
            console.error('API error:', result.message);
            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
            return false;
        }
    } catch (error) {
        console.error('WhatsApp error:', error);
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
        return false;
    }
}

// Process payment with Till Number 3628254
async function processPayment() {
    const form = document.getElementById('customer-details-form');
    const formData = new FormData(form);
    const paymentMethod = formData.get('payment');
    const customerPhone = formData.get('phone');
    
    // Validate form
    if (!formData.get('name') || !customerPhone || !formData.get('address')) {
        showNotification('Please fill in all required fields');
        return;
    }
    
    // Validate phone number
    if (!/^(\+?254|0)[17]\d{8}$/.test(customerPhone)) {
        showNotification('Please enter a valid Kenyan phone number');
        return;
    }
    
    // Show processing modal
    document.getElementById('customer-details-modal').classList.add('hidden');
    document.getElementById('payment-processing-modal').classList.remove('hidden');
    
    // Prepare order details
    const subtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const deliveryFee = 200;
    const total = subtotal + deliveryFee;
    const orderNumber = Date.now().toString().slice(-6);
    
    // Process M-Pesa payment
    if (paymentMethod === 'mpesa') {
        document.getElementById('payment-processing-modal').innerHTML = `
            <div class="text-center p-6">
                <h3 class="text-lg font-semibold text-gray-800">Complete M-Pesa Payment</h3>
                <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p class="font-medium text-gray-800">Send Money to Till Number:</p>
                    <p class="text-3xl font-bold text-green-600 my-2">3628254</p>
                    <p class="text-lg">Amount: <span class="font-bold">KSh ${total}</span></p>
                    <p class="text-sm text-gray-600 mt-2">Order #${orderNumber}</p>
                </div>
                <div class="mt-4 text-left bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-gray-600">1. Go to M-Pesa menu</p>
                    <p class="text-sm text-gray-600">2. Select "Lipa na M-Pesa"</p>
                    <p class="text-sm text-gray-600">3. Select "Buy Goods and Services"</p>
                    <p class="text-sm text-gray-600">4. Enter Till Number <span class="font-semibold">3628254</span></p>
                    <p class="text-sm text-gray-600">5. Enter Amount <span class="font-semibold">${total}</span></p>
                    <p class="text-sm text-gray-600">6. Enter your M-Pesa PIN</p>
                    <p class="text-sm text-gray-600">7. Confirm payment</p>
                </div>
                <div class="mt-6">
                    <button onclick="verifyManualPayment('${orderNumber}', ${total})" 
                            class="bg-green-600 text-white px-4 py-2 rounded-lg mr-2">
                        I've Made Payment
                    </button>
                    <button onclick="cancelPayment()" 
                            class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        // Store order details
        sessionStorage.setItem('pendingOrder', JSON.stringify({
            customerPhone,
            total,
            orderNumber,
            customerName: formData.get('name'),
            address: formData.get('address'),
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.basePrice
            })),
            paymentMethod: 'M-Pesa (Till 3628254)'
        }));
    } else {
        // Cash on delivery
        completeOrder({
            customerPhone,
            total,
            orderNumber,
            customerName: formData.get('name'),
            address: formData.get('address'),
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.basePrice
            })),
            paymentMethod: 'Cash on Delivery'
        });
    }
}

// Verify manual payment
async function verifyManualPayment(orderNumber, amount) {
    document.getElementById('payment-processing-modal').innerHTML = `
        <div class="text-center p-6">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h3 class="text-lg font-semibold text-gray-800">Verifying Payment</h3>
            <p class="text-gray-600 mt-2">Please wait...</p>
        </div>
    `;
    
    setTimeout(() => {
        const order = JSON.parse(sessionStorage.getItem('pendingOrder'));
        if (order) {
            completeOrder({
                ...order,
                mpesaReceiptNumber: 'MP' + Math.floor(Math.random() * 1000000)
            });
        } else {
            showNotification('Error verifying payment');
            document.getElementById('payment-processing-modal').classList.add('hidden');
        }
    }, 3000);
}

// Complete order with enhanced UI
async function completeOrder(orderData) {
    // Prepare messages
    const orderItems = orderData.items.map(item => 
        `${item.name} (${item.quantity} × KSh ${item.price})`
    ).join('\n');
    
    const customerMessage = `📋 *FoodCrave Order Confirmation*\n\n` +
        `Hello ${orderData.customerName},\n\n` +
        `Your order (#${orderData.orderNumber}) is confirmed!\n\n` +
        `*Items:*\n${orderItems}\n\n` +
        `*Total:* KSh ${orderData.total.toLocaleString()}\n` +
        `*Payment:* ${orderData.paymentMethod}` +
        (orderData.mpesaReceiptNumber ? ` (Receipt: ${orderData.mpesaReceiptNumber})` : '') + `\n` +
        `*Delivery to:* ${orderData.address}\n\n` +
        `Thank you!`;
    
    const restaurantMessage = `🍽️ *New Order* #${orderData.orderNumber}\n\n` +
        `*Customer:* ${orderData.customerName}\n` +
        `*Phone:* ${orderData.customerPhone}\n\n` +
        `*Items:*\n${orderItems}\n\n` +
        `*Total:* KSh ${orderData.total.toLocaleString()}\n` +
        `*Payment:* ${orderData.paymentMethod}` +
        (orderData.mpesaReceiptNumber ? ` (${orderData.mpesaReceiptNumber})` : '') + `\n` +
        `*Address:* ${orderData.address}`;
    
    // Send notifications
    let notificationsSent = true;
    try {
        console.log('Attempting to send WhatsApp notifications...');
        const customerSent = await sendWhatsAppMessage(orderData.customerPhone, customerMessage);
        const restaurantSent = await sendWhatsAppMessage('254728671638', restaurantMessage);
        notificationsSent = customerSent && restaurantSent;
        console.log('Notification status:', { customerSent, restaurantSent });
    } catch (error) {
        console.error('Notification error:', error);
        notificationsSent = false;
    }
    
    // Show confirmation with enhanced UI
    document.getElementById('payment-processing-modal').classList.add('hidden');
    
    const confirmationHTML = `
        <div class="text-center p-6" style="background: linear-gradient(135deg, #f5f7fa 0%, #e4f0f9 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <svg class="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h3>
            <p class="text-lg text-gray-600 mb-6">${orderData.paymentMethod.includes('M-Pesa') ? 'Payment received!' : 'Your food is on the way!'}</p>
            
            <div class="bg-white p-4 rounded-lg shadow-inner mb-6 text-left">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <span class="font-medium">Order #:</span>
                    <span class="font-semibold">${orderData.orderNumber}</span>
                </div>
                <div class="flex justify-between border-b pb-2 mb-2">
                    <span class="font-medium">Total:</span>
                    <span class="font-bold text-green-600">KSh ${orderData.total.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">Payment:</span>
                    <span class="font-semibold">${orderData.paymentMethod}</span>
                </div>
            </div>
            
            ${!notificationsSent ? `
            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 text-left">
                <p>Please save this order number for reference.</p>
            </div>
            ` : `
            <p class="text-blue-600 mb-6">
                <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Confirmation sent to your WhatsApp
            </p>
            `}
            
            <button onclick="closeOrderConfirmation()" 
                    class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
                Continue Shopping
            </button>
        </div>
    `;
    
    document.getElementById('order-details').innerHTML = confirmationHTML;
    document.getElementById('order-confirmation-modal').classList.remove('hidden');
    
    // Clear cart
    cart = [];
    saveCart();
    sessionStorage.removeItem('pendingOrder');
    updateCartDisplay();
}

// Cancel payment
function cancelPayment() {
    sessionStorage.removeItem('pendingOrder');
    document.getElementById('payment-processing-modal').classList.add('hidden');
    showNotification('Payment cancelled');
}

// Close order confirmation
function closeOrderConfirmation() {
    document.getElementById('order-confirmation-modal').classList.add('hidden');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Initialize cart
document.addEventListener('DOMContentLoaded', updateCartDisplay);