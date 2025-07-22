import React, { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import ScaleGenerator from './components/ScaleGenerator'
import ChordProgressionGenerator from './components/ChordProgressionGenerator'
import MelodyGenerator from './components/MelodyGenerator'
import AIGenerator from './components/AIGenerator'
import MIDIPlayer from './components/MIDIPlayer'
import MIDIController from './components/MIDIController'
import { Music, Circle, Brain, Play, Mic, Headphones } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('scales')
  const [generatedMIDI, setGeneratedMIDI] = useState(null)
  const [midiAccess, setMidiAccess] = useState(null)
  const [isMidiConnected, setIsMidiConnected] = useState(false)
  const currentTabIndexRef = useRef(0)

  const tabs = [
    { id: 'scales', name: 'Generador de Escalas', icon: Music },
    { id: 'chords', name: 'Progresiones de Acordes', icon: Circle },
    { id: 'melody', name: 'Generador de Melodías', icon: Mic },
    { id: 'ai', name: 'Generador con IA', icon: Brain },
    { id: 'midi', name: 'Controlador MIDI', icon: Headphones },
    { id: 'player', name: 'Reproductor MIDI', icon: Play }
  ]

  const handleMIDIGenerated = (midiData) => {
    setGeneratedMIDI(midiData)
  }

  const handleTabChange = (tabId) => {
    console.log(`🔄 App: Cambiando tab de "${activeTab}" a "${tabId}"`)
    setActiveTab(tabId)
  }

  // Inicializar MIDI
  useEffect(() => {
    const initMIDI = async () => {
      try {
        const access = await navigator.requestMIDIAccess()
        setMidiAccess(access)
        
        // Auto-conectar el primer dispositivo
        const inputs = Array.from(access.inputs.values())
        if (inputs.length > 0) {
          const input = inputs[0]
          input.onmidimessage = handleMIDIMessage
          setIsMidiConnected(true)
          console.log('🎹 MIDI global conectado a:', input.name)
        }
        
        // Escuchar cambios en dispositivos
        access.onstatechange = () => {
          const inputs = Array.from(access.inputs.values())
          if (inputs.length > 0 && !isMidiConnected) {
            const input = inputs[0]
            input.onmidimessage = handleMIDIMessage
            setIsMidiConnected(true)
            console.log('🎹 MIDI global reconectado a:', input.name)
          }
        }
      } catch (error) {
        console.error('Error accediendo a MIDI:', error)
      }
    }

    initMIDI()
  }, [])

  // Sincronizar índice con tab activo
  useEffect(() => {
    const tabIndex = tabs.findIndex(tab => tab.id === activeTab)
    if (tabIndex !== -1) {
      currentTabIndexRef.current = tabIndex
      console.log(`🔄 App: Sincronizando índice ${tabIndex} para tab "${activeTab}"`)
    }
  }, [activeTab, tabs])

  const handleMIDIMessage = (event) => {
    const [status, controller, value] = event.data
    
    // Control Change (176 = 0xB0)
    if (status === 176) {
      handleControlChange(controller, value)
    }
  }

  const handleControlChange = (controller, value) => {
    switch (controller) {
      case 28: // Control Change para navegación secuencial (solo 62 y 65)
        if (value === 62) {
          // Ir a la herramienta anterior
          const previousIndex = currentTabIndexRef.current > 0 ? currentTabIndexRef.current - 1 : tabs.length - 1
          const previousTab = tabs[previousIndex]
          currentTabIndexRef.current = previousIndex
          handleTabChange(previousTab.id)
          console.log(`⬅️ PREV: ${previousTab.name} (índice ${previousIndex}, ID: ${previousTab.id})`)
        } else if (value === 65) {
          // Ir a la siguiente herramienta
          const nextIndex = currentTabIndexRef.current < tabs.length - 1 ? currentTabIndexRef.current + 1 : 0
          const nextTab = tabs[nextIndex]
          currentTabIndexRef.current = nextIndex
          handleTabChange(nextTab.id)
          console.log(`➡️ NEXT: ${nextTab.name} (índice ${nextIndex}, ID: ${nextTab.id})`)
        }
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Indicador de MIDI */}
        {isMidiConnected && (
          <div className="mb-4 p-2 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">🎹 MIDI Conectado - Rueda de navegación activa</span>
            </div>
          </div>
        )}
        
        {/* Tabs de navegación */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon size={20} />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Contenido de las pestañas */}
        <div className="space-y-6">
          {activeTab === 'scales' && (
            <div>
              <div className="text-sm text-blue-600 mb-2">🎵 Renderizando: Generador de Escalas</div>
              <ScaleGenerator onMIDIGenerated={handleMIDIGenerated} />
            </div>
          )}
          
          {activeTab === 'chords' && (
            <div>
              <div className="text-sm text-blue-600 mb-2">🎵 Renderizando: Progresiones de Acordes</div>
              <ChordProgressionGenerator onMIDIGenerated={handleMIDIGenerated} />
            </div>
          )}
          
          {activeTab === 'melody' && (
            <div>
              <div className="text-sm text-blue-600 mb-2">🎵 Renderizando: Generador de Melodías</div>
              <MelodyGenerator onMIDIGenerated={handleMIDIGenerated} />
            </div>
          )}
          
          {activeTab === 'ai' && (
            <div>
              <div className="text-sm text-blue-600 mb-2">🎵 Renderizando: Generador con IA</div>
              <AIGenerator onMIDIGenerated={handleMIDIGenerated} />
            </div>
          )}
          
          {activeTab === 'midi' && (
            <div>
              <div className="text-sm text-blue-600 mb-2">🎵 Renderizando: Controlador MIDI</div>
              <MIDIController 
                onMIDIOutput={handleMIDIGenerated} 
              />
            </div>
          )}
          
          {activeTab === 'player' && (
            <div>
              <div className="text-sm text-blue-600 mb-2">🎵 Renderizando: Reproductor MIDI</div>
              <MIDIPlayer midiData={generatedMIDI} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App 