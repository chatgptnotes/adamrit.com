// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import PharmacyDashboard from '@/components/pharmacy/PharmacyDashboard';
import AddPurchaseOrder from '@/components/pharmacy/AddPurchaseOrder';
import PurchaseOrders from '@/components/pharmacy/PurchaseOrders';
import GoodsReceivedNote from '@/components/pharmacy/GoodsReceivedNote';
import ProductPurchaseReport from '@/components/pharmacy/ProductPurchaseReport';
import InventoryTracking from '@/components/pharmacy/InventoryTracking';
import { usePathname } from 'next/navigation';

const PharmacyContent: React.FC = () => {
  const pathname = usePathname();
  if (pathname === '/pharmacy/purchase-orders/add') {
    return <AddPurchaseOrder />;
  }
  if (pathname === '/pharmacy/purchase-orders/list') {
    return <PurchaseOrders />;
  }
  if (pathname === '/pharmacy/goods-received-note') {
    return <GoodsReceivedNote />;
  }
  if (pathname === '/pharmacy/product-purchase-report') {
    return <ProductPurchaseReport />;
  }
  if (pathname === '/pharmacy/inventory-tracking') {
    return <InventoryTracking />;
  }
  return <PharmacyDashboard />;
};

export default function Pharmacy() {
  return (
    <Suspense fallback={<div>Loading Pharmacy...</div>}>
      <PharmacyContent />
    </Suspense>
  );
}
