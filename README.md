# Composer Assistant 🎵

Una herramienta web moderna para composición musical que te ayuda a generar pistas MIDI, escalas, progresiones de acordes y melodías con inteligencia artificial.

## ✨ Características

### 🎼 Generador de Escalas
- **Múltiples tipos de escalas**: Mayor, menor natural, menor armónica, menor melódica, pentatónica y blues
- **Configuración flexible**: Nota raíz, octava, duración y velocidad
- **Generación aleatoria**: Descubre nuevas escalas automáticamente
- **Visualización**: Ve las notas de la escala generada

### 🎹 Generador de Progresiones de Acordes
- **Progresiones populares**: Pop (I-V-vi-IV), Jazz (ii-V-I), Rock (I-IV-V), Blues, Folk
- **Tipos de acordes**: Mayor, menor, disminuido, aumentado, séptimas
- **Personalización**: Duración de acordes y velocidad
- **Visualización de acordes**: Ve cada acorde de la progresión

### 🤖 Generador con Inteligencia Artificial
- **Generación por prompt**: Describe la música que quieres crear
- **IA de Google**: Usa Google Generative AI (Gemini 1.5 Flash) para crear música real
- **Múltiples estilos**: Melódico, rítmico, ambiental, jazz, clásico, electrónico
- **Configuración musical**: Tonalidad, tempo y estilo
- **Sugerencias automáticas**: Prompts predefinidos para inspirarte
- **Fallback inteligente**: Si la IA falla, usa generación local
- **Exportación MIDI**: Descarga las melodías generadas por IA

### 🎧 Reproductor MIDI
- **Reproducción completa**: Play, pause, stop y seek
- **Controles avanzados**: Volumen, velocidad de reproducción
- **Información detallada**: Metadatos de la pista generada
- **Exportación MIDI**: Descarga archivos MIDI para usar en tu DAW

## 🚀 Instalación

1. **Clona el repositorio**:
```bash
git clone https://github.com/tu-usuario/composer-assistant.git
cd composer-assistant
```

2. **Instala las dependencias**:
```bash
npm install
```

3. **Configura las variables de entorno**:
```bash
# Copia el archivo de ejemplo
cp env.example .env

# Edita el archivo .env y agrega tu API key de Google AI
VITE_GOOGLE_AI_API_KEY=tu_api_key_aqui
```

4. **Obtén tu API key de Google AI**:
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una nueva API key
   - Cópiala en el archivo `.env`

5. **Inicia el servidor de desarrollo**:
```bash
npm run dev
```

6. **Abre tu navegador** en `http://localhost:3000`

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework de interfaz de usuario
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de estilos
- **Tone.js** - Biblioteca de audio web
- **Lucide React** - Iconos modernos
- **@tonejs/midi** - Manejo de archivos MIDI
- **@google/generative-ai** - Integración con Google AI

## 📁 Estructura del Proyecto

```
composer-assistant/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── ScaleGenerator.jsx
│   │   ├── ChordProgressionGenerator.jsx
│   │   ├── AIGenerator.jsx
│   │   └── MIDIPlayer.jsx
│   ├── utils/
│   │   └── musicTheory.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎯 Uso

### Generador de Escalas
1. Selecciona la **nota raíz** (C, C#, D, etc.)
2. Elige el **tipo de escala** (mayor, menor, etc.)
3. Ajusta la **octava**, **duración** y **velocidad**
4. Haz clic en "Generar Escala" o "Escala Aleatoria"
5. Reproduce la escala o exporta el MIDI

### Generador de Progresiones
1. Selecciona la **nota raíz**
2. Elige el **tipo de progresión** (pop, jazz, rock, etc.)
3. Configura el **tipo de acorde** y **duración**
4. Genera la progresión
5. Reproduce o exporta para tu DAW

### Generador con IA
1. Escribe un **prompt** describiendo la música que quieres
2. Selecciona la **tonalidad** y **estilo**
3. Ajusta el **tempo**
4. Haz clic en "Generar con IA"
5. Escucha el resultado y ajusta según necesites

### Reproductor MIDI
- **Reproduce** las pistas generadas
- **Ajusta** volumen y velocidad
- **Exporta** archivos MIDI para usar en Ableton Live, Logic Pro, etc.

## 🎵 Integración con DAWs

Los archivos MIDI generados son compatibles con:
- **Ableton Live**
- **Logic Pro**
- **FL Studio**
- **Pro Tools**
- **Cubase**
- **Reaper**
- Y cualquier DAW que soporte archivos MIDI

## 🔧 Configuración Avanzada

### Personalización de Estilos
Puedes modificar los estilos en `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: { /* tus colores */ },
      secondary: { /* tus colores */ }
    }
  }
}
```

### Agregar Nuevas Escalas
Edita `src/utils/musicTheory.js` para agregar nuevos patrones de escalas:
```javascript
export const SCALE_TYPES = {
  // ... escalas existentes
  tuNuevaEscala: { 
    name: 'Tu Nueva Escala', 
    pattern: [0, 2, 4, 6, 8, 10] 
  }
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] Integración con APIs de IA reales (OpenAI, Google MusicLM)
- [ ] Más tipos de escalas y progresiones
- [ ] Editor de piano roll visual
- [ ] Soporte para múltiples pistas
- [ ] Efectos de audio integrados
- [ ] Colaboración en tiempo real
- [ ] Biblioteca de samples
- [ ] Exportación a otros formatos (WAV, MP3)

## 📄 Licencia

Este proyecto está bajo la Licencia Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0).

### ¿Qué significa esto?

✅ **Permitido:**
- Usar el código para proyectos personales
- Usar el código para fines educativos
- Modificar y adaptar el código
- Compartir el código

❌ **Prohibido:**
- Usar el código para fines comerciales
- Vender productos basados en este código
- Usar el código en aplicaciones comerciales

🔄 **Requerido:**
- Atribuir al autor original
- Compartir modificaciones bajo la misma licencia

Para más detalles, consulta el archivo `LICENSE` o visita [Creative Commons](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## 🙏 Agradecimientos

- **Tone.js** por la excelente biblioteca de audio web
- **Tailwind CSS** por el framework de estilos
- **Lucide** por los iconos hermosos
- La comunidad de música y desarrollo web

---

**¡Disfruta creando música! 🎶**

Para soporte o preguntas, abre un issue en GitHub o contacta a [tu-email@ejemplo.com] 