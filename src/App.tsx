/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { SimulationBanner } from './components/common/SimulationBanner';
import { CartDrawer } from './components/cart/CartDrawer';
import { StorePage } from './pages/StorePage';
import { CheckoutSimulator } from './pages/CheckoutSimulator';
import { TestingLabPage } from './pages/TestingLabPage';
import { ApprovalCenterPage } from './pages/ApprovalCenterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CartItem, Product, FirewallMode, SystemSettings } from './types';
import { firewallService } from './services/firewallService';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('store');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutTargetProduct, setCheckoutTargetProduct] = useState<Product | null>(null);

  // Settings & Firewall status
  const [settings, setSettings] = useState<SystemSettings>({
    authorized_company_email: 'security@shieldstore.internal',
    anonymous_purchase_limit: 3,
    n8n_webhook_url: '',
    firewall_mode: 'demo',
    fail_closed_enabled: true,
    webhook_timeout_ms: 3500,
    last_tested_status: 'not_configured'
  });
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  // Load initial settings and pending approval count
  const refreshSystemState = async () => {
    try {
      const currentSettings = await firewallService.getSettings();
      setSettings(currentSettings);

      const pending = await firewallService.getApprovals('PENDING');
      setPendingApprovalsCount(pending.length);
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    refreshSystemState();
    const interval = setInterval(refreshSystemState, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMode = async (newMode: FirewallMode) => {
    const updated = await firewallService.updateSettings({ firewall_mode: newMode });
    if (updated.success) {
      setSettings(updated.data);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleBuyNow = (product: Product) => {
    setCheckoutTargetProduct(product);
    setCurrentPage('checkout');
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length > 0) {
      setCheckoutTargetProduct(cartItems[0].product);
    }
    setCurrentPage('checkout');
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#080C15] text-slate-100 flex flex-col">
      {/* 1. Global Simulation Disclaimer Banner */}
      <SimulationBanner
        mode={settings.firewall_mode}
        onToggleMode={handleToggleMode}
        n8nConnected={Boolean(settings.n8n_webhook_url && settings.n8n_webhook_url.trim() !== '')}
      />

      {/* 2. Top Bar Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 3. Main Workspace with Sidebar */}
      <div className="flex-1 flex w-full">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          pendingApprovalsCount={pendingApprovalsCount}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          mode={settings.firewall_mode}
          n8nConfigured={Boolean(settings.n8n_webhook_url && settings.n8n_webhook_url.trim() !== '')}
        />

        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
          {currentPage === 'store' && (
            <StorePage onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
          )}

          {currentPage === 'checkout' && (
            <CheckoutSimulator
              initialProduct={checkoutTargetProduct}
              onNavigateToApprovals={() => setCurrentPage('approvals')}
            />
          )}

          {currentPage === 'lab' && (
            <TestingLabPage
              mode={settings.firewall_mode}
              onNavigateToApprovals={() => setCurrentPage('approvals')}
              authorizedEmail={settings.authorized_company_email}
            />
          )}

          {currentPage === 'approvals' && (
            <ApprovalCenterPage onRefreshStats={refreshSystemState} />
          )}

          {currentPage === 'dashboard' && <DashboardPage />}

          {currentPage === 'logs' && <AuditLogsPage />}

          {currentPage === 'settings' && (
            <SettingsPage
              onSettingsSaved={(newSettings) => {
                setSettings(newSettings);
                refreshSystemState();
              }}
            />
          )}
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060A12] py-6 px-4 md:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AI Agent Firewall Testing Lab</span>
            <span>·</span>
            <span>College Hackathon Security Demonstration Platform</span>
          </div>

          <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
            <span>Fail-Closed Enabled</span>
            <span>·</span>
            <span>n8n Webhook Architecture</span>
            <span>·</span>
            <span className="text-emerald-400">Policy Guard Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
