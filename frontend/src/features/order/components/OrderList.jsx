import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useOrders from '../hooks/useOrders';
import Loader from "@/components/common/Loader";

export default function OrderList() {
  const navigate = useNavigate();
  const { list, meta, loading, page, setPage, search, load, q } = useOrders({ initialPage: 1, perPage: 10 });

  useEffect(() => { load(); }, []);

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold'>Orders</h2>
        <div className='flex gap-2'>
          <input type='text' placeholder='Search...' value={q || ''} onChange={(e) => search(e.target.value)} className='border px-3 py-1 rounded' />
          <button onClick={() => navigate('/admin/orders/create')} className='bg-blue-600 text-white px-3 py-1 rounded'>New Order</button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className='bg-white shadow rounded'>
          <table className='min-w-full table-auto'>
            <thead><tr className='bg-gray-50'>
              <th className='px-4 py-2 text-left'>Order#</th>
              <th className='px-4 py-2 text-left'>Customer</th>
              <th className='px-4 py-2 text-right'>Total</th>
              <th className='px-4 py-2 text-left'>Status</th>
              <th className='px-4 py-2'>Actions</th>
            </tr></thead>
            <tbody>
              {(list || []).map((o) => (
                <tr key={o.id} className='border-t'>
                  <td className='px-4 py-2'>{o.order_number}</td>
                  <td className='px-4 py-2'>{o.customer_name ?? 'Unknown'}</td>
                  <td className='px-4 py-2 text-right'>{Number(o.grand_total).toFixed(2)}</td>
                  <td className='px-4 py-2'>{o.payment_status}</td>
                  <td className='px-4 py-2'>
                    <Link to={`/orders/${o.id}`} className='text-blue-600 mr-2'>View</Link>
                    <Link to={`/orders/${o.id}/edit`} className='text-green-600'>Edit</Link>
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
