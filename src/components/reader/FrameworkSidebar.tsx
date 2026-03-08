"use client";

import { motion } from "framer-motion";

type FrameworkSidebarProps = {
    sectionId: string;
};

const FRAMEWORK = [
    { id: "1", letter: "W", name: "Wisdom", color: "bg-blue-500", text: "text-blue-500", shadow: "shadow-blue-500/50" },
    { id: "2", letter: "O", name: "Observation", color: "bg-green-500", text: "text-green-500", shadow: "shadow-green-500/50" },
    { id: "3", letter: "R", name: "Repetition", color: "bg-amber-500", text: "text-amber-500", shadow: "shadow-amber-500/50" },
    { id: "4", letter: "D", name: "Discipline", color: "bg-red-500", text: "text-red-500", shadow: "shadow-red-500/50" }
];

export default function FrameworkSidebar({ sectionId }: FrameworkSidebarProps) {
    // Show only for the 4 main khands
    if (!["1", "2", "3", "4"].includes(sectionId)) return null;

    return (
        <div className="hidden xl:flex fixed right-4 top-1/2 -translate-y-1/2 z-[75] flex-col items-center gap-4 p-4 rounded-full bg-white/30 dark:bg-black/20 backdrop-blur-sm border border-black/5 dark:border-white/5 shadow-xl">
            {FRAMEWORK.map((item, index) => {
                const isActive = item.id === sectionId;
                const isPast = parseInt(item.id) < parseInt(sectionId);
                
                return (
                    <div key={item.id} className="relative group flex flex-col items-center">
                        {/* Connecting Line */}
                        {index > 0 && (
                            <div className={`w-0.5 h-6 my-1 transition-colors duration-500 ${isPast || isActive ? item.color : 'bg-gray-300 dark:bg-gray-700/50'}`} />
                        )}
                        
                        {/* Node */}
                        <motion.div 
                            initial={false}
                            animate={{
                                scale: isActive ? 1.2 : 1,
                                opacity: isActive || isPast ? 1 : 0.4
                            }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-heading font-black text-xl transition-colors duration-500 border-2 ${
                                isActive 
                                    ? `${item.color} text-white border-transparent ${item.shadow} shadow-lg ring-4 ring-offset-2 ring-transparent ring-offset-transparent` 
                                    : isPast
                                        ? `bg-white dark:bg-[#1A2230] ${item.text} border-${item.color.split('-')[1]}-500`
                                        : `bg-white/50 dark:bg-black/50 text-gray-500 border-gray-300 dark:border-gray-700`
                            }`}
                        >
                            {/* Inner active glow */}
                            {isActive && (
                                <motion.div 
                                    layoutId="active-framework-glow"
                                    className={`absolute inset-0 rounded-full ${item.color} blur-md opacity-40`}
                                />
                            )}
                            <span className="relative z-10">{item.letter}</span>
                        </motion.div>
                        
                        {/* Tooltip */}
                        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {item.name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
