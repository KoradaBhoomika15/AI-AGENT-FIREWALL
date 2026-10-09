import React, { useState } from 'react';
import { ShoppingCart, Zap, Eye, Check, X, Shield, Lock } from 'lucide-react';
import { Product } from '../types';
import { PRODUCT_LIST } from '../data/products';

interface StorePageProps {
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const StorePage: React.FC<StorePageProps> = ({ onAddToCart, onBuyNow }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedNotice(product.id);
    setTimeout(() => setAddedNotice(null), 1800);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero / Store Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <Lock className="w-3.5 h-3.5" />
            <span>AI Agent Firewall Test Target · Dummy Storefront</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight text-balance">
            Next-Gen Hardware Storefront
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            All catalog product prices are rigidly bound to server ground-truth. Every simulated checkout transaction must pass the AI Agent Firewall and rule validator before completion.
          </p>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Verified Hardware Catalog</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select items to simulate normal checkouts or test price tampering attacks
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            4 Products Available · All Server Verified
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCT_LIST.map((product) => {
            const isAdded = addedNotice === product.id;

            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between rounded-xl bg-[#0C1222] border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-200 overflow-hidden shadow-lg shadow-black/20"
              >
                {/* Product Image Area */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-900">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono font-medium text-slate-300 border border-slate-800">
                    {product.category}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">Fixed Price</span>
                      <span className="text-lg font-bold font-mono text-white tabular-nums">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAdd(product)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      isAdded
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onBuyNow(product)}
                    className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-[#0D1424] border border-slate-700 p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <div className="inline-block text-[11px] font-mono font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                    {selectedProduct.category}
                  </div>
                  <h3 className="text-xl font-bold text-white">{selectedProduct.name}</h3>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-2 tabular-nums">
                    ₹{selectedProduct.price.toLocaleString('en-IN')}
                    <span className="text-xs font-sans text-slate-400 font-normal ml-2">
                      (Server-Locked Ground Truth)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-300 block">Verified Specs:</span>
                    {selectedProduct.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex gap-3">
                  <button
                    onClick={() => {
                      handleAdd(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      const p = selectedProduct;
                      setSelectedProduct(null);
                      onBuyNow(p);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
                  >
                    Simulate Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Architecture Callout */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Tamper Protection Protocol</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Client requests cannot modify item prices. Every checkout is scrutinized by n8n workflow rules.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Target Policy:</span>
          <span className="text-indigo-300 font-semibold">Strict Server Verification</span>
        </div>
      </div>
    </div>
  );
};
