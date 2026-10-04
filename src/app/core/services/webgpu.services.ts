import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebGpuService {

  isSupported(): boolean {
    return 'gpu' in navigator;
  }

  async getDevice(): Promise<GPUDevice> {

    if (!navigator.gpu) {
      throw new Error('WebGPU no está disponible');
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      throw new Error('No se encontró un GPUAdapter');
    }

    return adapter.requestDevice();
  }
}
