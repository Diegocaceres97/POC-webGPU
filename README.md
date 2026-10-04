# Ionic + Angular + WebGPU POC

Proof of Concept para evaluar el uso de **WebGPU dentro de una aplicación Ionic + Angular + Capacitor**, con foco en compatibilidad, arquitectura, renderizado gráfico y cómputo acelerado por GPU.

El objetivo principal es determinar hasta qué punto una aplicación híbrida construida con tecnologías web puede aprovechar directamente la GPU del dispositivo en:

- Web
- Android
- iOS

sin comenzar con implementaciones específicas en Metal, Vulkan o APIs nativas.

---

## Objetivo

Este proyecto busca responder principalmente:

> ¿Es viable utilizar WebGPU dentro de una aplicación Ionic + Angular y aprovechar la GPU en Web, Android e iOS manteniendo una base de código común?

El POC no busca construir un producto final.

Busca explorar técnicamente:

- compatibilidad de WebGPU con Ionic
- compatibilidad con Capacitor
- funcionamiento dentro de WebView y WKWebView
- integración con Angular
- renderizado mediante GPU
- Compute Shaders
- manejo de buffers
- rendimiento
- diferencias entre plataformas
- arquitectura adecuada para aislar WebGPU
- posibles estrategias de fallback

---

# ¿Por qué WebGPU?

En una aplicación web tradicional, gran parte de la lógica es ejecutada por la CPU.

```text
JavaScript / TypeScript
        │
        ▼
       CPU
```

Esto funciona perfectamente para la mayoría de aplicaciones.

Sin embargo, existen escenarios en los que una GPU puede ser mucho más eficiente:

- gráficos 2D y 3D
- simulaciones
- sistemas de partículas
- procesamiento de imágenes
- procesamiento de video
- machine learning
- visualización de grandes volúmenes de datos
- cálculos matemáticos altamente paralelizables

WebGPU permite acceder desde el entorno web a capacidades modernas de la GPU.

```text
Angular / TypeScript
        │
        ▼
      WebGPU
        │
        ▼
 Browser / WebView
        │
        ▼
       GPU
```

---

# ¿Por qué Ionic?

Ionic permite desarrollar aplicaciones utilizando tecnologías web:

```text
HTML
CSS
TypeScript
Angular
```

y distribuirlas posteriormente mediante Capacitor hacia:

```text
Web
Android
iOS
```

Esto plantea una pregunta interesante:

```text
                    Ionic Angular
                          │
                          ▼
                        WebGPU
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
             Web       Android       iOS
              │           │           │
           Browser      WebView    WKWebView
              │           │           │
              └───────────┼───────────┘
                          ▼
                         GPU
```

Si esta arquitectura resulta viable, podríamos utilizar una única implementación gráfica para diferentes plataformas.

---

# Hipótesis

La hipótesis principal del POC es:

> Ionic + Angular puede utilizar WebGPU directamente desde el entorno web de la aplicación y ejecutar operaciones aceleradas por GPU sin requerir inicialmente un plugin nativo específico.

Esta hipótesis debe validarse en:

```text
Desktop Browser
Android real
iPhone real
```

---

# Stack

Actualmente utilizamos:

- Ionic
- Angular
- TypeScript
- Capacitor
- WebGPU
- WGSL
- HTML Canvas

Durante las primeras fases evitamos frameworks gráficos adicionales para comprender directamente cómo funciona WebGPU.

Tecnologías que podrían evaluarse posteriormente:

- Three.js
- Babylon.js
- Rust
- wgpu
- WebAssembly
- WebGL como fallback

---

# Estado actual

Actualmente el POC ya logra completar correctamente:

```text
Ionic
   │
Angular
   │
HTML Canvas
   │
navigator.gpu
   │
GPUAdapter
   │
GPUDevice
   │
GPUCanvasContext
   │
context.configure()
   │
GPU
```

En navegador hemos validado:

