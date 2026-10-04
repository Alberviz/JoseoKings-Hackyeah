# Wearables & Smartwatch Integration (Google Health API v4)

Este documento detalla de manera exhaustiva toda la arquitectura, implementación técnica, resolución de incidencias, documentación de la API y el estado actual del módulo de relojes inteligentes (Wearables) desarrollado para **CrohnCare** en la rama `feat/w1-wearables` (PR #98 / Tarea W1).

---

## 1. Resumen Ejecutivo y Arquitectura

### 1.1. Enfoque Client-Side (PWA Direct)

A diferencia de arquitecturas tradicionales que requieren almacenar tokens y secretos OAuth en un servidor backend con riesgos de seguridad y gestión de sesiones complejas, la integración se diseñó **100% en el cliente (Browser-to-Google)**:

- **Flujo de Autorización:** Se utiliza **Google Identity Services (GIS)** (`google.accounts.oauth2.initTokenClient`) con `ux_mode: "popup"`.
- **Credenciales Requeridas:** Solo se necesita el `NEXT_PUBLIC_GOOGLE_CLIENT_ID` público (sin client secret en el frontend).
- **Almacenamiento Local:** Las métricas normalizadas y los días agregados se almacenan en el `localStorage` del navegador bajo las claves:
  - `crohncare_watch_state`: Estado de conexión, tokens efímeros, dispositivos descubiertos y selección activa.
  - `crohncare_watch_daily`: Tabla histórica de días (`WatchDay[]`) con pasos, sueño y frecuencia cardíaca.
  - `crohncare_watch_raw_samples`: Muestras en bruto (`WatchSample[]`) normalizadas con marca de tiempo UTC y fuente.

---

## 2. Todo lo Implementado para el Reloj

### 2.1. Conexión y Autenticación OAuth

- **Archivos:** [`src/lib/wearables/googleAuth.ts`](../src/lib/wearables/googleAuth.ts), [`src/hooks/useGoogleAuth.ts`](../src/hooks/useGoogleAuth.ts)
- **Scopes solicitados:**
  - `https://www.googleapis.com/auth/health.fitness.activity.read` (pasos y actividad física).
  - `https://www.googleapis.com/auth/health.fitness.sleep.read` (sesiones y fases de sueño).
  - `https://www.googleapis.com/auth/health.fitness.body.read` (frecuencia cardíaca).
- **Manejo de Tokens:** El token de acceso se almacena en memoria/estado local con comprobación de expiración (`expiresAt`) antes de cada sincronización.

### 2.2. Ingesta y Extracción de Métricas (Google Health API v4)

- **Archivos:** [`src/lib/wearables/browserGoogleHealth.ts`](../src/lib/wearables/browserGoogleHealth.ts), [`src/lib/wearables/googleHealthV4.ts`](../src/lib/wearables/googleHealthV4.ts)
- **Métricas Extraídas:**
  1. **Pasos Diarios (`dataTypes/steps/dataPoints`):** Paginación automática, agregación por día civil según la zona horaria del usuario (`Europe/Madrid`).
  2. **Sesiones de Sueño (`dataTypes/sleep/dataPoints`):** Recuperación de sesiones completas de sueño, duración neta en minutos y ventanas de descanso nocturno.
  3. **Frecuencia Cardíaca (`dataTypes/heart-rate/dataPoints`):**
     - Ventanas de consulta de máximo 14 días (límite de la API de Google Health).
     - **Estrategia Dual de Filtrado (Fallback):** Ciertos proveedores y relojes (como Amazfit o Zepp sincronizados a través de Health Connect / Google Fit) guardan el pulso con marcas de tiempo instantáneas (`sample_time.physical_time`) en lugar de intervalos (`interval.start_time`). Si el endpoint devuelve 400 al filtrar por intervalo, el cliente reintenta de forma transparente e inmediata usando el filtro de tiempo físico.

### 2.3. Resolución del Error HTTP 400 Bad Request

- **Incidencia:** Al consultar `heart-rate` o `sleep`, la consola del navegador reportaba:
  `GET https://health.googleapis.com/v4/users/me/dataTypes/.../dataPoints?...&dataSourceFamily=users%2Fme%2FdataSourceFamilies%2Fall-sources 400 (Bad Request)`
  Esto provocaba que el pulso y el sueño fallaran y devolvieran arrays vacíos, dejando `sleepMinutes: null` y `restingHr: null` en `localStorage`.
- **Causa Raíz:** En la especificación REST de Google Health API v4, el parámetro `dataSourceFamily` es inválido y no está soportado en las rutas `/dataPoints`.
- **Solución:** Se erradicó por completo el parámetro `dataSourceFamily` de todas las llamadas HTTP y tipos en [`src/lib/wearables/browserGoogleHealth.ts`](../src/lib/wearables/browserGoogleHealth.ts). Ahora las llamadas pasan únicamente `filter` y `pageSize`, obteniendo respuestas `200 OK`.

### 2.4. Selector de Dispositivos (Device Attribution)

- **Archivos:** [`src/types/watch.ts`](../src/types/watch.ts), [`src/lib/storage/watchStore.ts`](../src/lib/storage/watchStore.ts), [`src/components/features/parent-mode/WatchConnectCard/`](../src/components/features/parent-mode/WatchConnectCard/)
- **Extracción de Metadatos:** En `googleHealthV4.ts`, cada punto de datos extrae el nombre legible o modelo del hardware emisor desde `point.dataSource.device.displayName` o `model` (ej. _"Amazfit Balance"_, _"Pixel Watch 2"_, _"Xiaomi Band"_ o el teléfono móvil).
- **Selector UI:** Si el usuario tiene más de un dispositivo enviando datos a su cuenta de Google Health, en la tarjeta de Ajustes del Padre aparecen chips selectores:
  - _Todos los dispositivos_ (por defecto).
  - Chip individual por cada reloj o dispositivo detectado.
  - Permite filtrar y recalcular métricas basales aislando únicamente las mediciones del reloj del niño.

### 2.5. Motor Matemático Determinista y Validación

- **Archivos:** [`src/lib/wearables/validity.ts`](../src/lib/wearables/validity.ts), [`src/lib/wearables/clean.ts`](../src/lib/wearables/clean.ts), [`src/lib/wearables/baseline.ts`](../src/lib/wearables/baseline.ts), [`src/lib/wearables/restingHr.ts`](../src/lib/wearables/restingHr.ts), [`src/lib/wearables/parentStatus.ts`](../src/lib/wearables/parentStatus.ts)
- **100% Determinista (Sin IA / Sin ML):**
  - **Regla A0 de Validez de Uso:** Día válido diurno si $\ge 10\text{ h}$ de registro. Noche válida si $\ge 180\text{ min}$ de sueño con al menos 20 muestras de pulso.
  - **Filtro Hampel (A1):** Detección y filtrado de picos espurios o lecturas anómalas (ventana móvil de 7 días, umbral $3 \times 1.4826 \times \text{MAD}$).
  - **Línea Base Personal de 14 Días (A2):** Cálculo de mediana y rango intercuartílico (IQR). Puntuación robusta de desviación:
    $$D_t = \frac{x_t - \text{mediana}}{s}$$
  - **Frecuencia Cardíaca en Reposo Nocturno (A3):** Promedio de la ventana mínima de 30 minutos continuos durante el periodo de sueño.
  - **Estado Orientativo para Padres:** Rango habitual (_Verde_), Ligera variación (_Amarillo_), Cambio continuado (_Naranja_ con $\ge 3$ días fuera de rango habitual). Textos descriptivos neutros sin diagnósticos médicos ni alarmismos.

### 2.6. Integración en Informe Clínico Médico (`DoctorReportView`)

- **Archivos:** [`src/lib/report/buildReport.ts`](../src/lib/report/buildReport.ts), [`src/components/features/doctor-report/DoctorReportView/`](../src/components/features/doctor-report/DoctorReportView/)
- **Datos Médicos Consolidados:**
  - Resumen de métricas del reloj con medianas, IQR y días válidos registrados.
  - Cruce con observaciones de deposiciones familiares (PR #103): recuento diurno/nocturno, heces más blandas y presencia de sangre.
  - Sparklines gráficos en SVG puro sin librerías externas pesadas.
  - Hoja de estilos de impresión con `@media print` para volcado directo a A4 limpio sin elementos de navegación ni botones.

---

## 3. Documentación de la API de Google Health v4

### 3.1. Endpoint Base y Autenticación

- **Base URL:** `https://health.googleapis.com/v4/users/me`
- **Cabecera obligatoria:** `Authorization: Bearer <ACCESS_TOKEN>`

### 3.2. Endpoints Utilizados

#### A. Pasos (`steps`)

- **Ruta:** `GET /dataTypes/steps/dataPoints`
- **Query Parameters:**
  - `filter`: `steps.interval.start_time >= "YYYY-MM-DDTHH:mm:ss.sssZ" AND steps.interval.start_time < "YYYY-MM-DDTHH:mm:ss.sssZ"`
  - `pageSize`: `1000` (paginado con `pageToken` si excede).
- **Estructura de respuesta simplificada:**
  ```json
  {
    "dataPoints": [
      {
        "steps": {
          "count": 142,
          "interval": {
            "startTime": "2026-10-03T10:00:00Z",
            "endTime": "2026-10-03T10:15:00Z"
          }
        },
        "dataSource": {
          "device": { "displayName": "Amazfit Balance", "model": "A2286" }
        }
      }
    ]
  }
  ```

#### B. Sueño (`sleep`)

- **Ruta:** `GET /dataTypes/sleep/dataPoints`
- **Query Parameters:**
  - `filter`: `sleep.interval.civil_end_time >= "YYYY-MM-DD"`
  - `pageSize`: `25`
- **Estructura de respuesta simplificada:**
  ```json
  {
    "dataPoints": [
      {
        "sleep": {
          "sessionDuration": "28800s",
          "interval": {
            "startTime": "2026-10-02T23:00:00Z",
            "endTime": "2026-10-03T07:00:00Z"
          }
        },
        "dataSource": {
          "device": { "displayName": "Amazfit Balance" }
        }
      }
    ]
  }
  ```

#### C. Frecuencia Cardíaca (`heart-rate`)

- **Ruta:** `GET /dataTypes/heart-rate/dataPoints`
- **Query Parameters (Estrategia Principal):**
  - `filter`: `heart_rate.interval.start_time >= "..." AND heart_rate.interval.start_time < "..."`
  - `pageSize`: `10000`
- **Query Parameters (Fallback si devuelve 400):**
  - `filter`: `heart_rate.sample_time.physical_time >= "..." AND heart_rate.sample_time.physical_time < "..."`
  - `pageSize`: `1000`
- **Estructura de respuesta simplificada:**
  ```json
  {
    "dataPoints": [
      {
        "heartRate": {
          "beatsPerMinute": 68.0,
          "interval": {
            "startTime": "2026-10-03T04:12:00Z",
            "endTime": "2026-10-03T04:12:05Z"
          }
        },
        "dataSource": {
          "device": { "displayName": "Amazfit Balance" }
        }
      }
    ]
  }
  ```

---

## 4. Estado Actual y Verificación

### 4.1. Estado de los Tests y Calidad de Código

- **Vitest Unit Suite:** 10 suites de prueba pasando al 100% (51 tests):
  - `validity.test.ts`
  - `clean.test.ts`
  - `baseline.test.ts`
  - `restingHr.test.ts`
  - `counts.test.ts`
  - `parentStatus.test.ts`
  - `buildWatchDays.test.ts`
  - `browserGoogleHealth.test.ts`
  - `demoWatchDays.test.ts`
  - `pipeline-verify.test.ts`
- **TypeScript & Linter:** `pnpm typecheck` y `eslint` pasando con 0 errores.
- **Build de Producción:** Generada con éxito (`next build`), empaquetando 81 activos precacheados en el Service Worker.

### 4.2. Cómo Probar en Local

1. Servidor en ejecución: `http://localhost:3100`.
2. En el navegador (Google Chrome / Chromium):
   - Abre `http://localhost:3100/parent/settings`.
   - **Importante:** Al ser una PWA con Service Worker, haz un refresco forzado (**Ctrl + Shift + R**) o en DevTools > _Application_ > _Service Workers_ pulsa _Unregister_ para descargar el bundle nuevo sin el error 400.
   - Pulsa en **"Conectar con Google Health"** o **"Sincronizar ahora"**.
3. Abre la consola de desarrollador y ejecuta:
   ```javascript
   console.table(JSON.parse(localStorage.getItem("crohncare_watch_daily")).days);
   ```
4. Comprobarás que:
   - `steps` refleja las cuentas reales diarias.
   - `sleepMinutes` muestra los minutos de descanso (no null).
   - `restingHr` muestra el pulso en reposo calculado durante el sueño.
   - `nightComplete` y `dayComplete` marcan la validez objetiva de los datos.

### 4.3. Estado de la Rama y Pull Request

- **Rama:** `feat/w1-wearables`
- **Commits Clave:**
  - `797c732`: _feat(watch): resolve heart-rate 400 error and add device selector_
  - `87b61b5`: _feat(report): refine doctor report statistics and print view (T11/W1 integration)_
  - `65f422c`: _fix(wearables): remove invalid dataSourceFamily parameter from dataPoints requests_
  - `ccf9bdb`: _fix(wearables): completely remove dataSourceFamily parameter from ListSpec and listAll_
- **Sincronización:** Subido y actualizado en `origin/feat/w1-wearables`.
