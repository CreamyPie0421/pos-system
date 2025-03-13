'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  category: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cash, setCash] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ]);

        if (!productsRes.ok || !categoriesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [productsData, categoriesData] = await Promise.all([
          productsRes.json(),
          categoriesRes.json()
        ]);

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load products and categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category.name === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const productName = product.name.toLowerCase();
    
    // Show all products if no search query
    // Otherwise, search by product name from left to right
    const matchesSearch = searchQuery.length === 0 || 
      (searchQuery.length >= 1 && productName.startsWith(searchLower));
    
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('This product is out of stock!');
      return;
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          alert('Not enough stock available!');
          return currentCart;
        }
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock) {
      alert('Not enough stock available!');
      return;
    }

    if (newQuantity < 1) {
      setCart(currentCart => currentCart.filter(item => item.id !== productId));
    } else {
      setCart(currentCart =>
        currentCart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.12; // 12% VAT
  const total = subtotal + tax;
  const change = cash - total;

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Magdagdag muna ng items sa cart');
      return;
    }

    if (cash < total) {
      alert('Kulang ang cash payment');
      return;
    }

    if (!confirm('Sigurado ka bang gusto mong i-complete ang sale na ito?')) {
      return;
    }

    try {
      const saleItems = cart.map(item => ({
        productId: item.id,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.price * item.quantity),
      }));

      const saleData = {
        items: saleItems,
        subtotal: Number(subtotal),
        tax: Number(tax),
        total: Number(total),
        cash: Number(cash),
        change: Number(cash - total),
      };

      console.log('Sending sale data:', saleData);

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to complete sale');
      }

      console.log('Sale completed successfully:', responseData);
      
      setCart([]);
      setCash(0);
      alert('Successful ang sale!');
      
      // Refresh products to update stock
      const productsRes = await fetch('/api/products');
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      } else {
        console.error('Failed to refresh products');
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Hindi na-complete ang sale. Pakisubukan ulit. Error: ' + errorMessage);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Point of Sale">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Point of Sale">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error}</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Point of Sale">
      <div className="h-full flex">
        {/* Products Section */}
        <div className="flex-1 flex flex-col mr-4">
          {/* Search and Categories */}
          <div className="mb-6">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    selectedCategory === category.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 w-full ${
                    product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={product.stock <= 0}
                >
                  <div className="h-32 w-full bg-gray-100 rounded-lg overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-900">₱{product.price.toFixed(2)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.stock <= 0 
                          ? 'bg-red-100 text-red-700' 
                          : product.stock < 10 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        {product.stock <= 0 
                          ? 'Out of Stock' 
                          : product.stock < 10 
                            ? 'Low Stock'
                            : 'In Stock'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Panel */}
        <div className="w-96 bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Order</h2>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-start mb-4">
                <div className="h-12 w-12 flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">₱{item.price.toFixed(2)}</div>
                  <div className="flex items-center mt-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center mx-2 border rounded"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tax (12%)</span>
              <span className="text-gray-900">₱{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-medium text-gray-900">₱{total.toFixed(2)}</span>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cash}
                onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
                onFocus={(e) => {
                  if (cash === 0) {
                    e.target.value = '';
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    setCash(0);
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg text-gray-900"
                placeholder="Enter cash amount"
              />
            </div>
            
            {cash >= total && (
              <div className="flex justify-between mb-4 text-green-600 font-medium">
                <span>Change</span>
                <span>₱{change.toFixed(2)}</span>
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || cash < total}
              className={`w-full py-2 px-4 rounded-lg ${
                cart.length === 0 || cash < total
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 