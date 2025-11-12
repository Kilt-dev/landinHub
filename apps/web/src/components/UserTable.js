import React from "react";

export default function UserTable({ users, onEdit, onDelete }) {
    return (
        <table className="min-w-full border bg-white rounded-xl shadow-md">
            <thead>
            <tr className="bg-gray-100 text-left">
                <th className="p-3">Tên</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Gói</th>
                <th className="p-3">Ngày tạo</th>
                <th className="p-3">Hành động</th>
            </tr>
            </thead>
            <tbody>
            {users.map((u) => (
                <tr key={u._id} className="border-t">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3">{u.subscription}</td>
                    <td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 flex gap-2">
                        <button className="text-blue-600" onClick={() => onEdit(u)}>
                            Sửa
                        </button>
                        <button className="text-red-600" onClick={() => onDelete(u._id)}>
                            Xóa
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
