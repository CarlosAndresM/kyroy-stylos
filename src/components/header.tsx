"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-primary/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src="/LOGO.png"
              alt="kairos Stylos Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground font-brand">kairos Stylos</h1>
            <p className="text-xs text-muted-foreground">by Karen Ovalle</p>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#servicios" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Servicios
          </a>
          <a href="#about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Nosotros
          </a>
          <Link href="/auth/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Iniciar Sesión
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-primary/10 md:hidden animate-slide-up">
            <div className="flex flex-col gap-4 p-4">
              <a href="#servicios" className="text-sm font-medium text-foreground hover:text-primary">
                Servicios
              </a>
              <a href="#about" className="text-sm font-medium text-foreground hover:text-primary">
                Nosotros
              </a>
              <Link href="/auth/login" className="text-sm font-medium text-foreground hover:text-primary">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
