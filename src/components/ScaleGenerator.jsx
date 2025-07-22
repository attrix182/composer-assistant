import React, { useState } from 'react'
import { Play, Download, RotateCw, Square } from 'lucide-react'
import { NOTES, SCALE_TYPES, getScaleNotes, createMIDISequence, noteToMIDI } from '../utils/musicTheory'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

const ScaleGenerator = ({ onMIDIGenerated }) => {
  const [rootNote, setRootNote] = useState('C')
  const [scaleType, setScaleType] = useState('major')
  const [octave, setOctave] = useState(4)
  const [duration, setDuration] = useState(0.5)
  const [velocity, setVelocity] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [scaleNotes, setScaleNotes] = useState([])
  const [lastMidiData, setLastMidiData] = useState(null)
  const [synth, setSynth] = useState(null)

  const handleGenerateScale = () => {
    const notes = getScaleNotes(rootNote, scaleType)
    setScaleNotes(notes)
    
    // Crear secuencia MIDI
    const midiSequence = createMIDISequence(notes, duration, velocity)
    const midiData = {
      type: 'scale',
      name: `${rootNote} ${SCALE_TYPES[scaleType].name}`,
      notes: midiSequence,
      metadata: {
        rootNote,
        scaleType,
        octave,
        duration,
        velocity
      }
    }
    setLastMidiData(midiData)
    onMIDIGenerated(midiData)
  }

  const handleRandomScale = () => {
    const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)]
    const randomScaleType = Object.keys(SCALE_TYPES)[Math.floor(Math.random() * Object.keys(SCALE_TYPES).length)]
    
    setRootNote(randomNote)
    setScaleType(randomScaleType)
    handleGenerateScale()
  }

  // Reproducción real con Tone.js
  const handlePlay = async () => {
    if (scaleNotes.length === 0) {
      handleGenerateScale()
    }
    setIsPlaying(true)
    try {
      await Tone.start()
      const newSynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
      }).toDestination()
      setSynth(newSynth)
      let now = Tone.now()
      scaleNotes.forEach((note, i) => {
        const noteName = `${note}${octave}`
        newSynth.triggerAttackRelease(noteName, duration, now + i * duration, velocity / 127)
      })
      setTimeout(() => {
        setIsPlaying(false)
        setSynth(null)
      }, scaleNotes.length * duration * 1000)
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

  // Exportar MIDI real
  const handleExportMIDI = () => {
    if (!lastMidiData) return
    const midi = new Midi()
    const track = midi.addTrack()
    lastMidiData.notes.forEach(n => {
      track.addNote({
        midi: typeof n.note === 'number' ? n.note : noteToMIDI(n.note, octave),
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
    a.download = `${lastMidiData.name}.mid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Generador de Escalas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Configuración de la escala */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nota Raíz
            </label>
            <select
              value={rootNote}
              onChange={(e) => setRootNote(e.target.value)}
              className="input-field"
            >
              {NOTES.map(note => (
                <option key={note} value={note}>{note}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Escala
            </label>
            <select
              value={scaleType}
              onChange={(e) => setScaleType(e.target.value)}
              className="input-field"
            >
              {Object.entries(SCALE_TYPES).map(([key, scale]) => (
                <option key={key} value={key}>{scale.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Octava
            </label>
            <input
              type="range"
              min="2"
              max="6"
              value={octave}
              onChange={(e) => setOctave(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">Octava: {octave}</div>
          </div>
        </div>

        {/* Configuración de la secuencia */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración de Nota (segundos)
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">{duration}s</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Velocidad (0-127)
            </label>
            <input
              type="range"
              min="20"
              max="127"
              value={velocity}
              onChange={(e) => setVelocity(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">{velocity}</div>
          </div>
        </div>

        {/* Controles */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGenerateScale}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Generar Escala
            </button>
            
            <button
              onClick={handleRandomScale}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <RotateCw size={20} />
              Escala Aleatoria
            </button>
            
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play size={20} />
              {isPlaying ? 'Reproduciendo...' : 'Reproducir'}
            </button>
            <button
              onClick={handleStop}
              disabled={!isPlaying}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Square size={20} />
              Detener
            </button>
            <button
              onClick={handleExportMIDI}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Exportar MIDI
            </button>
          </div>
        </div>
      </div>

      {/* Visualización de la escala */}
      {scaleNotes.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Escala: {rootNote} {SCALE_TYPES[scaleType].name}
          </h3>
          <div className="flex flex-wrap gap-2">
            {scaleNotes.map((note, index) => (
              <div
                key={index}
                className="bg-primary-100 text-primary-800 px-3 py-2 rounded-lg font-mono text-sm"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScaleGenerator 