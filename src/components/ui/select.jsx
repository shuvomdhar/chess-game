import * as React from "react";

export function Select({ value, onValueChange, children }) {
    return (
        <select
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        >
            {children}
        </select>
    );
}
export function SelectTrigger({ className = "", children }) {
    return <div className={className}>{children}</div>;
}
export function SelectValue({ placeholder }) {
    return <option disabled>{placeholder}</option>;
}
export function SelectContent({ children }) {
    return <>{children}</>;
}
export function SelectItem({ value, children }) {
    return <option value={value}>{children}</option>;
}
