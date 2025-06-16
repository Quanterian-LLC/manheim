'use client'

import React, { useState } from 'react'

interface HeaderProps {
  onSearch: (query: string) => void
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleAdvancedSearch = () => {
    alert('Advanced search feature would open here!')
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary-600">
              Manheim Auctions
            </h1>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by make, model, VIN, or keyword..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={handleAdvancedSearch}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Advanced Search
            </button>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              Watchlist
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              My Account
            </a>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
              Sign In
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary-600 focus:outline-none"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicles..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t pt-4 pb-4">
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleAdvancedSearch}
                className="text-left text-gray-600 hover:text-primary-600 py-2 transition-colors"
              >
                Advanced Search
              </button>
              <a href="#" className="text-gray-600 hover:text-primary-600 py-2 transition-colors">
                Watchlist
              </a>
              <a href="#" className="text-gray-600 hover:text-primary-600 py-2 transition-colors">
                My Account
              </a>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors w-fit">
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 