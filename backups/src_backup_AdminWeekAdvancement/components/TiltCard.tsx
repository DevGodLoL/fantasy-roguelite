"use client";

import { useState, useRef, ReactNode } from "react";

interface TiltCardProps {
    children: ReactNode;
    className?: string;
    glareEnabled?: boolean;
    tiltAmount?: number;
    onClick?: () => void;
}

export default function TiltCard({
    children,
    className = "",
    glareEnabled = true,
    tiltAmount = 15,
    onClick,
}: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState("");
    const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate rotation (inverted for natural feel)
        const rotateX = (-mouseY / (rect.height / 2)) * tiltAmount;
        const rotateY = (mouseX / (rect.width / 2)) * tiltAmount;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`);

        // Calculate glare position
        const glareX = ((e.clientX - rect.left) / rect.width) * 100;
        const glareY = ((e.clientY - rect.top) / rect.height) * 100;
        setGlarePosition({ x: glareX, y: glareY });
    };

    const handleMouseLeave = () => {
        setTransform("");
        setIsHovering(false);
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    return (
        <div
            ref={cardRef}
            className={`relative transition-transform duration-200 ease-out ${className}`}
            style={{ transform, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            onClick={onClick}
        >
            {children}

            {/* Holographic glare overlay */}
            {glareEnabled && isHovering && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-20"
                    style={{
                        background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 20%, transparent 50%)`,
                    }}
                />
            )}
        </div>
    );
}
