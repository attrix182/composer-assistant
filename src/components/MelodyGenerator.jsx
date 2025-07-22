import React, { useState } from 'react'
import { Play, Download, RotateCw, Music, Square } from 'lucide-react'
import { NOTES, createMIDISequence, noteToMIDI } from '../utils/musicTheory'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

const MelodyGenerator = ({ onMIDIGenerated }) => {
  const [rootNote, setRootNote] = useState('C')
  const [scaleType, setScaleType] = useState('major')
  const [melodyLength, setMelodyLength] = useState(8)
  const [pattern, setPattern] = useState('ascending')
  const [rhythm, setRhythm] = useState('even')
  const [octave, setOctave] = useState(4)
  const [duration, setDuration] = useState(0.5)
  const [velocity, setVelocity] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const [generatedMelody, setGeneratedMelody] = useState([])
  const [lastMidiData, setLastMidiData] = useState(null)
  const [synth, setSynth] = useState(null)

  const scaleTypes = {
    major: { name: 'Mayor', pattern: [0, 2, 4, 5, 7, 9, 11] },
    minor: { name: 'Menor Natural', pattern: [0, 2, 3, 5, 7, 8, 10] },
    pentatonic: { name: 'Pentatónica', pattern: [0, 2, 4, 7, 9] },
    blues: { name: 'Blues', pattern: [0, 3, 5, 6, 7, 10] },
    dorian: { name: 'Dórico', pattern: [0, 2, 3, 5, 7, 9, 10] },
    mixolydian: { name: 'Mixolidio', pattern: [0, 2, 4, 5, 7, 9, 10] }
  }

  const patterns = {
    ascending: { name: 'Ascendente', description: 'Notas que suben gradualmente' },
    descending: { name: 'Descendente', description: 'Notas que bajan gradualmente' },
    arpeggio: { name: 'Arpegio', description: 'Notas del acorde en secuencia' },
    random: { name: 'Aleatorio', description: 'Notas en orden aleatorio' },
    wave: { name: 'Onda', description: 'Sube y baja como una onda' },
    chromatic: { name: 'Cromático', description: 'Notas consecutivas' },
    leap: { name: 'Saltos', description: 'Saltos grandes entre notas' },
    stepwise: { name: 'Por grados', description: 'Movimiento por grados conjuntos' }
  }

  const rhythms = {
    even: { name: 'Uniforme', description: 'Todas las notas con la misma duración' },
    dotted: { name: 'Punteado', description: 'Notas largas y cortas alternadas' },
    syncopated: { name: 'Sincopado', description: 'Acentos en tiempos débiles' },
    triplet: { name: 'Tresillos', description: 'Grupos de tres notas' },
    swing: { name: 'Swing', description: 'Ritmo jazz con swing' }
  }

  const generateMelody = () => {
    const rootIndex = NOTES.indexOf(rootNote)
    const scalePattern = scaleTypes[scaleType].pattern
    const melody = []
    
    for (let i = 0; i < melodyLength; i++) {
      let noteIndex
      
      // Generar índice de nota según el patrón
      switch (pattern) {
        case 'ascending':
          noteIndex = rootIndex + scalePattern[i % scalePattern.length]
          break
        case 'descending':
          noteIndex = rootIndex + scalePattern[scalePattern.length - 1 - (i % scalePattern.length)]
          break
        case 'arpeggio':
          noteIndex = rootIndex + scalePattern[i % 3] // Primeras 3 notas del acorde
          break
        case 'random':
          noteIndex = rootIndex + scalePattern[Math.floor(Math.random() * scalePattern.length)]
          break
        case 'wave':
          const waveIndex = Math.sin(i * 0.5) * (scalePattern.length / 2)
          noteIndex = rootIndex + scalePattern[Math.floor(Math.abs(waveIndex)) % scalePattern.length]
          break
        case 'chromatic':
          noteIndex = rootIndex + (i % 12)
          break
        case 'leap':
          noteIndex = rootIndex + scalePattern[i % scalePattern.length] + (i % 2) * 7
          break
        case 'stepwise':
          noteIndex = rootIndex + (i % 7) * 2
          break
        default:
          noteIndex = rootIndex + scalePattern[i % scalePattern.length]
      }
      
      // Asegurar que la nota esté en rango
      noteIndex = Math.max(0, Math.min(11, noteIndex))
      
      // Ajustar duración según el ritmo
      let noteDuration = duration
      switch (rhythm) {
        case 'dotted':
          noteDuration = i % 2 === 0 ? duration * 1.5 : duration * 0.5
          break
        case 'syncopated':
          noteDuration = i % 3 === 1 ? duration * 0.5 : duration
          break
        case 'triplet':
          noteDuration = duration * 0.67
          break
        case 'swing':
          noteDuration = i % 2 === 0 ? duration * 1.5 : duration * 0.5
          break
      }
      
      melody.push({
        note: NOTES[noteIndex],
        duration: noteDuration,
        time: i * duration
      })
    }
    
    setGeneratedMelody(melody)
    
    // Crear secuencia MIDI
    const midiSequence = melody.map((note, index) => ({
      note: noteToMIDI(note.note, octave),
      time: note.time,
      duration: note.duration,
      velocity: velocity
    }))
    
    const midiData = {
      type: 'melody',
      name: `Melodía ${rootNote} ${scaleTypes[scaleType].name} - ${patterns[pattern].name}`,
      notes: midiSequence,
      metadata: {
        rootNote,
        scaleType,
        pattern,
        rhythm,
        melodyLength,
        octave,
        duration,
        velocity
      }
    }
    
    setLastMidiData(midiData)
    onMIDIGenerated(midiData)
  }

  const handleRandomMelody = () => {
    const randomNote = NOTES[Math.floor(Math.random() * NOTES.length)]
    const randomScale = Object.keys(scaleTypes)[Math.floor(Math.random() * Object.keys(scaleTypes).length)]
    const randomPattern = Object.keys(patterns)[Math.floor(Math.random() * Object.keys(patterns).length)]
    const randomRhythm = Object.keys(rhythms)[Math.floor(Math.random() * Object.keys(rhythms).length)]
    
    setRootNote(randomNote)
    setScaleType(randomScale)
    setPattern(randomPattern)
    setRhythm(randomRhythm)
    generateMelody()
  }

  // Reproducción real con Tone.js
  const handlePlay = async () => {
    if (generatedMelody.length === 0) {
      generateMelody()
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
      generatedMelody.forEach((note, i) => {
        const noteName = `${note.note}${octave}`
        newSynth.triggerAttackRelease(noteName, note.duration, now + note.time, velocity / 127)
      })
      
      const totalDuration = Math.max(...generatedMelody.map(n => n.time + n.duration))
      setTimeout(() => {
        setIsPlaying(false)
        setSynth(null)
      }, totalDuration * 1000)
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
        midi: n.note,
        time: n.time,
        duration: n.duration,
        velocity: n.velocity / 127
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
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Generador de Melodías</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Configuración básica */}
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
              {Object.entries(scaleTypes).map(([key, scale]) => (
                <option key={key} value={key}>{scale.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitud de Melodía
            </label>
            <input
              type="range"
              min="4"
              max="16"
              value={melodyLength}
              onChange={(e) => setMelodyLength(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">{melodyLength} notas</div>
          </div>
        </div>

        {/* Patrones y ritmos */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patrón Melódico
            </label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="input-field"
            >
              {Object.entries(patterns).map(([key, pattern]) => (
                <option key={key} value={key}>{pattern.name}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              {patterns[pattern].description}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ritmo
            </label>
            <select
              value={rhythm}
              onChange={(e) => setRhythm(e.target.value)}
              className="input-field"
            >
              {Object.entries(rhythms).map(([key, rhythm]) => (
                <option key={key} value={key}>{rhythm.name}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              {rhythms[rhythm].description}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Octava
            </label>
            <input
              type="range"
              min="3"
              max="6"
              value={octave}
              onChange={(e) => setOctave(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">Octava: {octave}</div>
          </div>
        </div>

        {/* Configuración de reproducción */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración Base (segundos)
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

          {/* Controles */}
          <div className="flex flex-col gap-3">
            <button
              onClick={generateMelody}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Music size={20} />
              Generar Melodía
            </button>
            
            <button
              onClick={handleRandomMelody}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <RotateCw size={20} />
              Melodía Aleatoria
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

      {/* Visualización de la melodía */}
      {generatedMelody.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Melodía: {rootNote} {scaleTypes[scaleType].name} - {patterns[pattern].name}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {generatedMelody.map((note, index) => (
                <div
                  key={index}
                  className="bg-primary-100 text-primary-800 px-3 py-2 rounded-lg font-mono text-sm flex flex-col items-center"
                >
                  <div>{note.note}</div>
                  <div className="text-xs text-primary-600">{note.duration.toFixed(1)}s</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MelodyGenerator 