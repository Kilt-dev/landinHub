// File 2: src/components/ErrorBoundary.js
// Chứa component ErrorBoundary để quản lý lỗi riêng biệt, dễ tái sử dụng.

import React from 'react';

export class ErrorBoundary extends React.Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    render() {
        if (this.state.error) {
            console.error('Error in component:', this.state.error);
            return <div>Lỗi: {this.state.error.message}</div>;
        }
        return this.props.children;
    }
}