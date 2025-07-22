import React, { useState, useEffect, useRef } from 'react'
import { Music, Mic, Settings, Play, Square, RotateCcw } from 'lucide-react'

const MIDIController = ({ onMIDIInput, onMIDIOutput }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [midiInputs, setMidiInputs] = useState([])
  const [midiOutputs, setMidiOutputs] = useState([])
  const [selectedInput, setSelectedInput] = useState(null)
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedNotes, setRecordedNotes] = useState([])
  const [recordingStartTime, setRecordingStartTime] = useState(0)
  const [currentOctave, setCurrentOctave] = useState(4)
  const [velocity, setVelocity] = useState(80)
  const [isPlaying, setIsPlaying] = useState(false)
  const midiAccessRef = useRef(null)
  const activeNotesRef = useRef(new Map()) // Map para tracking de notas activas
  const polySynthRef = useRef(null) // PolySynth para manejar múltiples voces
  const [detectedCC, setDetectedCC] = useState(null) // Para detectar CC de la rueda
  const lastWheelValueRef = useRef(null) // Para tracking del valor anterior de la rueda

  // Inicializar Web MIDI API
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then(access => {
          midiAccessRef.current = access
          updateMIDIDevices()
          
          // Escuchar cambios en dispositivos MIDI
          access.onstatechange = updateMIDIDevices
        })
        .catch(err => {
          console.error('Error accediendo a MIDI:', err)
        })
    } else {
      console.warn('Web MIDI API no está disponible')
    }

    // Cleanup al desmontar el componente
    return () => {
      stopAllNotes()
      if (selectedInput) {
        selectedInput.onmidimessage = null
      }
    }
  }, [])

  // Limpieza automática cada 3 segundos para notas huérfanas
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const maxNoteDuration = 3000 // 3 segundos máximo
      
      activeNotesRef.current.forEach((noteData, noteName) => {
        if (noteData && noteData.startTime && (now - noteData.startTime) > maxNoteDuration) {
          console.log('🧹 Limpiando nota huérfana:', noteName)
          try {
            if (polySynthRef.current) {
              polySynthRef.current.triggerRelease(noteName)
            }
          } catch (error) {
            console.warn('Error limpiando nota huérfana:', error)
          }
          activeNotesRef.current.delete(noteName)
        }
      })
    }, 3000)

    return () => clearInterval(cleanupInterval)
  }, [])



  const updateMIDIDevices = () => {
    if (!midiAccessRef.current) return

    const inputs = Array.from(midiAccessRef.current.inputs.values())
    const outputs = Array.from(midiAccessRef.current.outputs.values())
    
    setMidiInputs(inputs)
    setMidiOutputs(outputs)
    
    // Auto-conectar el primer dispositivo disponible
    if (inputs.length > 0 && !selectedInput) {
      connectToInput(inputs[0])
    }
  }

  const connectToInput = (input) => {
    if (selectedInput) {
      selectedInput.onmidimessage = null
      // Detener todas las notas al desconectar
      stopAllNotes()
    }
    
    input.onmidimessage = handleMIDIMessage
    setSelectedInput(input)
    setIsConnected(true)
    console.log('Conectado a:', input.name)
  }

  const handleMIDIMessage = (event) => {
    const [status, note, velocity] = event.data
    
    // Validar que los datos sean válidos
    if (note === null || note === undefined) {
      console.warn('Nota MIDI inválida:', event.data)
      return
    }
    
    // Note On (144 = 0x90)
    if (status === 144 && velocity > 0) {
      const noteName = midiToNoteName(note)
      if (!noteName) {
        console.warn('No se pudo convertir nota MIDI:', note)
        return
      }
      
      const noteData = {
        note: noteName,
        midi: note,
        velocity: velocity,
        time: Date.now() - recordingStartTime,
        duration: 0.5
      }
      
      if (isRecording) {
        setRecordedNotes(prev => [...prev, noteData])
      }
      
      // Reproducir nota
      playNote(noteName, velocity / 127)
      
      // Enviar a componente padre
      if (onMIDIInput) {
        onMIDIInput(noteData)
      }
    }
    // Note Off (128 = 0x80) o Note On con velocity 0
    else if (status === 128 || (status === 144 && velocity === 0)) {
      const noteName = midiToNoteName(note)
      if (noteName && typeof noteName === 'string') {
        stopNote(noteName)
      } else {
        console.warn('No se pudo obtener nombre de nota válido para detener:', note)
      }
    }
    // Control Change (176 = 0xB0)
    else if (status === 176) {
      handleControlChange(note, velocity)
    }
  }

  const handleControlChange = (controller, value) => {
    switch (controller) {
      case 1: // Mod Wheel
        // Cambiar octava
        setCurrentOctave(3 + Math.floor(value / 21))
        break
      case 7: // Volume
        setVelocity(value)
        break
      case 10: // Pan
        // Implementar pan
        break
      default:
        console.log(`Control Change: ${controller} = ${value}`)
        // Detectar automáticamente el CC de la rueda
        if (!detectedCC && controller !== 1 && controller !== 7 && controller !== 10) {
          setDetectedCC(controller)
          lastWheelValueRef.current = value // Inicializar el valor de referencia
          console.log(`🎛️ Rueda detectada en CC ${controller} con valor inicial ${value}`)
        }
        
        // Manejar la rueda detectada automáticamente
        if (detectedCC && controller === detectedCC) {
          // Detectar dirección del giro comparando con el valor anterior
          if (lastWheelValueRef.current !== null) {
            const direction = value > lastWheelValueRef.current ? 'right' : 'left'
            console.log(`🎛️ Rueda girando ${direction} (CC ${detectedCC}: ${lastWheelValueRef.current} → ${value})`)
          }
          
          // Guardar el valor actual para la próxima comparación
          lastWheelValueRef.current = value
        }
    }
  }

  const midiToNoteName = (midiNote) => {
    if (midiNote === null || midiNote === undefined || midiNote < 0 || midiNote > 127) {
      console.warn('Nota MIDI fuera de rango:', midiNote)
      return null
    }
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const note = notes[midiNote % 12]
    const octave = Math.floor(midiNote / 12) - 1
    return `${note}${octave}`
  }

  const playNote = (noteName, velocity = 0.8) => {
    if (!noteName || typeof noteName !== 'string') {
      console.warn('Nombre de nota inválido:', noteName)
      return
    }
    
    // Verificar si la nota ya está sonando
    if (activeNotesRef.current.has(noteName)) {
      console.log('Nota ya está sonando:', noteName)
      return
    }
    
    // Crear o usar PolySynth
    import('tone').then(Tone => {
      try {
        if (!polySynthRef.current) {
          polySynthRef.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
          }).toDestination()
        }
        
        // Marcar nota como activa
        activeNotesRef.current.set(noteName, {
          startTime: Date.now(),
          velocity
        })
        
        // Reproducir la nota
        polySynthRef.current.triggerAttack(noteName, undefined, velocity)
      } catch (error) {
        console.error('Error reproduciendo nota:', noteName, error)
      }
    })
  }

  const stopNote = (noteName) => {
    if (!noteName || typeof noteName !== 'string') {
      console.warn('Nombre de nota inválido para detener:', noteName)
      return
    }
    
    // Verificar si la nota está realmente sonando
    if (!activeNotesRef.current.has(noteName)) {
      console.log('Nota no está sonando:', noteName)
      return
    }
    
    // Detener la nota usando PolySynth
    if (polySynthRef.current) {
      try {
        polySynthRef.current.triggerRelease(noteName)
      } catch (error) {
        console.warn('Error deteniendo nota:', noteName, error)
      }
    }
    
    // Remover nota de las activas
    activeNotesRef.current.delete(noteName)
  }

  const startRecording = () => {
    setRecordedNotes([])
    setRecordingStartTime(Date.now())
    setIsRecording(true)
    console.log('Grabación iniciada')
  }

  const stopRecording = () => {
    setIsRecording(false)
    console.log('Grabación detenida. Notas grabadas:', recordedNotes)
  }

  const playRecording = async () => {
    if (recordedNotes.length === 0) return
    
    setIsPlaying(true)
    try {
      const Tone = await import('tone')
      await Tone.start()
      
      const polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
      }).toDestination()
      
      let now = Tone.now()
      recordedNotes.forEach(note => {
        const noteName = typeof note.note === 'string' ? note.note : midiToNoteName(note.midi)
        if (noteName) {
          polySynth.triggerAttackRelease(
            noteName, 
            note.duration / 1000, 
            now + note.time / 1000, 
            note.velocity / 127
          )
        }
      })
      
      const totalDuration = Math.max(...recordedNotes.map(n => n.time + n.duration))
      setTimeout(() => {
        polySynth.releaseAll()
        polySynth.disconnect()
        polySynth.dispose()
        setIsPlaying(false)
      }, totalDuration)
    } catch (error) {
      console.error('Error reproduciendo grabación:', error)
      setIsPlaying(false)
    }
  }

  const clearRecording = () => {
    setRecordedNotes([])
  }

  const stopAllNotes = () => {
    try {
      // Detener todas las notas usando PolySynth
      if (polySynthRef.current) {
        // PolySynth maneja automáticamente todas las voces activas
        polySynthRef.current.releaseAll()
        
        // Limpiar el PolySynth
        polySynthRef.current.disconnect()
        polySynthRef.current.dispose()
        polySynthRef.current = null
      }
      
      activeNotesRef.current.clear()
      console.log('Todas las notas detenidas y PolySynth limpiado')
    } catch (error) {
      console.error('Error deteniendo todas las notas:', error)
    }
  }

  const emergencyReset = () => {
    console.log('🚨 RESET DE EMERGENCIA - Reiniciando PolySynth...')
    try {
      // Forzar limpieza completa
      if (polySynthRef.current) {
        polySynthRef.current.releaseAll()
        polySynthRef.current.disconnect()
        polySynthRef.current.dispose()
        polySynthRef.current = null
      }
      activeNotesRef.current.clear()
      
      // Crear nuevo PolySynth después de un breve delay
      setTimeout(() => {
        import('tone').then(Tone => {
          try {
            polySynthRef.current = new Tone.PolySynth(Tone.Synth, {
              oscillator: { type: 'triangle' },
              envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
            }).toDestination()
            console.log('✅ PolySynth reiniciado exitosamente')
          } catch (error) {
            console.error('Error reiniciando PolySynth:', error)
          }
        })
      }, 100)
    } catch (error) {
      console.error('Error en reset de emergencia:', error)
    }
  }

  const exportRecording = () => {
    if (recordedNotes.length === 0) return
    
    const midiData = {
      type: 'midi-recording',
      name: `Grabación MIDI ${new Date().toLocaleString()}`,
      notes: recordedNotes.map(note => ({
        note: note.midi,
        time: note.time / 1000,
        duration: note.duration / 1000,
        velocity: note.velocity
      }))
    }
    
    if (onMIDIOutput) {
      onMIDIOutput(midiData)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
        <Music className="text-secondary-600" size={28} />
        Controlador MIDI
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de conexión */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Conexión MIDI</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispositivos de Entrada
                </label>
                <select
                  value={selectedInput?.id || ''}
                  onChange={(e) => {
                    const input = midiInputs.find(i => i.id === e.target.value)
                    if (input) connectToInput(input)
                  }}
                  className="input-field"
                >
                  <option value="">Seleccionar dispositivo...</option>
                  {midiInputs.map(input => (
                    <option key={input.id} value={input.id}>
                      {input.name || input.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispositivos de Salida
                </label>
                <select
                  value={selectedOutput?.id || ''}
                  onChange={(e) => {
                    const output = midiOutputs.find(o => o.id === e.target.value)
                    setSelectedOutput(output)
                  }}
                  className="input-field"
                >
                  <option value="">Seleccionar dispositivo...</option>
                  {midiOutputs.map(output => (
                    <option key={output.id} value={output.id}>
                      {output.name || output.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Configuración</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Octava: {currentOctave}
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={currentOctave}
                  onChange={(e) => setCurrentOctave(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Velocidad: {velocity}
                </label>
                <input
                  type="range"
                  min="1"
                  max="127"
                  value={velocity}
                  onChange={(e) => setVelocity(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Control Change</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">🎛️ Control Change</h4>
                                            <div className="text-xs text-blue-700 space-y-1">
                <div>• CC 1: Mod Wheel → Cambiar octava</div>
                <div>• CC 7: Volume → Cambiar velocidad</div>
                <div className="font-medium text-green-700">• CC 28 = 62: ⬅️ PREV (anterior)</div>
                <div className="font-medium text-green-700">• CC 28 = 65: ➡️ NEXT (siguiente)</div>
                <div className="text-xs text-gray-600 mt-2">
                  <em>Navegación global activa desde cualquier tab</em>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Panel de grabación */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Grabación</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`btn-primary flex items-center gap-2 ${isRecording ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  <Mic size={20} />
                  {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
                </button>
                
                <button
                  onClick={playRecording}
                  disabled={recordedNotes.length === 0 || isPlaying}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                >
                  <Play size={20} />
                  {isPlaying ? 'Reproduciendo...' : 'Reproducir'}
                </button>
                
                                 <button
                   onClick={clearRecording}
                   disabled={recordedNotes.length === 0}
                   className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                 >
                   <RotateCcw size={20} />
                   Limpiar
                 </button>
                 
                                   <button
                    onClick={stopAllNotes}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Square size={20} />
                    Detener Notas
                  </button>
                  
                  <button
                    onClick={emergencyReset}
                    className="btn-danger flex items-center gap-2"
                  >
                    <RotateCcw size={20} />
                    Reset de Emergencia
                  </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Notas Grabadas</h4>
                <div className="text-sm text-gray-600">
                  {recordedNotes.length > 0 ? (
                    <div>
                      <p>Total de notas: {recordedNotes.length}</p>
                      <p>Duración: {Math.max(...recordedNotes.map(n => n.time + n.duration)) / 1000}s</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {recordedNotes.slice(0, 10).map((note, index) => (
                          <span
                            key={index}
                            className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs"
                          >
                            {typeof note.note === 'string' ? note.note : midiToNoteName(note.midi)}
                          </span>
                        ))}
                        {recordedNotes.length > 10 && (
                          <span className="text-gray-500">+{recordedNotes.length - 10} más</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p>No hay notas grabadas</p>
                  )}
                </div>
              </div>

              <button
                onClick={exportRecording}
                disabled={recordedNotes.length === 0}
                className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Settings size={20} />
                Exportar a MIDI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MIDIController 