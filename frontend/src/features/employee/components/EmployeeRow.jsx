// src/features/employee/components/EmployeeRow.jsx
import React from 'react';

export default function EmployeeRow({ index, employee, onEdit, onView, onDelete, onRestore }) {
  const roles = employee.roles ? employee.roles.join(', ') : '';

  return (
    <tr className="border-t">
      <td className="p-3">{index}</td>
      <td className="p-3 flex items-center gap-3">
        <img
          src={employee.avatar ? `${employee.avatar}` : `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}`}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="font-medium">{employee.first_name} {employee.last_name}</div>
          <div className="text-sm text-gray-500">{employee.full_address}</div>
        </div>
      </td>
      <td className="p-3">{employee.email}</td>
      <td className="p-3">{employee.phone}</td>
      <td className="p-3">{employee.location}</td>
      <td className="p-3">
        <span className={`px-2 py-1 rounded text-sm ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {employee.status}
        </span>
      </td>
      <td className="p-3">{roles}</td>
      <td className="p-3 text-right">
        <div className="flex justify-end gap-2">
          <button onClick={() => onView(employee)} className="px-2 py-1 border rounded text-sm">View</button>
          <button onClick={() => onEdit(employee)} className="px-2 py-1 border rounded text-sm">Edit</button>
          {employee.status === 'active' ? (
            <button onClick={() => onDelete(false)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
          ) : (
            <>
              <button onClick={() => onRestore(employee.id)} className="px-2 py-1 border rounded text-sm text-green-600">Restore</button>
              <button onClick={() => onDelete(true)} className="px-2 py-1 border rounded text-sm text-red-700">Force</button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}