'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get('/api/admin/users');
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users", error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Users</h1>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Role</th>
              <th className="p-4 font-semibold text-gray-600">Joined</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-navy-900">{user.name}</td>
                <td className="p-4 text-gray-600">{user.email}</td>
                <td className="p-4">
                  <span className={user.role === 'admin' ? 'badge-success' : 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold'}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right space-x-3">
                  <button className="text-teal-600 hover:underline">View Profile</button>
                  <button className="text-red-500 hover:underline">Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
