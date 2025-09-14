import React from 'react';

class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div>
                    <h2>Đã xảy ra lỗi!</h2>
                    <p>{this.state.error.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;