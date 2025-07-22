import React, { useState } from 'react'
import { Brain, Play, Download, Star, Clock, Square } from 'lucide-react'
import { NOTES, createMIDISequence, noteToMIDI } from '../utils/musicTheory'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'
import { generateMusicWithAI } from '../services/aiService'

const AIGenerator = ({ onMIDIGenerated }) => {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [generatedMelody, setGeneratedMelody] = useState(null)
  const [tempo, setTempo] = useState(120)
  const [key, setKey] = useState('C')
  const [style, setStyle] = useState('melodic')
  const [synth, setSynth] = useState(null)

  const musicStyles = {
    melodic: 'Melódica y suave',
    rhythmic: 'Rítmica y energética',
    ambient: 'Ambiental y atmosférica',
    jazz: 'Jazz y sofisticada',
    classical: 'Clásica y elegante',
    electronic: 'Electrónica y moderna'
  }

  // Función real de generación con IA
  const generateWithAI = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      // Llamada real a la API de Google AI
      const generatedNotes = await generateMusicWithAI(prompt, key, style, tempo)
      
      const midiSequence = generatedNotes.map((note, index) => ({
        note: typeof note.note === 'string' ? note.note.charCodeAt(0) - 60 + (note.note.length > 1 ? 1 : 0) : note.note,
        time: note.time || index * (60 / tempo),
        duration: note.duration || 60 / tempo,
        velocity: 80
      }))
      
      const midiData = {
        type: 'ai-generated',
        name: `Melodía IA: ${prompt.substring(0, 30)}...`,
        notes: midiSequence,
        metadata: {
          prompt,
          key,
          style,
          tempo,
          generatedNotes
        }
      }
      
      setGeneratedMelody(midiData)
      onMIDIGenerated(midiData)
    } catch (error) {
      console.error('Error generando con IA:', error)
      // Fallback a generación local
      const fallbackNotes = generateMelodyFromPrompt(prompt, key, style, tempo)
      const midiSequence = createMIDISequence(fallbackNotes, 60 / tempo, 80)
      
      const midiData = {
        type: 'ai-generated',
        name: `Melodía IA (Fallback): ${prompt.substring(0, 30)}...`,
        notes: midiSequence,
        metadata: {
          prompt,
          key,
          style,
          tempo,
          generatedNotes: fallbackNotes
        }
      }
      
      setGeneratedMelody(midiData)
      onMIDIGenerated(midiData)
    } finally {
      setIsGenerating(false)
    }
  }

  // Función para generar melodía basada en el prompt (simulación)
  const generateMelodyFromPrompt = (prompt, key, style, tempo) => {
    const keyIndex = NOTES.indexOf(key)
    const notes = []
    const length = Math.floor(Math.random() * 8) + 8 // 8-16 notas
    
    for (let i = 0; i < length; i++) {
      // Generar notas basadas en el estilo
      let noteIndex
      switch (style) {
        case 'melodic':
          // Notas más cercanas entre sí
          noteIndex = keyIndex + (i % 7) * 2
          break
        case 'rhythmic':
          // Notas más variadas
          noteIndex = keyIndex + Math.floor(Math.random() * 12)
          break
        case 'ambient':
          // Notas largas y sostenidas
          noteIndex = keyIndex + [0, 4, 7, 11][i % 4]
          break
        case 'jazz':
          // Notas con cromatismos
          noteIndex = keyIndex + [0, 2, 3, 5, 7, 9, 10, 11][i % 8]
          break
        case 'classical':
          // Notas de escala mayor
          noteIndex = keyIndex + [0, 2, 4, 5, 7, 9, 11][i % 7]
          break
        case 'electronic':
          // Notas más extremas
          noteIndex = keyIndex + Math.floor(Math.random() * 24) - 12
          break
        default:
          noteIndex = keyIndex + (i % 12)
      }
      
      // Asegurar que la nota esté en rango
      noteIndex = Math.max(0, Math.min(11, noteIndex))
      notes.push(NOTES[noteIndex])
    }
    
    return notes
  }

  // Reproducción real con Tone.js
  const handlePlay = async () => {
    if (!generatedMelody) return
    setIsPlaying(true)
    try {
      await Tone.start()
      const newSynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
      }).toDestination()
      setSynth(newSynth)
      let now = Tone.now()
      generatedMelody.metadata.generatedNotes.forEach((note, i) => {
        const noteName = `${note}4`
        newSynth.triggerAttackRelease(noteName, 60 / tempo, now + i * (60 / tempo), 0.7)
      })
      setTimeout(() => {
        setIsPlaying(false)
        setSynth(null)
      }, generatedMelody.metadata.generatedNotes.length * (60 / tempo) * 1000)
    } catch (error) {
      console.error('Error al reproducir audio:', error)
      setIsPlaying(false)
    }
  }

  // Detener reproducción
  const handleStop = () => {
    if (synth) {
      synth.disconnect()
      synth.dispose()
      setSynth(null)
    }
    setIsPlaying(false)
  }

  const handleExportMIDI = () => {
    if (!generatedMelody) return
    
    const midi = new Midi()
    const track = midi.addTrack()
    
    generatedMelody.notes.forEach(n => {
      track.addNote({
        midi: typeof n.note === 'number' ? n.note : noteToMIDI(n.note, 4),
        time: n.time,
        duration: n.duration,
        velocity: (n.velocity || 80) / 127
      })
    })
    
    const bytes = midi.toArray()
    const blob = new Blob([bytes], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedMelody.name}.mid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRandomPrompt = () => {
    const prompts = [
      'Una melodía triste y melancólica',
      'Una canción alegre y energética',
      'Una pieza ambiental y relajante',
      'Una melodía jazz sofisticada',
      'Una composición clásica elegante',
      'Una pista electrónica moderna',
      'Una melodía romántica y suave',
      'Una canción épica y dramática'
    ]
    
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    setPrompt(randomPrompt)
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
        <Brain className="text-secondary-600" size={28} />
        Generador con Inteligencia Artificial
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de configuración */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe la música que quieres generar
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Una melodía triste y melancólica en tono menor..."
              className="input-field h-32 resize-none"
              disabled={isGenerating}
            />
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={handleRandomPrompt}
                className="text-sm text-secondary-600 hover:text-secondary-700 flex items-center gap-1"
              >
                <Star size={16} />
                Sugerencia aleatoria
              </button>
              <span className="text-sm text-gray-500">{prompt.length}/500</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tonalidad
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="input-field"
                disabled={isGenerating}
              >
                {NOTES.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estilo
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="input-field"
                disabled={isGenerating}
              >
                {Object.entries(musicStyles).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tempo (BPM)
            </label>
            <input
              type="range"
              min="60"
              max="180"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="w-full"
              disabled={isGenerating}
            />
            <div className="text-sm text-gray-600 mt-1">{tempo} BPM</div>
          </div>

          <button
            onClick={generateWithAI}
            disabled={isGenerating || !prompt.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Clock className="animate-spin" size={20} />
                Generando...
              </>
            ) : (
              <>
                <Brain size={20} />
                Generar con IA
              </>
            )}
          </button>
        </div>

        {/* Panel de resultados */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Resultado Generado</h3>
            
            {generatedMelody ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">{generatedMelody.name}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Tonalidad: {generatedMelody.metadata.key}</div>
                    <div>Estilo: {musicStyles[generatedMelody.metadata.style]}</div>
                    <div>Tempo: {generatedMelody.metadata.tempo} BPM</div>
                    <div>Notas: {generatedMelody.metadata.generatedNotes.length}</div>
                    <div>Prompt: {generatedMelody.metadata.prompt}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play size={20} />
                    {isPlaying ? 'Reproduciendo...' : 'Reproducir'}
                  </button>
                  
                  <button
                    onClick={handleStop}
                    disabled={!isPlaying}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Square size={20} />
                    Detener
                  </button>
                  
                  <button 
                    onClick={handleExportMIDI}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download size={20} />
                    Exportar MIDI
                  </button>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-2">Notas generadas:</h5>
                  <div className="flex flex-wrap gap-1">
                    {generatedMelody.metadata.generatedNotes.map((note, index) => (
                      <div
                        key={index}
                        className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs font-mono"
                      >
                        {typeof note === 'string' ? note : note.note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Brain size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Ingresa un prompt y genera música con IA</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIGenerator 