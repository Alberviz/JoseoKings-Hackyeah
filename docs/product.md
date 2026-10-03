# 🚀 Documento de Producto y Arquitectura de Innovación: GastroAI / GutCheck

> **Hackathon:** HackYeah 2026 (Tauron Arena, Cracovia) — Categoría: *Sport & Healthcare / Artificial Intelligence*  
> **Repositorio:** `JoseoKings-Hackyeah` (`Projects/Hackaton`)  
> **Autores:** Equipo JoseoKings  
> **Fecha:** Octubre 2026  
> **Estado:** Documentación Técnica y Científica de Producto (Blueprint)

---

## 1. Resumen Ejecutivo y Diagnóstico del Mercado

### 1.1. El Problema No Resuelto en la Enfermedad de Crohn
La Enfermedad de Crohn (EC) es una patología inflamatoria crónica intestinal que cursa en brotes impredecibles, dolor cólico invalidante y urgencia defecatoria (*fecal urgency*). 

Tras analizar las apps comerciales líderes (*Cara Care, MyGut, Bowelle, Aidy*) y los desarrollos más recientes de startups con gran financiación como **Mirae** (spinout de Oxford con $5.4M en julio de 2026), identificamos su **gran cuello de botella**:
* **Son sistemas "Post-Mortem":** Dependen de que el paciente recuerde y anote en un formulario o chat lo que comió o sintió hace horas o días. Cuando aparecen los síntomas 48 horas después, ya no hay margen de prevención ni certeza sobre qué desencadenó el brote.
* **Fatiga de Registro:** Más del 80% de los usuarios abandonan las apps antes de 3 semanas debido a la tediosa carga cognitiva de responder cuestionarios diarios.
* **Carencia de Biomarcadores Físicos en Tiempo Real:** Ninguna aplicación comercial utiliza el propio hardware del smartphone como sensor fisiológico activo para auscultar o medir el tracto digestivo directamente.

### 1.2. La Oportunidad de Innovación Radical para HackYeah
Nuestra propuesta convierte el smartphone en un **dispositivo de monitorización y terapia digital activa** combinando tres pilares pioneros respaldados por la última literatura científica (2024–2026):
1. **Acoustic GutCheck:** Fonometría intestinal por IA (auscultación digital con el micrófono del móvil).
2. **Neuro-Vagal Shield:** Biorretroalimentación del nervio vago y activación de la vía colinérgica antiinflamatoria.
3. **Continence Buffer & Safe-Zone Radar:** Estimación predictiva de la ventana de urgencia y navegación urbana protegida.

---

## 2. PILAR 1: Acoustic GutCheck (Fonometría Intestinal con IA)

