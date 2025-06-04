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
                    <span class="font-semibold text-primary">KSh ${item.totalPrice.toLocaleString()}</span>
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
    const tax = subtotal * 0.16;
    const total = subtotal + deliveryFee + tax;
    
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

async function sendWhatsAppMessage(phoneNumber, message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappApiUrl = `https://wa.nux.my.id/api/sendWA?to=${phoneNumber}&msg=${encodedMessage}&secret=af681499818a7e12eff116ebbe01d7f4`;
    
    try {
        const response = await fetch(whatsappApiUrl);
        if (!response.ok) {
            console.error('Failed to send WhatsApp notification');
            return false;
        }
        const data = await response.json();
        console.log('WhatsApp notification sent:', data);
        return true;
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        return false;
    }
}

function processPayment() {
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
    const deliveryFee = 150;
    const total = subtotal + deliveryFee;
    
    const customerName = formData.get('name');
    const customerPhone = formData.get('phone').replace(/^0/, '+254'); // Convert to international format
    const customerAddress = formData.get('address');
    const customerNotes = formData.get('notes') || 'No additional notes';
    const orderNumber = 'FC-' + Date.now().toString().slice(-6);
    
    // Create merchant message
    let orderItems = '';
    cart.forEach(item => {
        orderItems += `- ${item.name} (${item.quantity} x KSh ${item.basePrice.toLocaleString()})\n`;
    });
    
    const merchantMessage = `📦 *New Order #${orderNumber}*\n\n` +
                          `👤 *Customer*: ${customerName}\n` +
                          `📱 *Phone*: ${customerPhone}\n` +
                          `💳 *Payment*: ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}\n\n` +
                          `🍔 *Order Items*:\n${orderItems}\n` +
                          `💰 *Subtotal*: KSh ${subtotal.toLocaleString()}\n` +
                          `🚚 *Delivery Fee*: KSh ${deliveryFee.toLocaleString()}\n` +
                          `💵 *Total*: KSh ${Math.round(total).toLocaleString()}\n\n` +
                          `🏠 *Delivery Address*:\n${customerAddress}\n\n` +
                          `📝 *Notes*: ${customerNotes}`;
    
    // Create customer message
    const customerMessage = `🍽️ *FoodCrave Kenya Order Confirmation #${orderNumber}*\n\n` +
                           `Dear ${customerName},\n\n` +
                           `Thank you for your order! Here are your order details:\n\n` +
                           `📅 *Order Date*: ${new Date().toLocaleString()}\n` +
                           `🍴 *Items Ordered*:\n${orderItems}\n` +
                           `💵 *Total Amount*: KSh ${Math.round(total).toLocaleString()}\n` +
                           `🏠 *Delivery Address*: ${customerAddress}\n\n` +
                           `Your food is being prepared and will be delivered soon.\n\n` +
                           `For any inquiries, please call +254 700 000000.\n\n` +
                           `Thank you for choosing FoodCrave Kenya!`;
    
    // Send messages
    Promise.all([
        sendWhatsAppMessage('254671638', merchantMessage), // Your merchant number
        sendWhatsAppMessage(customerPhone, customerMessage) // Customer's number
    ]).finally(() => {
        // Show order confirmation regardless of WhatsApp success
        const orderDetails = `
            <div class="mb-4">
                <p class="text-lg font-semibold">Order #${orderNumber}</p>
                <p class="text-gray-600">${new Date().toLocaleString()}</p>
            </div>
            <p class="mb-2">Total: <span class="font-bold">KSh ${Math.round(total).toLocaleString()}</span></p>
            <p class="mb-2">Payment Method: ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery'}</p>
            <p class="mb-4">Delivery to: ${customerAddress}</p>
            <p class="text-green-600">A confirmation has been sent to your WhatsApp.</p>
        `;
        
        document.getElementById('order-details').innerHTML = orderDetails;
        document.getElementById('payment-processing-modal').classList.add('hidden');
        document.getElementById('order-confirmation-modal').classList.remove('hidden');
        
        // Clear cart
        cart = [];
        saveCart();
        updateCartDisplay();
    });
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