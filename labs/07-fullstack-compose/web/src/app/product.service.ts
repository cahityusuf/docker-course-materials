import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  // nginx reverse proxy ile /api/* → api:8080/api/*
  private baseUrl = '/api/products';

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  clearCache(): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/cache`);
  }
}
