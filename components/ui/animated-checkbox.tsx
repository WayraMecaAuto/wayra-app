'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface AnimatedCheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

export function AnimatedCheckbox({
  checked = false,
  onCheckedChange,
  className = ''
}: AnimatedCheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const toggle = () => {
    const newState = !isChecked
    setIsChecked(newState)
    onCheckedChange?.(newState)
  }

  return (
    <button
      onClick={toggle}
      className={`relative w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors duration-300 
        ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-400 hover:border-blue-400'} 
        ${className}`}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: isChecked ? 1 : 0,
          opacity: isChecked ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <motion.path d="M5 13l4 4L19 7" />
      </motion.svg>
    </button>
  )
}
