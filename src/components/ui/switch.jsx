import * as React from "react";

export function Switch({ checked, onCheckedChange }) {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                className="sr-only"
            />
            <div
                className={`w-10 h-6 rounded-full transition ${checked ? "bg-blue-600" : "bg-gray-400"
                    }`}
            >
                <div
                    className={`w-4 h-4 bg-white rounded-full shadow transform transition ${checked ? "translate-x-5" : "translate-x-1"
                        }`}
                />
            </div>
        </label>
    );
}
