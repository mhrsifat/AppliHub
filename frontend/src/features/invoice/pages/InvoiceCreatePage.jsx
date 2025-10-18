// filepath: src/features/invoice/pages/InvoiceCreatePage.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import InvoiceForm from '../components/InvoiceForm';

export default function InvoiceCreatePage() {
  const location = useLocation();
  const fromOrderId = location.state?.fromOrderId || '';

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-semibold mb-4'>Create Invoice</h1>
      <InvoiceForm initial={{ order_id: fromOrderId }} />
    </div>
  );
}