import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../components/Login';

describe('Login Component', () => {
    test('renders login form', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );
        expect(screen.getByText(/Đăng Nhập/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Mật khẩu/i)).toBeInTheDocument();
    });

    test('submits form with valid data', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );
        fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Mật khẩu/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByText(/Đăng Nhập/i));
        // Add mock API call test if needed
    });
});