- [x] Aplicación Ionic funcionando.
- [x] Angular funcionando.
- [x] Canvas accesible desde Angular.
- [x] `navigator.gpu` disponible.
- [x] Obtención de `GPUAdapter`.
- [x] Obtención de `GPUDevice`.
- [x] Obtención de `GPUCanvasContext`.
- [x] Obtención del formato recomendado del canvas.
- [x] Configuración del canvas mediante WebGPU.
- [ ] Primer render con WebGPU.
- [ ] Render Pipeline.
- [ ] Render Pass.
- [ ] Animación.
- [ ] Compute Shader.
- [ ] Sistema de partículas.
- [ ] Benchmark.
- [ ] Prueba Android.
- [ ] Prueba iOS.

---

# Implementación actual

## 1. Detección de WebGPU

La primera validación consiste en comprobar si el entorno expone:

```ts
navigator.gpu
```

Ejemplo:

```ts
if (!navigator.gpu) {
  this.status.set('WebGPU no soportado');
  return;
}
```

Esto nos permite realizar feature detection antes de intentar utilizar WebGPU.

---

# 2. GPUAdapter

El siguiente paso consiste en solicitar un adaptador:

```ts
const adapter = await navigator.gpu.requestAdapter();
```

Conceptualmente:

```text
navigator.gpu
     │
     ▼
GPUAdapter
```

`GPUAdapter` representa una interfaz hacia un dispositivo gráfico disponible.

No necesariamente representa directamente una GPU física específica.

---

# 3. GPUDevice

Una vez obtenido el adapter solicitamos:

```ts
const device = await adapter.requestDevice();
```

Ahora tenemos:

```text
navigator.gpu
     │
     ▼
GPUAdapter
     │
     ▼
GPUDevice
```

`GPUDevice` es uno de los objetos principales de WebGPU.

A través de él podemos crear:

```text
Buffers
Textures
Shaders
Pipelines
Command Encoders
Render Pipelines
Compute Pipelines
```

---

# 4. Canvas

Desde Angular obtenemos el elemento HTML utilizando:

```ts
@ViewChild('gpuCanvas')
canvas!: ElementRef<HTMLCanvasElement>;
```

En el template:

```html
<canvas
  #gpuCanvas
  width="800"
  height="600">
</canvas>
```

Angular nos permite obtener posteriormente:

```ts
const canvas = this.canvas.nativeElement;
```

---

# 5. GPUCanvasContext

Solicitamos al canvas el contexto WebGPU:

```ts
const context =
  canvas.getContext('webgpu') as GPUCanvasContext | null;
```

El flujo ahora es:

```text
HTMLCanvasElement
       │
       ▼
GPUCanvasContext
       │
       ▼
GPUDevice
```

---

# 6. Formato del canvas

Consultamos el formato recomendado:

```ts
const format =
  navigator.gpu.getPreferredCanvasFormat();
```

Durante las primeras pruebas en navegador obtuvimos:

```text
bgra8unorm
```

El formato exacto puede depender del navegador y plataforma.

Por eso no debemos hardcodearlo.

---

# 7. Configuración del canvas

Finalmente configuramos el contexto:

```ts
context.configure({
  device,
  format,
  alphaMode: 'premultiplied'
});
```

Con esto el canvas queda listo para recibir comandos de renderizado.

```text
Canvas
   │
GPUCanvasContext
   │
GPUDevice
   │
GPU
```

---

# Implementación Angular actual

La página utiliza Angular Standalone Components.

Los componentes Ionic se importan individualmente:

```ts
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular';
```

No utilizamos actualmente:

```ts
IonicModule
```

ni:

```ts
@ionic/angular/standalone
```

debido a la configuración/versiones utilizadas en este proyecto.

---

# Signals

Para mostrar el estado de WebGPU utilizamos Angular Signals:

```ts
status = signal('Inicializando...');
```

Actualización:

```ts
this.status.set(
  'WebGPU disponible y canvas configurado'
);
```

Template:

```html
<p>{{ status() }}</p>
```

