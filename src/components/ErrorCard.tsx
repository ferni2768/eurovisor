"use client";
import React from "react";
import { motion } from "framer-motion";

interface ErrorCardProps {
    error: string | null;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error }) => {

    return (
        <motion.div className="w-full p-4 bg-red-900/50 border border-red-300 text-white rounded-3xl shadow-[0_5px_15px_rgba(255,0,0,0.1)]">
            <p className="text-center">{error}</p>
        </motion.div>
    );
};

export default ErrorCard;