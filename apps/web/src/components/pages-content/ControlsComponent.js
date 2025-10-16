import React from 'react';
import { Search } from 'lucide-react';

const ControlsComponent = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) => {
    return (
        <div className="controls">
            <div className="search-box">
                <Search className="search-icon" size={16} />
                <input
                    type="text"
                    placeholder="Tìm kiếm Landing Page"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="filters">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                >
                    <option>Trạng thái</option>
                    <option>ĐÃ XUẤT BẢN</option>
                    <option>CHƯA XUẤT BẢN</option>
                    <option>ARCHIVED</option>
                </select>
            </div>
        </div>
    );
};

export default ControlsComponent;