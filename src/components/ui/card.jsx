import * as React from "react";

export function Card({ className = "", ...props }) {
    return <div className={`rounded-xl border p-4 ${className}`} {...props} />;
}
export function CardHeader({ className = "", ...props }) {
    return <div className={`mb-2 ${className}`} {...props} />;
}
export function CardTitle({ className = "", ...props }) {
    return <h2 className={`font-semibold ${className}`} {...props} />;
}
export function CardContent({ className = "", ...props }) {
    return <div className={`${className}`} {...props} />;
}
