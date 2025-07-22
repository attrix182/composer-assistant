import { GoogleGenerativeAI } from '@google/generative-ai'

// Inicializar la API de Google
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY)

// Modelo a usar para generación de música
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export const generateMusicWithAI = async (prompt, key, style, tempo) => {
  try {
    const systemPrompt = `Eres un compositor musical experto. Tu tarea es generar una secuencia de notas musicales basada en la descripción proporcionada.

Reglas importantes:
1. Solo responde con un array JSON de objetos con esta estructura exacta:
   [{"note": "C", "duration": 0.5, "time": 0}, {"note": "D", "duration": 0.5, "time": 0.5}, ...]

2. Usa solo estas notas: C, C#, D, D#, E, F, F#, G, G#, A, A#, B

3. La tonalidad base es: ${key}

4. El estilo debe ser: ${style}

5. El tempo es: ${tempo} BPM

6. Genera entre 8-16 notas

7. Las duraciones deben ser apropiadas para el tempo (${60/tempo}s por tiempo)

8. Los tiempos deben ser consecutivos (0, 0.5, 1.0, etc.)

9. No incluyas texto adicional, solo el JSON.`

    const fullPrompt = `${systemPrompt}

Descripción de la música: ${prompt}

Genera la secuencia de notas:`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()
    
    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\[.*\]/s)
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON válido de la respuesta')
    }
    
    const notes = JSON.parse(jsonMatch[0])
    
    // Validar que las notas sean correctas
    const validNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const validatedNotes = notes.map(note => ({
      ...note,
      note: validNotes.includes(note.note) ? note.note : 'C',
      duration: typeof note.duration === 'number' ? note.duration : 0.5,
      time: typeof note.time === 'number' ? note.time : 0
    }))
    
    return validatedNotes
  } catch (error) {
    console.error('Error generando música con IA:', error)
    // Fallback: generar melodía simple
    return generateFallbackMelody(key, style, tempo)
  }
}

// Función de respaldo si la IA falla
const generateFallbackMelody = (key, style, tempo) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const keyIndex = notes.indexOf(key)
  const melody = []
  
  for (let i = 0; i < 8; i++) {
    const noteIndex = (keyIndex + i * 2) % 12
    melody.push({
      note: notes[noteIndex],
      duration: 60 / tempo,
      time: i * (60 / tempo)
    })
  }
  
  return melody
}

export const generateChordProgressionWithAI = async (prompt, key) => {
  try {
    const systemPrompt = `Eres un compositor experto en progresiones de acordes. Genera una progresión de acordes basada en la descripción.

Reglas:
1. Solo responde con un array JSON de acordes: ["C", "F", "G", "Am"]
2. Usa solo estas notas: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
3. La tonalidad base es: ${key}
4. Genera 4-6 acordes
5. No incluyas texto adicional, solo el JSON.`

    const fullPrompt = `${systemPrompt}

Descripción: ${prompt}

Genera la progresión:`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\[.*\]/s)
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON válido')
    }
    
    const chords = JSON.parse(jsonMatch[0])
    const validNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    return chords.filter(chord => validNotes.includes(chord))
  } catch (error) {
    console.error('Error generando progresión con IA:', error)
    return [key, 'F', 'G', 'Am'] // Progresión básica como fallback
  }
} 