// Cart functionality
let cart = JSON.parse(localStorage.getItem('foodcraveCart')) || [];
let currentCategory = 'burgers';

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

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const deliveryFee = 200;
    const total = subtotal + deliveryFee;
    
    document.getElementById('subtotal').textContent = `KSh ${subtotal.toLocaleString()}`;
    document.getElementById('tax').textContent = `KSh ${Math.round(tax).toLocaleString()}`;
    document.getElementById('total').textContent = `KSh ${Math.round(total).toLocaleString()}`;
}

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

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartDisplay();
    showNotification('Item removed from cart');
}

function saveCart() {
    localStorage.setItem('foodcraveCart', JSON.stringify(cart));
}

function showCustomerDetails() {
    toggleCart();
    document.getElementById('customer-details-modal').classList.remove('hidden');
}

function hideCustomerDetails() {
    document.getElementById('customer-details-modal').classList.add('hidden');
}

// Send WhatsApp message using API
async function sendWhatsAppMessage(phone, message) {
    try {
        // Format phone number (remove + and any spaces)
        const formattedPhone = phone.replace(/[+\s]/g, '');
        const encodedMsg = encodeURIComponent(message);
        const apiUrl = `https://wa.nux.my.id/api/sendWA?to=${formattedPhone}&msg=${encodedMsg}&secret=af681499818a7e12eff116ebbe01d7f4`;
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        console.log('WhatsApp API response:', result);
        return result.success;
    } catch (error) {
        console.error('Error sending WhatsApp:', error);
        return false;
    }
}

async function processPayment() {
    const form = document.getElementById('customer-details-form');
    const formData = new FormData(form);
    const paymentMethod = formData.get('payment');
    
    // Validate form
    if (!formData.get('name') || !formData.get('phone') || !formData.get('address')) {
        showNotification('Please fill in all required fields');
        return;
    }
    
    // Show processing modal
    document.getElementById('customer-details-modal').classList.add('hidden');
    document.getElementById('payment-processing-modal').classList.remove('hidden');
    
    // Prepare order details
    const subtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const deliveryFee = 200;
    const tax = subtotal * 0.16;
    const total = subtotal + deliveryFee + tax;
    
    // Format order items for message
    const orderItems = cart.map(item => 
        `${item.name} (${item.quantity} × KSh ${item.basePrice})`
    ).join('\n');
    
    // Current date/time
    const now = new Date();
    const orderDate = now.toLocaleString();
    
    // Customer message
    const customerMessage = `📋 *FoodCrave Order Confirmation*\n\n` +
        `Hello ${formData.get('name')},\n\n` +
        `Your order (#${now.getTime().toString().slice(-6)}) has been received!\n\n` +
        `*Order Summary:*\n${orderItems}\n\n` +
        `Subtotal: KSh ${subtotal.toLocaleString()}\n` +
        `Tax: KSh ${Math.round(tax).toLocaleString()}\n` +
        `Delivery: KSh ${deliveryFee.toLocaleString()}\n` +
        `*Total: KSh ${Math.round(total).toLocaleString()}*\n\n` +
        `Payment Method: ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}\n` +
        `Delivery Address: ${formData.get('address')}\n\n` +
        `Estimated Delivery Time: ${new Date(now.getTime() + 45*60000).toLocaleTimeString()}\n\n` +
        `Thank you for choosing FoodCrave! 🍔`;
    
    // Restaurant message (sent to your number)
    const restaurantMessage = `🍽️ *New FoodCrave Order* (#${now.getTime().toString().slice(-6)})\n\n` +
        `*Customer:* ${formData.get('name')}\n` +
        `*Phone:* ${formData.get('phone')}\n\n` +
        `*Order Items:*\n${orderItems}\n\n` +
        `*Total:* KSh ${Math.round(total).toLocaleString()}\n` +
        `*Payment:* ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}\n` +
        `*Address:* ${formData.get('address')}\n\n` +
        `Order Time: ${orderDate}`;
    
    try {
        // Send messages (customer and restaurant)
        const customerSent = await sendWhatsAppMessage(formData.get('phone'), customerMessage);
        const restaurantSent = await sendWhatsAppMessage('254728671638', restaurantMessage);
        
        if (!customerSent || !restaurantSent) {
            console.warn('WhatsApp messages not delivered to both parties');
        }
    } catch (error) {
        console.error('Error sending WhatsApp confirmation:', error);
    }
    
    // Complete order processing
    setTimeout(() => {
        document.getElementById('payment-processing-modal').classList.add('hidden');
        
        const orderDetails = `
            <p class="mb-2">Order Total: KSh ${Math.round(total).toLocaleString()}</p>
            <p class="mb-2">Payment Method: ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}</p>
            <p>Delivery to: ${formData.get('address')}</p>
            <div class="mt-4 p-3 bg-green-50 rounded-lg">
                <p class="text-green-700">A confirmation has been sent to your WhatsApp.</p>
            </div>
        `;
        
        document.getElementById('order-details').innerHTML = orderDetails;
        document.getElementById('order-confirmation-modal').classList.remove('hidden');
        
        // Clear cart
        cart = [];
        saveCart();
        updateCartDisplay();
    }, 3000);
}

function closeOrderConfirmation() {
    document.getElementById('order-confirmation-modal').classList.add('hidden');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}