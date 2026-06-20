declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly VITE_API_BASE_URL?: string;
  readonly API_BASE_URL?: string;
  readonly VITE_DATA_SOURCE?: string;
  readonly DATA_SOURCE?: string;
  readonly VITE_CLOUDBASE_ENV?: string;
  readonly CLOUDBASE_ENV?: string;
  readonly VITE_CLOUD_CONTAINER_SERVICE?: string;
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
