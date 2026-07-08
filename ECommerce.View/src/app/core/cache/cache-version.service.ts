import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheVersionService {
  compare(serverVersion: string | null, cachedVersion: string | null): boolean {
    if (!serverVersion) return true;
    if (!cachedVersion) return true;
    return serverVersion !== cachedVersion;
  }

  compareEtag(serverEtag: string | null, cachedEtag: string | null): boolean {
    if (!serverEtag) return true;
    if (!cachedEtag) return true;
    return serverEtag !== cachedEtag;
  }
}
