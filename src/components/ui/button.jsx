import * as React from "react";

export function Button({ className = "", variant = "default", ...props }) {
    let base =
        "px-3 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    let variants = {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
        secondary: "bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600",
    };
    return <button className={`${base} ${variants[variant] || ""} ${className}`} {...props} />;
}
