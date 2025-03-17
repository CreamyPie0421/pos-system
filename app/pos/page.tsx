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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cash, setCash] = useState<number>(0);
  const [showCheckout, setShowCheckout] = useState(false);

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
    const matchesCategory = selectedCategory === null || product.category.name === selectedCategory;
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
    <PageLayout title="POS">
      {/* Mobile View Toggle */}
      <div className="lg:hidden flex items-center justify-between mb-4 bg-white rounded-lg shadow-sm p-4">
        <button
          onClick={() => setShowCheckout(false)}
          className={`flex-1 py-2 px-4 rounded-l-lg ${!showCheckout ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Products
        </button>
        <button
          onClick={() => setShowCheckout(true)}
          className={`flex-1 py-2 px-4 rounded-r-lg ${showCheckout ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Cart ({cart.length})
        </button>
      </div>

      <div className="h-full flex flex-col lg:flex-row">
        {/* Products Section */}
        <div className={`flex-1 flex flex-col h-full lg:pr-4 mb-4 lg:mb-0 ${showCheckout ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search and Categories */}
          <div className="mb-4 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border rounded-lg text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex overflow-x-auto pb-2 -mx-2 px-2">
              <button
                className={`flex-shrink-0 px-4 py-2 rounded-lg mr-2 ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg mr-2 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => {
                    addToCart(product);
                    // Auto switch to cart view on mobile after adding item
                    if (window.innerWidth < 1024) {
                      setShowCheckout(true);
                    }
                  }}
                  disabled={product.stock <= 0}
                  className="relative bg-white border rounded-lg p-2 hover:shadow-md transition-shadow duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
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

        {/* Cart Section */}
        <div className={`w-full lg:w-96 bg-white rounded-lg shadow-sm flex flex-col h-[600px] lg:h-full ${showCheckout ? 'flex' : 'hidden lg:flex'}`}>
          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-lg font-semibold text-black mb-4">Cart</h2>
            {cart.length === 0 ? (
              <div className="text-center text-black py-8">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="font-medium text-black">{item.name}</div>
                      <div className="text-sm text-black">
                        ₱{item.price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-black">₱{(item.price * item.quantity).toFixed(2)}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-md hover:bg-gray-100 text-black"
                        >
                          -
                        </button>
                        <span className="text-black">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-md hover:bg-gray-100 text-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout summary */}
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between text-sm text-black">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-black">
              <span>Tax (12%)</span>
              <span>₱{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-black">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
            <div className="pt-4">
              <label className="block text-sm font-medium text-black mb-1">
                Cash
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md text-black"
                value={cash || ''}
                onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
                onFocus={(e) => {
                  if (cash === 0) {
                    setCash(0);
                    e.target.value = '';
                  }
                }}
              />
            </div>
            <div className="flex justify-between text-lg font-semibold text-black">
              <span>Change</span>
              <span>₱{(cash - total).toFixed(2)}</span>
            </div>
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || cash < total}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}