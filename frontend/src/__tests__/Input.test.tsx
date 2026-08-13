import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../components/ui/Input';

describe('Input UI Component', () => {
  it('renders input with label correctly', () => {
    render(<Input id="email-field" label="Email Address" placeholder="test@example.com" />);

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('test@example.com')).toBeInTheDocument();
  });

  it('handles user typing and change events', () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Type here" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect((input as HTMLInputElement).value).toBe('Hello');
  });

  it('renders error message and applies error styling', () => {
    render(<Input label="Username" error="Username is required" />);

    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  it('renders helper text when error is not present', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);

    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });
});
