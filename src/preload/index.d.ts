import { dockerApi } from './index';

declare global {
  interface Window {
    dockerApi: typeof dockerApi;
  }
}
