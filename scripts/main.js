// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    showCategory('burgers');
    updateCartDisplay();
});

// Show category
function showCategory(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        if (tab.dataset.category === category) {
            tab.className = 'category-tab flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ease-in-out bg-primary text-white';
        } else {
            tab.className = 'category-tab flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ease-in-out text-gray-600 hover:bg-gray-100';
        }
    });
    
    // Display menu items
    const container = document.getElementById('menu-container');
    const items = menuData[category] || [];
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-gray-500 text-lg">No items available in this category</p>
            </div>
        `;
        return;
    }
    
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const categoryIcon = {
        burgers: '🍔',
        pizza: '🍕',
        fries: '🍟',
        milkshakes: '🥤',
        treats: '🍪'
    }[category];
    
    container.innerHTML = `
        <section class="mb-12">
            <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span class="text-2xl">${categoryIcon}</span>
                ${categoryName}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${items.map(item => createMenuItemCard(item)).join('')}
            </div>
        </section>
    `;
}

// Create menu item card
function createMenuItemCard(item) {
    return `
        <div class="food-card bg-white rounded-lg shadow-md overflow-hidden">
            <div class="aspect-[4/3] overflow-hidden">
                <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
            </div>
            <div class="p-6">
                <h4 class="text-xl font-semibold text-gray-800 mb-2">${item.name}</h4>
                <p class="text-gray-600 mb-4">${item.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-bold text-primary">KSh ${item.basePrice.toLocaleString()}</span>
                    <button onclick="addToCart(${item.id})" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
}