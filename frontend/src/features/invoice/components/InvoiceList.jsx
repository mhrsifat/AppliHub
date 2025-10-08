import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useInvoices from '../hooks/useInvoices';

export default function InvoiceList() {
  const navigate = useNavigate();
  const { list, meta, loading, page, setPage, load } = useInvoices({ initialPage: 1, perPage: 10 });

  useEffect(() => { load(); }, []);

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold'>Invoices</h2>
        <div className='flex gap-2'>
          <button onClick={() => navigate('/admin/invoices/create')} className='bg-blue-600 text-white px-3 py-1 rounded'>New Invoice</button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className='bg-white shadow rounded'>
          <table className='min-w-full table-auto'>
            <thead><tr className='bg-gray-50'>
              <th className='px-4 py-2 text-left'>Invoice#</th>
              <th className='px-4 py-2 text-left'>Order</th>
              <th className='px-4 py-2 text-right'>Total</th>
              <th className='px-4 py-2 text-left'>Status</th>
              <th className='px-4 py-2'>Actions</th>
            </tr></thead>
            <tbody>
              {(list || []).map((i) => (
                <tr key={i.id} className='border-t'>
                  <td className='px-4 py-2'>{i.invoice_number}</td>
                  <td className='px-4 py-2'>{i.order_id}</td>
                  <td className='px-4 py-2 text-right'>{Number(i.grand_total).toFixed(2)}</td>
                  <td className='px-4 py-2'>{i.status}</td>
                  <td className='px-4 py-2'>
                    <Link to={`/admin/invoices/${i.id}`} className='text-blue-600 mr-2'>View</Link>
                    <Link to={`/admin/invoices/${i.id}/edit`} className='text-green-600'>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className='p-3 flex justify-between items-center'>
            <div>Page {meta?.current_page ?? 1}</div>
            <div className='flex gap-2'>
              <button className='px-2 py-1 border rounded' disabled={!(meta?.current_page > 1)} onClick={() => setPage((p) => Math.max(1, (p || 1) - 1))}>Prev</button>
              <button className='px-2 py-1 border rounded' disabled={!(meta && meta.current_page * (meta.per_page || 10) < (meta.total || 0))} onClick={() => setPage((p) => (p || 1) + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
