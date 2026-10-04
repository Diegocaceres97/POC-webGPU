import {
  AfterViewInit,
  Component,
  ElementRef,
  signal,
  ViewChild
} from '@angular/core';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent
  ],
})
export class HomePage implements AfterViewInit {

  @ViewChild('gpuCanvas')
  canvas!: ElementRef<HTMLCanvasElement>;

  status = signal('Inicializando...');

  async ngAfterViewInit(): Promise<void> {

    // 1. Validamos que WebGPU exista
    if (!navigator.gpu) {
      this.status.set('❌ WebGPU no soportado');
      return;
    }

    // 2. Solicitamos acceso al adaptador de GPU
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      this.status.set('❌ No se pudo obtener GPUAdapter');
      return;
    }

    // 3. Creamos el dispositivo lógico de WebGPU
    const device = await adapter.requestDevice();

    console.log('GPUAdapter:', adapter);
    console.log('GPUDevice:', device);

    // 4. Obtenemos el canvas del HTML
    const canvas = this.canvas.nativeElement;

    // 5. Obtenemos el contexto WebGPU del canvas
    const context =
      canvas.getContext('webgpu') as GPUCanvasContext | null;

    if (!context) {
      this.status.set(
        '❌ No se pudo obtener WebGPU context'
      );
      return;
    }

    // 6. Le preguntamos al navegador
    // cuál es el formato de textura recomendado
    const format =
      navigator.gpu.getPreferredCanvasFormat();

    console.log('Canvas format:', format);

    // 7. Conectamos el canvas con nuestro GPUDevice
    context.configure({
      device,
      format,
      alphaMode: 'premultiplied'
    });

    const shader = device.createShaderModule({
  code: `
    @vertex
    fn vertexMain(
      @builtin(vertex_index) index: u32
    ) -> @builtin(position) vec4f {

      var positions = array<vec2f, 3>(
        vec2f(0.0, 0.8),
        vec2f(-0.8, -0.8),
        vec2f(0.8, -0.8)
      );

      let pos = positions[index];

      return vec4f(
        pos,
        0.0,
        1.0
      );
    }

    @fragment
    fn fragmentMain()
      -> @location(0) vec4f {

      return vec4f(
        0.1,
        0.8,
        0.5,
        1.0
      );
    }
  `
});

const pipeline = device.createRenderPipeline({
  layout: 'auto',

  vertex: {
    module: shader,
    entryPoint: 'vertexMain'
  },

  fragment: {
    module: shader,
    entryPoint: 'fragmentMain',
    targets: [
      {
        format
      }
    ]
  },

  primitive: {
    topology: 'triangle-list'
  }
});

const encoder = device.createCommandEncoder();

const textureView =
  context
    .getCurrentTexture()
    .createView();

const pass = encoder.beginRenderPass({
  colorAttachments: [
    {
      view: textureView,
      clearValue: {
        r: 0.05,
        g: 0.05,
        b: 0.05,
        a: 1
      },
      loadOp: 'clear',
      storeOp: 'store'
    }
  ]
});

pass.setPipeline(pipeline);

pass.draw(3);

pass.end();

device.queue.submit([
  encoder.finish()
]);

    // 8. Todo listo
    this.status.set(
      '✅ WebGPU disponible y canvas configurado'
    );
  }
}
