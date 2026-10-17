import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { apiEndpoint } from './api-endpoint';

export interface SiteContent {
  contentId: number;
  mainText: string;
  updateDate: string;
  contentTypeId: number;
  contentTypeName: string;
}

@Injectable({ providedIn: 'root' })
export class ContentService {
  constructor(private readonly http: HttpClient) {}

  fetchAll(): Promise<SiteContent[]> {
    return firstValueFrom(this.http.get<SiteContent[]>(apiEndpoint('/api/content'), {
      params: { _: Date.now() },
    }));
  }

  byTypeName(contents: SiteContent[], typeName: string): SiteContent | undefined {
    const normalized = typeName.trim().toLocaleLowerCase();
    return contents.find(content => content.contentTypeName.trim().toLocaleLowerCase() === normalized);
  }
}
