# 🔬 Investigación Científica y Metodológica: App para Pacientes con Enfermedad de Crohn (Hackathon)

> **Repositorio:** `JoseoKings-Hackyeah` (`Projects/Hackaton`)  
> **Fecha:** Octubre 2026  
> **Fuentes:** Ensayos clínicos (TECCU, MediCrohn, STRIDE-II), guías internacionales (ECCO, AGA, GETECCU), revisiones sistemáticas de salud digital (JMIR, Lancet Gastroenterology).

---

## 1. Resumen Ejecutivo y Visión del Producto

La Enfermedad de Crohn (EC) es una enfermedad inflamatoria intestinal (EII) crónica, fluctuante y heterogénea caracterizada por periodos de remisión y brotes inflamatorios (*flares*). 

Las revisiones sistemáticas de salud digital en EII (publicadas en *JMIR mHealth* y *Journal of Crohn's and Colitis*) revelan que la gran mayoría de apps comerciales fallan por:
1. **Falta de rigor médico:** Pocas implementan escalas validadas internacionalmente o involucran a gastroenterólogos en el diseño.
2. **Carga cognitiva excesiva:** Formularios tediosos de 50 campos diarios que el paciente abandona a las 2 semanas.
3. **Falta de accionabilidad clínica:** Acumulan datos que no sirven ni al paciente en su día a día ni al médico en la consulta de revisión.

**Oportunidad ganadora para el Hackathon:**  
Crear una aplicación **centrada en el paciente y validada clínicamente**, con registro ultrarrápido (<30 segundos/día mediante **PRO2** y **Bristol**), detección predictiva de brotes, mapa de aseos de emergencia con carné digital (*"No puedo esperar"*), seguimiento nutricional adaptado a **CDED** y un **informe de 1 página optimizado para la consulta de gastroenterología**.

---

## 2. Métodos Clínicos Más Estudiados y Validados

### 2.1. PRO2 (Patient-Reported Outcome 2) — *El Estándar de Oro Rápido*
* **Origen:** Subconjunto simplificado del clásico *Crohn's Disease Activity Index (CDAI)*, validado y adoptado por la FDA y la EMA para ensayos clínicos.
* **Componentes:**
  1. **Frecuencia de deposiciones líquidas o muy blandas** en las últimas 24 horas (número entero).
  2. **Dolor abdominal diario** puntuado de 0 a 3:
     * `0`: Ninguno / Sin dolor
     * `1`: Leve
     * `2`: Moderado
     * `3`: Severo
* **Ventaja UX:** Requiere solo 2 preguntas cuantitativas al día. Permite calcular tendencias de remisión clínica sin requerir análisis de laboratorio.

### 2.2. Harvey-Bradshaw Index (HBI / sHBI) — *Telemonitorización Integral*
* **Evidencia:** Validado para telemonitorización autoadministrada en el estudio clínico *MediCrohn* y en el ensayo multicéntrico español *TECCU* (*Telemonitorización de la Enfermedad de Crohn y Colitis Ulcerosa*).
* **Parámetros evaluados:**
  1. Estado general de bienestar (`0` muy bien, `1` ligeramente por debajo de la media, `2` regular, `3` mal, `4` pésimo).
  2. Dolor abdominal (`0` ninguno a `3` severo).
  3. Número de deposiciones líquidas/día.
  4. Presencia de masa abdominal (habitualmente `0` en modo paciente / autoevaluación).
  5. Manifestaciones extraintestinales (artritis/artralgia, eritema nodoso, uveítis, aftas bucales, fisura/fístula/absceso anal).
* **Interpretación:**
  * `< 5`: Remisión clínica.
  * `5 - 7`: Actividad leve.
  * `8 - 16`: Actividad moderada.
  * `> 16`: Actividad severa.

### 2.3. Escala de Heces de Bristol (Bristol Stool Form Scale - BSFS)
* Registro visual (Tipos 1 a 7).
* En Crohn, los **Tipos 5, 6 y 7** (heces pastosas, disgregadas o enteramente líquidas) son indicadores de tránsito acelerado e inflamación ileal/colónica.

### 2.4. Monitorización de Calprotectina Fecal Domiciliaria
* **Concepto:** Biomarcador fecal que mide neutrófilos en mucosa intestinal. Es el biomarcador más sensible de inflamación activa.
* **Evidencia (Estrategia STRIDE-II / Treat-to-Target):** La calprotectina fecal se eleva **entre 2 y 3 meses antes** de que el paciente experimente síntomas del brote.
* **Integración en la app:** Registro numérico de resultados de laboratorio o de tests rápidos domiciliares (ej. tipo *CalproSmart* o *IBDoc*). Alerta cuando supera `150-250 µg/g`.

### 2.5. Protocolos Nutricionales Validados: CDED y FODMAP
* **CDED (Crohn's Disease Exclusion Diet):** La única dieta con ensayos clínicos aleatorizados pediátricos y en adultos que ha demostrado inducir y mantener remisión en Crohn leve-moderado combinada con nutrición enteral parcial.
* **Enfoque de la app:** Clasificador de alimentos en "Permitidos", "Restringidos" y "Fase de reintroducción", en lugar de una restricción calórica general.

---

## 3. Matriz de Funcionalidades Recomendadas para la App

| Prioridad | Funcionalidad | Base Científica / Necesidad Real | Detalle de Implementación |
| :--- | :--- | :--- | :--- |
| **P0 (Esencial)** | **Check-in Diario en 30s (PRO2 + Bristol)** | Ensayos PRO2 / BSFS | Slider intuitivo de dolor (0-3), contador de deposiciones y selector gráfico Bristol. |
| **P0 (Esencial)** | **Semáforo de Estado y Alerta de Brote** | Protocolo TECCU | Algoritmo que si detecta HBI > 5 o dolor moderado + >4 deposiciones durante 3 días seguidos, cambia a ámbar/rojo con recomendaciones de seguridad. |
| **P0 (Esencial)** | **Buscador de Baños y Tarjeta de Urgencia** | Proyecto "No Puedo Esperar" (ACCU) | Geolocalización de aseos públicos/comercios y carné digital médico en pantalla para acceso prioritario. |
| **P1 (Alto valor)** | **Gestión de Fármacos y Terapias Biológicas** | Adherencia terapéutica en EII | Recordatorio de infusiones (cada 4/8 semanas) o inyecciones subcutáneas (Adalimumab/Ustekinumab/Risankizumab) y corticoides con pauta descendente. |
| **P1 (Alto valor)** | **Informe Clínico para el Digestivo (PDF)** | Comunicación médico-paciente | Resumen de 1 página con gráficas de evolución mensual de deposiciones, dolor, días de baja y adherencia farmacológica. |
| **P2 (Diferencial)** | **Diario de Gatillos y Dieta (CDED)** | Crohn's Disease Exclusion Diet | Registro rápido de comidas para correlacionar ingesta con episodios de inflamación en 24-48h. |
| **P2 (Diferencial)** | **Registro de Calprotectina Fecal y Analíticas** | Treat-to-Target (STRIDE-II) | Gráfico de evolución de calprotectina fecal y PCR (Proteína C Reactiva). |

---

## 4. Arquitectura y Recomendaciones Técnicas para el Hackathon

1. **Privacidad y Seguridad (GDPR / Health Data):**
   * Los datos de salud son categoría especial según el RGPD. 
   * Cifrado local (e.g. SQLite con SQLCipher o SecureStore / IndexedDB con AES-GCM).
   * Arquitectura *Local-First*: el usuario puede utilizar toda la app sin registrarse ni enviar sus datos a servidores si no lo desea.
2. **Offline-First:**
   * Las urgencias gastrointestinales ocurren a menudo en parkings, transporte subterráneo o zonas rurales sin cobertura. El mapa de baños y el registro diario deben funcionar 100% offline.
3. **Exportación Estándar:**
   * Exportación a PDF limpio listo para imprimir o enviar por correo antes de la consulta médica.

---

## 5. Evidencia Científica Directa y Estudios Clínicos Clave (Vía Consensus MCP)

A través de las consultas a **Consensus MCP**, destacamos los estudios y ensayos clínicos más relevantes para sustentar el desarrollo de la aplicación:

1. [Development and Validation of an Inflammatory Bowel Diseases Monitoring Index for Use With Mobile Health Technologies](https://consensus.app/papers/details/186daf13a8e3513484838a3a4a8a97c0/?utm_source=unknown) (W. V. van Deen et al., *Clinical Gastroenterology and Hepatology*):
   * **Hallazgo clave:** Desarrollaron y validaron un índice móvil específico para Crohn basado en **4 factores clave reportados por el paciente**: frecuencia de heces líquidas, dolor abdominal, bienestar general y percepción subjetiva de control de la enfermedad.
   * **Resultado:** Detectó la actividad clínica de la enfermedad con un **AUC ROC de 0.90** y fiabilidad test-retest de 0.94. Ideal para la base del algoritmo de la app.

2. [The Harvey–Bradshaw Index Adapted to a Mobile Application Compared with In-Clinic Assessment: The MediCrohn Study](https://consensus.app/papers/details/fcdb17a7067c50c5a03195b880074bb3/?utm_source=unknown) (A. Echarri et al., *Telemedicine Journal and e-Health*):
   * **Hallazgo clave:** Ensayo con 219 pacientes comparando el HBI autoadministrado en app móvil frente a la evaluación física del gastroenterólogo en consulta.
   * **Resultado:** Concordancia del **92.4%** ($\kappa = 0.796$) y un Valor Predictivo Positivo (VPP) del **98.2%** para remisión. Demuestra que el autocontrol digital es clínicamente equiparable a la consulta física.

3. [Efficacy of digital health technologies in the management of inflammatory bowel disease: an umbrella review](https://consensus.app/papers/details/67743cebd4ac5e4e995cc3b71ee0b063/?utm_source=unknown) (M. Gasparetto et al., 2025, *The Lancet Digital Health*):
   * **Hallazgo clave:** Metaanálisis que demostró que el uso continuado de herramientas digitales de salud en EII se asocia significativamente a una **reducción de ingresos y visitas hospitalarias imprevistas**, y a un **incremento sustancial de la adherencia terapéutica**.

4. [A biomarker-stratified comparison of top-down versus accelerated step-up treatment strategies for patients with newly diagnosed Crohn's disease (PROFILE)](https://consensus.app/papers/details/ddcf6456297f50ceba0bda2c70431452/?utm_source=unknown) (N. Noor et al., 2024, *The Lancet Gastroenterology & Hepatology*):
   * **Definición estándar de brote (Flare):** HBI $\ge 5$ acompañado de biomarcadores elevados (calprotectina fecal $\ge 200\ \mu\text{g/g}$ o PCR por encima del límite normal). Base para el semáforo rojo de la app.

5. [Telemedicine in inflammatory bowel disease: A systematic review and randomized controlled trial (TECCU Trial)](https://consensus.app/papers/details/67743cebd4ac5e4e995cc3b71ee0b063/?utm_source=unknown) (Aguas M, et al.):
   * Demostró la no inferioridad de la telemonitorización frente a la atención presencial tradicional y una reducción de costes directos e indirectos.

