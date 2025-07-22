import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, Download, Volume } from 'lucide-react'
import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

const MIDIPlayer = ({ midiData }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [synth, setSynth] = useState(null)

  useEffect(() => {
    if (midiData) {
      // Calcular duración total
      const maxTime = Math.max(...midiData.notes.map(note => note.time + note.duration))
      setDuration(maxTime)
      setCurrentTime(0)
    }
  }, [midiData])

  useEffect(() => {
    let interval
    if (isPlaying && midiData) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1
          if (newTime >= duration) {
            setIsPlaying(false)
            return 0
          }
          return newTime
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, duration, midiData])

  const handlePlay = async () => {
    if (!midiData) return
    setIsPlaying(true)
    try {
      await Tone.start()
      const newSynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
      }).toDestination()
      setSynth(newSynth)
      
      let now = Tone.now()
      midiData.notes.forEach((note) => {
        const noteName = typeof note.note === 'number' ? 
          Tone.Frequency(note.note, "midi").toNote() : 
          note.note
        newSynth.triggerAttackRelease(
          noteName, 
          note.duration * playbackRate, 
          now + note.time * playbackRate, 
          (note.velocity || 80) / 127 * volume
        )
      })
      
      const totalDuration = Math.max(...midiData.notes.map(n => n.time + n.duration)) * playbackRate
      setTimeout(() => {
        setIsPlaying(false)
        setSynth(null)
      }, totalDuration * 1000)
    } catch (error) {
      console.error('Error al reproducir audio:', error)
      setIsPlaying(false)
    }
  }

  const handlePause = () => {
    if (synth) {
      synth.disconnect()
      synth.dispose()
      setSynth(null)
    }
    setIsPlaying(false)
  }

  const handleStop = () => {
    if (synth) {
      synth.disconnect()
      synth.dispose()
      setSynth(null)
    }
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const exportMIDI = () => {
    if (!midiData) return
    
    const midi = new Midi()
    const track = midi.addTrack()
    midiData.notes.forEach(n => {
      track.addNote({
        midi: typeof n.note === 'number' ? n.note : Tone.Frequency(n.note, "midi").toMidi(),
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
    a.download = `${midiData.name}.mid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!midiData) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Reproductor MIDI</h2>
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg mb-2">No hay pista MIDI cargada</p>
          <p className="text-sm">Genera una escala, progresión o melodía con IA para reproducirla aquí</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Reproductor MIDI</h2>
      
      {/* Información de la pista */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">{midiData.name}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Tipo: {midiData.type}</div>
          {midiData.metadata && (
            <>
              {midiData.metadata.rootNote && <div>Nota raíz: {midiData.metadata.rootNote}</div>}
              {midiData.metadata.scaleType && <div>Escala: {midiData.metadata.scaleType}</div>}
              {midiData.metadata.progressionType && <div>Progresión: {midiData.metadata.progressionType}</div>}
              {midiData.metadata.tempo && <div>Tempo: {midiData.metadata.tempo} BPM</div>}
              {midiData.metadata.key && <div>Tonalidad: {midiData.metadata.key}</div>}
              {midiData.metadata.style && <div>Estilo: {midiData.metadata.style}</div>}
            </>
          )}
          <div>Notas: {midiData.notes.length}</div>
        </div>
      </div>

      {/* Controles de reproducción */}
      <div className="space-y-4">
        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Botones de control */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors duration-200 disabled:opacity-50"
          >
            <Play size={24} />
          </button>
          
          <button
            onClick={handlePause}
            disabled={!isPlaying}
            className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-full transition-colors duration-200 disabled:opacity-50"
          >
            <Pause size={24} />
          </button>
          
          <button
            onClick={handleStop}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors duration-200"
          >
            <Square size={24} />
          </button>
        </div>

        {/* Controles de volumen y velocidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Volumen
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-gray-600 hover:text-gray-800"
              >
                <Volume size={20} />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Velocidad de reproducción
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600">{playbackRate}x</div>
          </div>
        </div>

        {/* Botón de exportación */}
        <div className="flex justify-center">
          <button
            onClick={exportMIDI}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={20} />
            Exportar archivo MIDI
          </button>
        </div>
      </div>

      {/* Visualización de notas */}
      {midiData.notes.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Notas de la pista</h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {midiData.notes.slice(0, 32).map((note, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-center"
                >
                  <div className="font-mono">{note.note}</div>
                  <div className="text-gray-500">{note.time.toFixed(1)}s</div>
                </div>
              ))}
            </div>
            {midiData.notes.length > 32 && (
              <div className="text-center text-gray-500 text-sm mt-2">
                ... y {midiData.notes.length - 32} notas más
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MIDIPlayer 