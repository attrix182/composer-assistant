import React from 'react'
import { Music, Download } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Music className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Composer Assistant</h1>
              <p className="text-sm text-gray-600">Herramientas de composición musical</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Download size={20} />
              <span className="hidden sm:inline">Documentación</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 