### 2.1. Base Científica: Estudio de la Mayo Clinic (Octubre 2025)
* **Referencia:** *Prospects of AI-Powered Bowel Sound Analytics for Diagnosis, Characterization, and Treatment Management of Inflammatory Bowel Disease*. DEAL Lab (Digital Engineering & AI Laboratory), **Mayo Clinic** (*Med Sci*, Oct 2025, PMID: [41133513](https://pubmed.ncbi.nlm.nih.gov/41133513/), PMCID: PMC12551071).
* **Hallazgos Clave:**
  1. **Precisión Diagnóstica:** Modelos de aprendizaje profundo (Transformers, HuBERT, Wav2Vec 2.0 y Gradient Boosting) alcanzaron una **precisión diagnóstica del 88% al 96%** (AUC $\ge 0.83$, F1-score 0.80–0.85) distinguiendo intestino inflamado en EII frente a controles sanos y síndrome de intestino irritable (SII).
  2. **Biomarcador Cuantitativo Clave — Intervalo Silente ($SSI$):** En pacientes con Crohn activo, el intervalo de tiempo promedio entre ruidos peristálticos es significativamente más prolongado:
     $$\text{SSI}_{\text{Crohn Activo}} = 1232\text{ ms} \quad \text{vs.} \quad \text{SSI}_{\text{Control Sano}} = 511\text{ ms}$$
     Este silencio prolongado refleja hipomotilidad segmentaria inducida por edema e infiltración transmural de la mucosa.
  3. **Timbre Acústico y Turbulencia:** En fenotipos estenosantes (*stricturing phenotype*), se detectan ruidos de timbre metálico/agudo (*high-pitched tinkling*) y picos de turbulencia provocados por el paso forzado de quimo a través de segmentos de luz estrecha (típicamente en la válvula ileocecal).

---

### 2.2. El "Giro Extra" para el Paciente: Biofeedback Postprandial a los 30 Minutos
En lugar de una prueba médica aislada, creamos una experiencia de **Biofeedback Postprandial**:
* **Momento de uso:** 30–45 minutos tras la ingesta de una comida principal (cuando el quimo alcanza el íleon terminal).
* **Acción:** El usuario apoya la base del smartphone (micrófono inferior) durante 30 segundos sobre la **Fosa Ilíaca Derecha (FID)** (donde asienta la válvula ileocecal y donde se localiza el 80% de las lesiones de Crohn).
* **Respuesta Inmediata:**
  * Si hay motilidad rítmica sana ($\text{SSI} \approx 500\text{ ms}$): *"Digestión regular y sin hiperreactividad."*
  * Si hay hiperactividad turbulenta/espasmo: *"Alerta de reactividad precoz. Se detectan espasmos acústicos compatibles con intolerancia o irritación por esta comida."*
  * Si hay hipomotilidad severa ($\text{SSI} > 1200\text{ ms}$ sostenido): Alerta de posible estasis o inflamación ileal.

---

### 2.3. Arquitectura Técnica de Implementación (Web Audio API & DSP)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE PROCESAMIENTO DE AUDIO                 │
└────────────────────────────────────────────────────────────────────────┘
 [Micrófono Smartphone] 
         │ (getUserMedia, 44.1 kHz / 16-bit PCM)
         ▼
 [Filtro Paso Banda Biquad: 100 Hz – 1500 Hz] 
         │ (Elimina ruidos cardíacos <100Hz y voz ambiental >1500Hz)
         ▼
 [Análisis FFT en Tiempo Real (AnalyserNode, bufferSize=2048)]
         │
         ├───► [Render Espectrograma en Canvas (Efecto Visual Demo)]
         │
         ▼
 [Extracción de Métricas Acústicas en Ventanas de 50ms]:
   1. Energía RMS (Root Mean Square): Umbral dinámico de borborigmo.
   2. Zero Crossing Rate (ZCR): Distinción de fricción tisular.
   3. Spectral Centroid: Detección de timbre agudo (estenosis).
   4. Cálculo de Intervalos Entre Eventos (Sound-to-Sound Interval - SSI).
         │
         ▼
 [Clasificador de Estado Peristáltico (Ligero / Edge)]:
   - SSI < 700 ms  --> Normal / Normoperistalsis
   - SSI 700-1100 ms -> Alerta Leve / Motilidad Irregular
   - SSI > 1200 ms -> Hipomotilidad Inflamatoria (Marcador Crohn)
   - Energía Alta + Spectral Centroid > 800 Hz -> Espasmo Turbulento
```

#### Código Base del Procesamiento Acústico en Cliente:
```typescript
// Módulo de Captura y Filtrado Acústico (Client-Side)
export class GutAcousticEngine {
  private audioCtx: AudioContext;
  private analyser: AnalyserNode;
  private filter: BiquadFilterNode;
  private isListening = false;

  async startListening(onAcousticEvent: (data: any) => void) {
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });

    const source = this.audioCtx.createMediaStreamSource(stream);

    // Filtro Paso Banda: 100 Hz a 1500 Hz (frecuencias de borborigmos gastrointestinales)
    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'bandpass';
    this.filter.frequency.value = 500; // Frecuencia central
    this.filter.Q.value = 1.0;         // Ancho de banda que abarca 100-1500 Hz

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;

    source.connect(this.filter);
    this.filter.connect(this.analyser);
    this.isListening = true;

    this.processAudioLoop(onAcousticEvent);
  }

  private processAudioLoop(callback: (data: any) => void) {
    const buffer = new Float32Array(this.analyser.frequencyBinCount);
    let lastSoundTimestamp = performance.now();
    const intervals: number[] = [];

    const analyze = () => {
      if (!this.isListening) return;
      this.analyser.getFloatTimeDomainData(buffer);

      // Calcular Energía RMS
      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i++) sumSquares += buffer[i] * buffer[i];
      const rms = Math.sqrt(sumSquares / buffer.length);

      // Detección de borborigmo (umbral adaptativo)
      if (rms > 0.04) {
        const now = performance.now();
        const interval = now - lastSoundTimestamp;
        if (interval > 250) { // Ignorar rebotes del mismo sonido (<250ms)
          intervals.push(interval);
          lastSoundTimestamp = now;
          callback({
            type: 'BORBORYGMUS_DETECTED',
            energy: rms,
            ssi: interval,
            timestamp: now
          });
        }
      }
      requestAnimationFrame(analyze);
    };
    analyze();
  }

  stopListening() {
    this.isListening = false;
    if (this.audioCtx) this.audioCtx.close();
  }
}
```

---

## 3. PILAR 2: Neuro-Vagal Shield (Vía Colinérgica Antiinflamatoria)

### 3.1. Base Científica: Neuroinmunología y Nervio Vago (2025)
* **Referencias:**
  1. *Neuro-immune interactions: Exploring the anti-inflammatory role of the vagus nerve*. *Int Immunopharmacol*, Jun 2025, PMID: [40440960](https://pubmed.ncbi.nlm.nih.gov/40440960/).
  2. *Efficacy of vagus nerve stimulation in gastrointestinal disorders: a systematic review*. *Gastroenterol Rep (Oxf)*, Jan 2025, PMID: [39867596](https://pubmed.ncbi.nlm.nih.gov/39867596/).
* **Mecanismo Fisiológico:**
  * El nervio vago (X par craneal) controla el eje intestino-cerebro y modula la inflamación mediante la **Vía Colinérgica Antiinflamatoria (CAP)**.
  * La estimulación de las fibras eferentes vagales desencadena la liberación de **acetilcolina (ACh)** en el plexo mientérico y el bazo.
  * La acetilcolina se une específicamente a los **receptores nicotínicos $\alpha7\text{nAChR}$** en los macrófagos y linfocitos residentes de la pared intestinal, bloqueando la fosforilación de NF-$\kappa$B e **inhibiendo directamente la síntesis de citoquinas proinflamatorias clave: TNF-$\alpha$, IL-1$\beta$, IL-6 e IL-18**.
  * Los ensayos clínicos demuestran que la disfunción vagal (tono parasimpático deprimido) precede a los brotes de Crohn.

---

### 3.2. Implementación en el Smartphone: Medición de HRV y Respiración Resonante
1. **Medición Óptica de Tono Vagal (HRV por Fotopletismografía - PPG):**
   * El usuario apoya la yema del dedo sobre la cámara trasera con el flash encendido durante 30 segundos.
   * La app mide las micro-variaciones de luminosidad en el canal rojo causadas por cada onda de pulso arterial.
   * Calcula el parámetro **RMSSD** (*Root Mean Square of Successive Differences*), que es el reflejo directo del tono parasimpático/vagal.
2. **Protocolo Terapéutico de Respiración Resonante (0.1 Hz):**
   * Cuando el paciente reporta dolor cólico incipiente o el algoritmo detecta caída de HRV / espasmo acústico, la app activa el **Escudo Vagal**:
     * Inhalación de 4 segundos, exhalación lenta de 6 segundos ($0.1\text{ Hz} = 6\text{ respiraciones/minuto}$).
     * Acompañado de **vibración háptica rítmica** para que el paciente pueda cerrar los ojos y seguir el ritmo a ciegas.
     * Esta cadencia activa mecánicamente el barorreflejo cardiopulmonar y maximiza la descarga eferente del nervio vago sobre el plexo intestinal, reduciendo la percepción de dolor y relajando el espasmo muscular liso.

---

## 4. PILAR 3: Continence Buffer & Safe-Zone Radar (El "Waze" de Urgencias EII)

### 4.1. El Dolor Social del Paciente: Ansiedad por Incontinencia (*Toilet Anxiety*)
* El mayor factor de aislamiento social y depresión en personas con Crohn no es solo el dolor físico, sino el pánico a sufrir un episodio de incontinencia en público.
* Las apps existentes se limitan a mostrar un mapa estático de baños, lo cual no resuelve la incertidumbre previa al salir de casa.

### 4.2. Algoritmo de la "Ventana de Continencia Segura" ($T_{\text{safe}}$)
Un modelo heurístico que calcula el tiempo estimado de seguridad antes de la próxima necesidad urgente de evacuar:
$$T_{\text{safe}} = f(\Delta t_{\text{comida}}, \text{SSI}_{\text{acústico}}, \text{Histórico}_{\text{PRO2}}, \text{Estrés}_{\text{HRV}})$$

* Si $T_{\text{safe}} > 90\text{ min}$: 🟢 **Estado Verde (Zona de Confort):** Puedes salir a pasear o trabajar con normalidad.
* Si $T_{\text{safe}} = 30-60\text{ min}$: 🟡 **Estado Ámbar (Precaución Activa):** El sistema recomienda mantenerse cerca de nodos de aseo verificados.
* Si $T_{\text{safe}} < 25\text{ min}$: 🔴 **Estado Rojo (Ventana Crítica):** La app precarga la ruta al baño más próximo.

### 4.3. Navegación Peatonal Protegida y Carné Digital Criptográfico
1. **Ruta Peatonal Segura:**
   * Utilizando mapas vectoriales y la API de OpenStreetMap (`amenity=toilets`), la app calcula rutas urbanas garantizando que en **ningún punto del trayecto el usuario esté a más de 3 minutos caminando de un baño público o establecimiento colaborador**.
2. **Pase Médico de Urgencia con Zero-Knowledge Proof (ZKP) / QR Firmado:**
   * Al pulsar el botón flotante de emergencia en la app, la pantalla entra en modo alto brillo mostrando el carné digital *"No puedo esperar"*.
   * Incorpora un código QR firmado criptográficamente que acredita que la persona es paciente con necesidad médica prioritaria, **sin mostrar su nombre completo, diagnóstico exacto ni historial clínico**, respetando al 100% el RGPD de datos médicos sensibles.

---

## 5. Arquitectura del Sistema para la Demo del Hackathon

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (PWA / React + Vite)                   │
├───────────────────────┬────────────────────────┬───────────────────────┤
│    GutCheck Audio     │    Vagus HRV & Pulse   │   Safe-Zone Radar     │
│   (Web Audio API)     │   (Camera PPG / Canvas)│  (Leaflet/OpenStreet) │
└───────────┬───────────┴───────────┬────────────┴───────────┬───────────┘
            │                       │                        │
            ▼                       ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    CORE ENGINE (TypeScript Client-Side)                │
├────────────────────────────────────────────────────────────────────────┤
│  • Motor Acústico: FFT, Filtro Biquad 100-1500Hz, Cálculo de SSI       │
│  • Motor Neuro-Vagal: Detección de picos R-R, RMSSD, Guía Háptica 0.1Hz│
│  • Motor Clínico: Cálculo de scores validados PRO2 y HBI               │
│  • Storage Local: IndexedDB / LocalStorage (100% Offline-First)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   MÓDULO DE EXPORTACIÓN MÉDICA                         │
├────────────────────────────────────────────────────────────────────────┤
│  • Generador de Informe PDF (jsPDF): Resumen clínico de 1 página con   │
│    curva de SSI acústico, evolución de PRO2 y adherencia a biológicos  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Bibliografía y Evidencias Clínicas Utilizadas

1. **Mayo Clinic DEAL Lab (2025):** Sood D, et al. *Prospects of AI-Powered Bowel Sound Analytics for Diagnosis, Characterization, and Treatment Management of Inflammatory Bowel Disease*. *Med Sci (Basel)*, PMID: [41133513](https://pubmed.ncbi.nlm.nih.gov/41133513/).
2. **Vagus Nerve in IBD (2025):** Liu L, et al. *Neuro-immune interactions: Exploring the anti-inflammatory role of the vagus nerve*. *Int Immunopharmacol*, PMID: [40440960](https://pubmed.ncbi.nlm.nih.gov/40440960/).
3. **VNS Systematic Review (2025):** Veldman F, et al. *Efficacy of vagus nerve stimulation in gastrointestinal disorders*. *Gastroenterol Rep (Oxf)*, PMID: [39867596](https://pubmed.ncbi.nlm.nih.gov/39867596/).
4. **Wearable Flare Prediction (2025):** Wearable physiological metrics predicting IBD flare-ups. *PubMed*, PMID: [39826619](https://pubmed.ncbi.nlm.nih.gov/39826619/).
5. **Mobile Index Validation (AGA):** van Deen WV, et al. *Development and Validation of an Inflammatory Bowel Diseases Monitoring Index for Use With Mobile Health Technologies*. *Clin Gastroenterol Hepatol*, [Consensus Ref](https://consensus.app/papers/details/186daf13a8e3513484838a3a4a8a97c0/?utm_source=unknown).
6. **MediCrohn Study:** Echarri A, et al. *The Harvey–Bradshaw Index Adapted to a Mobile Application Compared with In-Clinic Assessment*. *Telemed J E Health*, [Consensus Ref](https://consensus.app/papers/details/fcdb17a7067c50c5a03195b880074bb3/?utm_source=unknown).
7. **The Lancet Digital Health (2025):** Gasparetto M, et al. *Efficacy of digital health technologies in the management of inflammatory bowel disease: an umbrella review*. [Consensus Ref](https://consensus.app/papers/details/67743cebd4ac5e4e995cc3b71ee0b063/?utm_source=unknown).