Esto evita depender de comportamiento adicional de detección de cambios después de operaciones asíncronas.

---

# Flujo actual completo

Actualmente el código ejecuta aproximadamente:

```text
ngAfterViewInit()
        │
        ▼
navigator.gpu
        │
        ▼
requestAdapter()
        │
        ▼
GPUAdapter
        │
        ▼
requestDevice()
        │
        ▼
GPUDevice
        │
        ▼
HTML Canvas
        │
        ▼
getContext("webgpu")
        │
        ▼
GPUCanvasContext
        │
        ▼
getPreferredCanvasFormat()
        │
        ▼
context.configure()
```

En este punto:

> WebGPU está inicializado, pero todavía no estamos renderizando geometría.

---

# Próximo paso: Shader WGSL

WebGPU utiliza principalmente:

```text
WGSL
WebGPU Shading Language
```

Los shaders contienen código que será ejecutado por la GPU.

Nuestro primer experimento utilizará:

```text
Vertex Shader
+
Fragment Shader
```

---

## Vertex Shader

El Vertex Shader procesa los vértices que conforman una figura.

Por ejemplo:

```text
       Vertex
         ▲
        / \
       /   \
      /     \
Vertex ----- Vertex
```

Para nuestro primer experimento utilizaremos tres vértices.

---

## Fragment Shader

El Fragment Shader determina principalmente el color de los píxeles generados durante el renderizado.

Flujo:

```text
Vertices
   │
   ▼
Vertex Shader
   │
   ▼
Rasterization
   │
   ▼
Fragment Shader
   │
   ▼
Pixels
```

---

# Render Pipeline

Después de crear los shaders debemos crear un:

```text
RenderPipeline
```

El pipeline define cómo debe realizarse el renderizado.

Conceptualmente:

```text
Shader
  │
  ▼
RenderPipeline
  │
  ▼
RenderPass
  │
  ▼
draw()
  │
  ▼
GPU
```

Ejemplo:

```ts
const pipeline = device.createRenderPipeline({
  layout: 'auto',

  vertex: {
    module: shader,
    entryPoint: 'vertexMain'
  },

  fragment: {
    module: shader,
    entryPoint: 'fragmentMain',
    targets: [{ format }]
  },

  primitive: {
    topology: 'triangle-list'
  }
});
```

Este pipeline no tiene relación con pipelines de CI/CD como GitHub Actions.

En WebGPU significa:

> configuración del proceso gráfico que utilizará la GPU.

---

# Render Pass

Después necesitamos construir comandos para la GPU.

```text
CommandEncoder
      │
      ▼
RenderPass
      │
      ▼
RenderPipeline
      │
      ▼
draw()
```

Ejemplo:

```ts
const encoder = device.createCommandEncoder();
```

Luego:

```ts
const pass = encoder.beginRenderPass(...);
```

Después:

```ts
pass.setPipeline(pipeline);
pass.draw(3);
pass.end();
```

Finalmente enviamos los comandos a la GPU:

```ts
device.queue.submit([
  encoder.finish()
]);
```

---

# Primer objetivo visual

El primer resultado esperado será:

```text
┌─────────────────────┐
│                     │
│          /\         │
│         /  \        │
│        /    \       │
│       /______\      │
│                     │
└─────────────────────┘
```

Un triángulo renderizado completamente mediante WebGPU.

---

# Fase siguiente: Animation Loop

Una vez renderizado el primer triángulo implementaremos:

```ts
requestAnimationFrame()
```

Conceptualmente:

```text
Frame 1
  │
Frame 2
  │
Frame 3
  │
Frame 4
  │
...
```

Esto permitirá probar:

- animación
- FPS
- tiempo por frame
- estabilidad
- comportamiento térmico
- rendimiento

---

# Compute Shader

Una de las partes más interesantes del POC será utilizar WebGPU para realizar cálculos.

WebGPU permite crear:

```text
ComputePipeline
```

en lugar de solamente:

```text
RenderPipeline
```

Un Compute Shader no necesita producir gráficos directamente.

Puede utilizarse para:

```text
matemáticas
simulaciones
partículas
matrices
procesamiento
machine learning
```

---

# Ejemplo futuro: partículas

Podemos crear:

```text
100.000 partículas
```

Cada partícula podría tener:

```text
position
velocity
acceleration
color
```

En CPU sería necesario procesarlas mediante JavaScript.

```text
JavaScript
   │
   ▼
for particle
   │
   ▼
calcular posición
```

Con GPU:

```text
100.000 partículas
        │
        ▼
Compute Shader
        │
        ▼
GPU
        │
        ▼
procesamiento paralelo
```

Posteriormente el mismo buffer podría ser utilizado por el Render Pipeline.

```text
Compute Pipeline
       │
       ▼
GPU Buffer
       │
       ▼
Render Pipeline
       │
       ▼
Canvas
```

---

# Experimentos propuestos

## Experimento 1 — Triangle

Objetivo:

Validar renderizado básico mediante WebGPU.

Mediremos:

- compatibilidad
- ausencia de errores
- render correcto

---

## Experimento 2 — Animated Triangle

Objetivo:

Introducir un render loop.

Mediremos:

- FPS
- estabilidad
- consumo aproximado

---

## Experimento 3 — 10.000 partículas

Objetivo:

Crear una carga gráfica sencilla.

---

## Experimento 4 — 100.000 partículas

Objetivo:

Evaluar escalabilidad.

---

## Experimento 5 — 1.000.000 partículas

Solo se realizará si las pruebas anteriores muestran que tiene sentido.

No se considera un requisito del POC.

---

# CPU vs GPU

Otro experimento será implementar una operación equivalente usando:

```text
JavaScript / CPU
```

y:

```text
WebGPU / GPU
```

Ejemplo:

```text
Actualizar posición de N partículas
```

Compararemos:

| Métrica | CPU | GPU |
|---|---:|---:|
| Tiempo cálculo | TBD | TBD |
| FPS | TBD | TBD |
| 10K partículas | TBD | TBD |
| 100K partículas | TBD | TBD |
| 1M partículas | TBD | TBD |

---

# Benchmark

Las métricas que podríamos recolectar incluyen:

- FPS promedio
- FPS mínimo
- tiempo por frame
- tiempo del Compute Pass
- tiempo total de render
- cantidad de partículas
- estabilidad
- consumo de memoria
- comportamiento por plataforma

Resultado esperado:

```text
Desktop
vs
Android
vs
iPhone
```

---

# Prueba Android

Después de validar el navegador:

```bash
ionic build
npx cap sync android
npx cap open android
```

Probamos en un dispositivo Android real.

Queremos validar:

```text
Ionic
  │
Capacitor
  │
Android WebView
  │
WebGPU
  │
GPU
```

---

# Prueba iOS

Posteriormente:

```bash
ionic build
npx cap sync ios
npx cap open ios
```

Probamos en iPhone real.

Queremos validar:

```text
Ionic
  │
Capacitor
  │
WKWebView
  │
WebGPU
  │
GPU
```

---

# Importante: Browser != WebView

Uno de los puntos importantes del POC es no asumir que:

```text
WebGPU funciona en Chrome
```

significa automáticamente:

```text
WebGPU funciona igual dentro de Android WebView
```

ni que:

```text
WebGPU funciona en Safari
```

significa automáticamente:

```text
WebGPU funciona igual en WKWebView
```

Precisamente queremos validar estas diferencias.

---

# Feature Detection

No deberíamos asumir nunca que WebGPU está disponible.

Siempre debemos comprobar:

```ts
if (!navigator.gpu) {
  // fallback
}
```

A futuro podría existir:

```text
GraphicsRenderer
        │
        ├── WebGpuRenderer
        │
        └── WebGlRenderer
```

---

# Posible arquitectura futura

Actualmente mantenemos el POC intencionalmente sencillo.

