import React, { useState } from 'react'
import { Play, Download, RotateCw, Music, Square } from 'lucide-react'
import { NOTES, COMMON_PROGRESSIONS, CHORD_TYPES, generateChordProgression, createMIDISequence, noteToMIDI } from '../utils/musicTheory'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

const ChordProgressionGenerator = ({ onMIDIGenerated }) => {
  const [rootNote, setRootNote] = useState('C')
  const [progressionType, setProgressionType] = useState('pop')
  const [chordType, setChordType] = useState('major')
  const [chordDuration, setChordDuration] = useState(1.0)
  const [velocity, setVelocity] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progression, setProgression] = useState([])
  const [lastMidiData, setLastMidiData] = useState(null)
  const [synth, setSynth] = useState(null)

  const handleGenerateProgression = () => {
    const chords = generateChordProgression(rootNote, progressionType, chordType)
    setProgression(chords)
    
    // Crear secuencia MIDI para la progresión
    const midiSequence = []
    chords.forEach((chord, chordIndex) => {
      chord.forEach((note, noteIndex) => {
        midiSequence.push({
          note: typeof note === 'string' ? noteToMIDI(note, 4) : note,
          time: chordIndex * chordDuration,
          duration: chordDuration,
          velocity: velocity
        })
      })
    })
    
    const midiData = {
      type: 'progression',
      name: `${rootNote} ${COMMON_PROGRESSIONS[progressionType].name}`,
      notes: midiSequence,
      metadata: {
        rootNote,
        progressionType,
        chordType,
        chordDuration,
        velocity,
        chords
      }
    }
    setLastMidiData(midiData)
    onMIDIGenerated(midiData)
  }

  const handleRandomProgression = () => {
    const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)]
    const randomProgression = Object.keys(COMMON_PROGRESSIONS)[Math.floor(Math.random() * Object.keys(COMMON_PROGRESSIONS).length)]
    const randomChordType = Object.keys(CHORD_TYPES)[Math.floor(Math.random() * Object.keys(CHORD_TYPES).length)]
    
    setRootNote(randomNote)
    setProgressionType(randomProgression)
    setChordType(randomChordType)
    handleGenerateProgression()
  }

  // Reproducción real con Tone.js
  const handlePlay = async () => {
    if (progression.length === 0) {
      handleGenerateProgression()
    }
    setIsPlaying(true)
    try {
      await Tone.start()
      const newSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
      }).toDestination()
      setSynth(newSynth)
      let now = Tone.now()
      progression.forEach((chord, i) => {
        const notes = chord.map(note => `${note}4`)
        newSynth.triggerAttackRelease(notes, chordDuration, now + i * chordDuration, velocity / 127)
      })
      setTimeout(() => {
        setIsPlaying(false)
        setSynth(null)
      }, progression.length * chordDuration * 1000)
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
    a.download = `${lastMidiData.name}.mid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Generador de Progresiones de Acordes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Configuración de la progresión */}
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
              Tipo de Progresión
            </label>
            <select
              value={progressionType}
              onChange={(e) => setProgressionType(e.target.value)}
              className="input-field"
            >
              {Object.entries(COMMON_PROGRESSIONS).map(([key, prog]) => (
                <option key={key} value={key}>{prog.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Acorde
            </label>
            <select
              value={chordType}
              onChange={(e) => setChordType(e.target.value)}
              className="input-field"
            >
              {Object.entries(CHORD_TYPES).map(([key, chord]) => (
                <option key={key} value={key}>{chord.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Configuración de la secuencia */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración de Acorde (segundos)
            </label>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              value={chordDuration}
              onChange={(e) => setChordDuration(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">{chordDuration}s</div>
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
              onClick={handleGenerateProgression}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Music size={20} />
              Generar Progresión
            </button>
            
            <button
              onClick={handleRandomProgression}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <RotateCw size={20} />
              Progresión Aleatoria
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

      {/* Visualización de la progresión */}
      {progression.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Progresión: {rootNote} {COMMON_PROGRESSIONS[progressionType].name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {progression.map((chord, index) => (
              <div key={index} className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                <div className="text-sm font-medium text-secondary-700 mb-2">
                  Acorde {index + 1}
                </div>
                <div className="flex flex-wrap gap-1">
                  {chord.map((note, noteIndex) => (
                    <div
                      key={noteIndex}
                      className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-xs font-mono"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChordProgressionGenerator 