import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from './product.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <header>
        <div>
          <h1>Ürün Listesi</h1>
          <p class="sub">Docker fullstack lab — Angular + .NET 8 + PostgreSQL + Redis</p>
        </div>
        <div class="actions">
          <button class="btn primary" (click)="reload()" [disabled]="loading()">
            {{ loading() ? 'Yükleniyor…' : 'Yenile' }}
          </button>
          <button class="btn secondary" (click)="clearCache()">
            Cache Temizle
          </button>
        </div>
      </header>

      @if (cacheStatus()) {
        <div class="badge" [class.hit]="cacheStatus() === 'HIT'" [class.miss]="cacheStatus() === 'MISS'">
          Redis Cache: <strong>{{ cacheStatus() }}</strong>
          @if (cacheStatus() === 'HIT') { <span> — Veri Redis'ten geldi (mikrosaniye)</span> }
          @else { <span> — Veri PostgreSQL'den çekildi, Redis'e yazıldı</span> }
        </div>
      }

      @if (error()) {
        <div class="alert error">
          <strong>Hata:</strong> {{ error() }}
        </div>
      }

      @if (products().length > 0) {
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ürün</th>
              <th>Kategori</th>
              <th class="num">Fiyat (TL)</th>
              <th>Eklenme</th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td>{{ p.id }}</td>
                <td><strong>{{ p.name }}</strong></td>
                <td><span class="tag">{{ p.category }}</span></td>
                <td class="num">{{ p.price | number:'1.2-2' }}</td>
                <td class="muted">{{ p.createdAt | date:'short':'':'tr' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <p class="count">Toplam <strong>{{ products().length }}</strong> ürün</p>
      } @else if (!loading() && !error()) {
        <p class="muted">Hiç ürün yok.</p>
      }

      <footer>
        <small>
          Mimari: tarayıcı → nginx (web container) → /api/* reverse proxy → .NET API → PostgreSQL + Redis
        </small>
      </footer>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(15, 44, 88, 0.08);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    h1 { color: #0f2c58; margin: 0 0 .25rem; font-size: 1.75rem; }
    .sub { color: #5c6b82; margin: 0; font-size: .9rem; }
    .actions { display: flex; gap: .5rem; }
    .btn {
      border: 0; padding: .65rem 1.2rem; border-radius: 6px;
      cursor: pointer; font-weight: 600; font-size: .9rem;
      transition: all .15s;
    }
    .btn.primary { background: #0db7ed; color: white; }
    .btn.primary:hover:not(:disabled) { background: #0a9ec9; }
    .btn.primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn.secondary { background: #e5ebf5; color: #0f2c58; }
    .btn.secondary:hover { background: #d5dde9; }

    .badge {
      padding: .5rem 1rem; border-radius: 6px; margin-bottom: 1rem;
      font-size: .85rem;
    }
    .badge.hit { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
    .badge.miss { background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b; }

    .alert.error {
      background: #fbe4e4; color: #8b0000; padding: 1rem;
      border-radius: 6px; margin-bottom: 1rem; border-left: 4px solid #c00000;
    }

    table {
      width: 100%; border-collapse: collapse; margin-top: .5rem;
      border: 1px solid #e5ebf5; border-radius: 6px; overflow: hidden;
    }
    th, td { padding: .75rem 1rem; text-align: left; }
    th { background: #0f2c58; color: white; font-weight: 600; font-size: .85rem; text-transform: uppercase; }
    tbody tr { border-top: 1px solid #e5ebf5; }
    tbody tr:hover { background: #f4f7fb; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: #5c6b82; font-size: .85rem; }
    .tag {
      display: inline-block; padding: .15rem .6rem;
      background: #e5ebf5; color: #0f2c58; border-radius: 12px;
      font-size: .8rem;
    }
    .count { margin-top: 1rem; color: #5c6b82; font-size: .9rem; }

    footer {
      margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5ebf5;
      color: #5c6b82; text-align: center;
    }
  `]
})
export class AppComponent implements OnInit {
  private svc = inject(ProductService);

  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  cacheStatus = signal<string | null>(null);

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    this.cacheStatus.set(null);

    // X-Cache header'ını okumak için observe: 'response'
    this.svc.list().subscribe({
      next: data => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.message ?? err.statusText ?? 'Bilinmeyen hata');
        this.loading.set(false);
      }
    });

    // Cache durumunu ayrı bir fetch ile öğren (basit yaklaşım)
    fetch('/api/products')
      .then(r => this.cacheStatus.set(r.headers.get('X-Cache')))
      .catch(() => {});
  }

  clearCache() {
    this.svc.clearCache().subscribe({
      next: () => this.reload()
    });
  }
}