Pero si WebGPU demuestra ser viable, podríamos mover la lógica a una arquitectura más desacoplada:

```text
Angular Component
       │
       ▼
Graphics Service
       │
       ▼
GraphicsRenderer
       │
       ├───────────────┐
       ▼               ▼
WebGpuRenderer    WebGlRenderer
       │
       ▼
     WebGPU
```

La UI Angular no debería conocer detalles como:

```text
GPUDevice
GPUBuffer
GPURenderPipeline
GPUComputePipeline
```

---

# Posible estructura futura

```text
src/app/

core/
└── gpu/
    ├── gpu.service.ts
    ├── gpu-device.service.ts
    └── gpu.types.ts

graphics/
├── renderer/
│   ├── graphics-renderer.ts
│   ├── webgpu-renderer.ts
│   └── webgl-renderer.ts
│
├── shaders/
│   ├── triangle.wgsl.ts
│   ├── particles.wgsl.ts
│   └── compute.wgsl.ts
│
└── buffers/
    └── particle-buffer.ts

features/
└── webgpu-poc/
```

No implementaremos esta arquitectura completa hasta necesitarla.

Para un POC preferimos evolucionar gradualmente.

---

# Posible evolución hacia Rust

Si WebGPU demuestra ser útil para escenarios gráficos o de cómputo complejos, una evolución futura podría explorar:

```text
Angular
   │
WebAssembly
   │
Rust
   │
wgpu
   │
GPU
```

Esto permitiría mover operaciones intensivas fuera de TypeScript.

No forma parte del alcance inicial.

---

# Posible uso de Three.js o Babylon.js

Otra posible evolución sería evitar trabajar directamente con WebGPU.

Por ejemplo:

```text
Ionic
  │
Angular
  │
Babylon.js
  │
WebGPU
  │
GPU
```

Esto proporcionaría abstracciones para:

- cámaras
- iluminación
- meshes
- materiales
- texturas
- animaciones
- escenas 3D

Pero durante el POC inicial queremos trabajar directamente con WebGPU para entender su comportamiento.

---

# Qué buscamos aprender

Al finalizar este POC deberíamos poder responder:

## Compatibilidad

- ¿WebGPU funciona dentro de Ionic?
- ¿Funciona correctamente con Capacitor?
- ¿Funciona en Android?
- ¿Funciona en iOS?
- ¿Qué diferencias existen entre plataformas?

## Rendimiento

- ¿Cuántos elementos podemos renderizar?
- ¿Cuándo empieza a ser útil la GPU?
- ¿Cuánto mejora frente a CPU?
- ¿Qué overhead introduce WebGPU?

## Arquitectura

- ¿Cómo debemos aislar la lógica WebGPU?
- ¿Conviene un renderer independiente?
- ¿Necesitamos fallback?
- ¿Qué responsabilidad debería tener Angular?

## Desarrollo

- ¿Qué tan complejo es WGSL?
- ¿Qué tan difícil es depurar WebGPU?
- ¿Qué tan mantenible es?
- ¿Qué tan viable sería utilizarlo en producción?

---

# Qué NO intenta demostrar este proyecto

El objetivo no es demostrar que:

```text
GPU > CPU
```

para todos los problemas.

La GPU es especialmente útil para cargas paralelizables.

Para lógica como:

```text
formularios
HTTP
routing
validaciones
estado
CRUD
```

WebGPU no aporta una ventaja práctica.

---

# Roadmap

## Phase 1 — Initialization

- [x] Ionic
- [x] Angular
- [x] Canvas
- [x] `navigator.gpu`
- [x] `GPUAdapter`
- [x] `GPUDevice`
- [x] `GPUCanvasContext`
- [x] Canvas configuration

---

## Phase 2 — First Render

- [ ] WGSL Vertex Shader
- [ ] WGSL Fragment Shader
- [ ] Render Pipeline
- [ ] Render Pass
- [ ] Triangle

---

## Phase 3 — Animation

