// React 19.2 Shared Button Component with useFormStatus
'use client';

import { useFormStatus } from 'react-dom';
import { FC, ButtonHTMLAttributes } from 'react';

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    pendingText?: string;
    children: React.ReactNode;
}

/**
 * React 19.2 Form Submit Button
 * Automatically shows pending state during form submission
 */
export function SubmitButton({
    pendingText = 'Submitting...',
    children,
    className = '',
    ...props
}: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`btn-primary ${pending ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
            {...props}
        >
            {pending ? pendingText : children}
        </button>
    );
}

/**
 * React 19.2 Delete Button
 * Shows pending state during deletion
 */
export function DeleteButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {pending ? 'Deleting...' : 'Delete'}
        </button>
    );
}

/**
 * Generic action button with pending state
 */
export function ActionButton({
    pendingText,
    children,
    ...props
}: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            disabled={pending}
            {...props}
        >
            {pending ? (pendingText || 'Processing...') : children}
        </button>
    );
}
