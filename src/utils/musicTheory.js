// Notas musicales
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Escalas mayores
export const MAJOR_SCALE_PATTERN = [0, 2, 4, 5, 7, 9, 11]

// Escalas menores naturales
export const MINOR_SCALE_PATTERN = [0, 2, 3, 5, 7, 8, 10]

// Escalas menores armónicas
export const HARMONIC_MINOR_PATTERN = [0, 2, 3, 5, 7, 8, 11]

// Escalas menores melódicas
export const MELODIC_MINOR_PATTERN = [0, 2, 3, 5, 7, 9, 11]

// Tipos de escalas
export const SCALE_TYPES = {
  major: { name: 'Mayor', pattern: MAJOR_SCALE_PATTERN },
  naturalMinor: { name: 'Menor Natural', pattern: MINOR_SCALE_PATTERN },
  harmonicMinor: { name: 'Menor Armónica', pattern: HARMONIC_MINOR_PATTERN },
  melodicMinor: { name: 'Menor Melódica', pattern: MELODIC_MINOR_PATTERN },
  pentatonic: { name: 'Pentatónica', pattern: [0, 2, 4, 7, 9] },
  blues: { name: 'Blues', pattern: [0, 3, 5, 6, 7, 10] }
}

// Progresiones de acordes comunes
export const COMMON_PROGRESSIONS = {
  pop: { name: 'Pop (I-V-vi-IV)', pattern: [0, 4, 5, 3] },
  jazz: { name: 'Jazz (ii-V-I)', pattern: [1, 4, 0] },
  rock: { name: 'Rock (I-IV-V)', pattern: [0, 3, 4] },
  blues: { name: 'Blues (I-IV-V)', pattern: [0, 3, 4] },
  folk: { name: 'Folk (I-V-vi-iii)', pattern: [0, 4, 5, 2] }
}

// Tipos de acordes
export const CHORD_TYPES = {
  major: { name: 'Mayor', intervals: [0, 4, 7] },
  minor: { name: 'Menor', intervals: [0, 3, 7] },
  diminished: { name: 'Disminuido', intervals: [0, 3, 6] },
  augmented: { name: 'Aumentado', intervals: [0, 4, 8] },
  major7: { name: 'Mayor 7', intervals: [0, 4, 7, 11] },
  minor7: { name: 'Menor 7', intervals: [0, 3, 7, 10] },
  dominant7: { name: 'Dominante 7', intervals: [0, 4, 7, 10] },
  diminished7: { name: 'Disminuido 7', intervals: [0, 3, 6, 9] }
}

// Función para obtener notas de una escala
export function getScaleNotes(rootNote, scaleType) {
  const rootIndex = NOTES.indexOf(rootNote)
  if (rootIndex === -1) return []
  
  const pattern = SCALE_TYPES[scaleType]?.pattern || MAJOR_SCALE_PATTERN
  return pattern.map(interval => NOTES[(rootIndex + interval) % 12])
}

// Función para obtener notas de un acorde
export function getChordNotes(rootNote, chordType) {
  const rootIndex = NOTES.indexOf(rootNote)
  if (rootIndex === -1) return []
  
  const intervals = CHORD_TYPES[chordType]?.intervals || [0, 4, 7]
  return intervals.map(interval => NOTES[(rootIndex + interval) % 12])
}

// Función para convertir nota a número MIDI
export function noteToMIDI(note, octave = 4) {
  const noteIndex = NOTES.indexOf(note)
  return noteIndex + (octave + 1) * 12
}

// Función para convertir número MIDI a nota
export function midiToNote(midiNumber) {
  const noteIndex = midiNumber % 12
  const octave = Math.floor(midiNumber / 12) - 1
  return { note: NOTES[noteIndex], octave }
}

// Función para generar progresión de acordes
export function generateChordProgression(rootNote, progressionType, chordType = 'major') {
  const scaleNotes = getScaleNotes(rootNote, 'major')
  const progression = COMMON_PROGRESSIONS[progressionType]?.pattern || [0, 4, 5, 3]
  
  return progression.map(degree => {
    const chordRoot = scaleNotes[degree]
    return getChordNotes(chordRoot, chordType)
  })
}

// Función para crear secuencia MIDI simple
export function createMIDISequence(notes, duration = 0.5, velocity = 80) {
  return notes.map((note, index) => ({
    note: typeof note === 'string' ? noteToMIDI(note) : note,
    time: index * duration,
    duration: duration,
    velocity: velocity
  }))
} 