- [ ] Render loop
- [ ] `requestAnimationFrame`
- [ ] FPS counter
- [ ] Moving geometry

---

## Phase 4 — GPU Buffers

- [ ] Vertex Buffer
- [ ] Uniform Buffer
- [ ] Storage Buffer
- [ ] Buffer updates

---

## Phase 5 — Compute

- [ ] Compute Shader
- [ ] Compute Pipeline
- [ ] Workgroups
- [ ] Storage Buffers
- [ ] CPU vs GPU experiment

---

## Phase 6 — Particles

- [ ] 1K
- [ ] 10K
- [ ] 100K
- [ ] 1M if viable

---

## Phase 7 — Benchmark

- [ ] FPS
- [ ] Frame time
- [ ] CPU implementation
- [ ] GPU implementation
- [ ] Comparison

---

## Phase 8 — Mobile

- [ ] Android build
- [ ] Android real device
- [ ] iOS build
- [ ] iPhone real device
- [ ] Document differences

---

## Phase 9 — Architecture

- [ ] Extract renderer
- [ ] Graphics abstraction
- [ ] Feature detection
- [ ] WebGL fallback
- [ ] Error handling

---

# POC result matrix

Esta tabla se irá completando durante las pruebas.

| Feature | Web | Android | iOS |
|---|---|---|---|
| `navigator.gpu` | ✅ | TBD | TBD |
| `GPUAdapter` | ✅ | TBD | TBD |
| `GPUDevice` | ✅ | TBD | TBD |
| `GPUCanvasContext` | ✅ | TBD | TBD |
| Triangle | TBD | TBD | TBD |
| Animation | TBD | TBD | TBD |
| Compute Shader | TBD | TBD | TBD |
| 10K particles | TBD | TBD | TBD |
| 100K particles | TBD | TBD | TBD |

---

# Findings

Esta sección documentará comportamientos descubiertos durante el POC.

## Finding 001 — Angular Standalone

El proyecto utiliza Angular Standalone Components.

Los componentes Ionic utilizados actualmente son importados desde:

```ts
@ionic/angular
```

individualmente.

---

## Finding 002 — Canvas Context TypeScript

Dependiendo de los typings disponibles en el proyecto, TypeScript puede inferir:

```ts
canvas.getContext('webgpu')
```

como un tipo demasiado genérico.

Actualmente utilizamos:

```ts
const context =
  canvas.getContext('webgpu') as GPUCanvasContext | null;
```

para trabajar correctamente con:

```ts
context.configure(...)
```

---

## Finding 003 — Angular Signals

Para actualizar el estado después de operaciones asincrónicas utilizamos:

```ts
signal()
```

Ejemplo:

```ts
status = signal('Inicializando...');
```

Esto funciona correctamente con la configuración Angular actual.

---

# Development

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
ionic serve
```

Abrir:

```text
http://localhost:8100
```

---

# Android

```bash
ionic build
npx cap sync android
npx cap open android
```

---

# iOS

```bash
ionic build
npx cap sync ios
npx cap open ios
```

---

# Conclusión esperada

Este repositorio no pretende únicamente comprobar que:

> WebGPU existe dentro de Ionic.

Queremos determinar:

> hasta qué punto WebGPU puede convertirse en una herramienta práctica para construir funcionalidades gráficas o computacionalmente intensivas dentro de aplicaciones híbridas Ionic.

Al finalizar el POC deberíamos contar con evidencia suficiente para decidir entre:

```text
WebGPU funciona y tiene sentido
             │
             ▼
seguir explorando
```

o:

```text
WebGPU funciona,
pero las limitaciones no justifican
su uso para nuestro escenario
```

Ambos resultados son válidos para un POC.

---

# Final Goal

La pregunta final del proyecto es:

> ¿Podemos construir una aplicación Ionic multiplataforma que aproveche directamente la GPU y mantenga una implementación gráfica reutilizable entre Web, Android e iOS?

Este repositorio documentará el proceso necesario para responderla.
