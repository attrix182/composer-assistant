import React, { useState } from 'react'
import Header from './components/Header'
import ScaleGenerator from './components/ScaleGenerator'
import ChordProgressionGenerator from './components/ChordProgressionGenerator'
import MelodyGenerator from './components/MelodyGenerator'
import AIGenerator from './components/AIGenerator'
import MIDIPlayer from './components/MIDIPlayer'
import { Music, Circle, Brain, Play, Mic } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('scales')
  const [generatedMIDI, setGeneratedMIDI] = useState(null)

  const tabs = [
    { id: 'scales', name: 'Generador de Escalas', icon: Music },
    { id: 'chords', name: 'Progresiones de Acordes', icon: Circle },
    { id: 'melody', name: 'Generador de Melodías', icon: Mic },
    { id: 'ai', name: 'Generador con IA', icon: Brain },
    { id: 'player', name: 'Reproductor MIDI', icon: Play }
  ]

  const handleMIDIGenerated = (midiData) => {
    setGeneratedMIDI(midiData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Tabs de navegación */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
            <ScaleGenerator onMIDIGenerated={handleMIDIGenerated} />
          )}
          
          {activeTab === 'chords' && (
            <ChordProgressionGenerator onMIDIGenerated={handleMIDIGenerated} />
          )}
          
          {activeTab === 'melody' && (
            <MelodyGenerator onMIDIGenerated={handleMIDIGenerated} />
          )}
          
          {activeTab === 'ai' && (
            <AIGenerator onMIDIGenerated={handleMIDIGenerated} />
          )}
          
          {activeTab === 'player' && (
            <MIDIPlayer midiData={generatedMIDI} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App 