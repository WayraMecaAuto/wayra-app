"use client";

import { useState, useRef, useLayoutEffect, useId } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function Dropdown({ options, value, onChange, placeholder = "Seleccionar...", icon }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownId = useId();

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  // Posicionar con useLayoutEffect para evitar flicker
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Cerrar al hacer clic fuera
  useLayoutEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, dropdownId]);

  const dropdownContent = isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      id={dropdownId}
      className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      {options.map((option) => (
        <div
          key={option.value}
          onMouseDown={(e) => {
            e.preventDefault(); // Evita que el blur cierre antes
            onChange(option.value);
            setIsOpen(false);
          }}
          className={`px-4 py-2.5 text-sm cursor-pointer transition-colors select-none ${
            option.value === value
              ? "bg-indigo-50 text-indigo-700 font-medium"
              : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          }`}
        >
          {option.label}
        </div>
      ))}
    </motion.div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full px-4 py-2.5 pl-10 pr-10 text-left text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white flex items-center justify-between hover:bg-slate-50 ${
          isOpen ? "ring-2 ring-indigo-500 border-indigo-500" : ""
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          <span className={`truncate ${value ? "text-slate-900" : "text-slate-500"}`}>
            {selectedLabel}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Portal al body */}
      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
    </>
  );
}