import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bunny } from '../../../services/firebase';
import { BunnyChart } from '../bunny-chart/bunny-chart';
import { BunnyTable } from '../bunny-table/bunny-table';
import { BunnyPen } from '../bunny-pen/bunny-pen';

type ViewMode = 'chart' | 'table' | 'pen';

@Component({
  selector: 'app-bunny-viewer',
  imports: [CommonModule, BunnyChart, BunnyTable, BunnyPen],
  templateUrl: './bunny-viewer.html',
  styleUrl: './bunny-viewer.scss'
})
export class BunnyViewer implements OnInit {
  @Input() bunnies: Bunny[] | null = [];
  @Input() initialView: ViewMode = 'chart';
  @Input() isLoading: boolean = false;
  @Input() hasMore: boolean = true;
  @Input() loadedCount: number = 0;
  @Input() totalBunnies: number = 0;
  @Output() addBunny = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();

  currentView: ViewMode = 'chart';

  ngOnInit(): void {
    this.currentView = this.initialView;
  }

  setView(view: ViewMode): void {
    this.currentView = view;
  }

  onAddBunny(): void {
    this.addBunny.emit();
  }

  onLoadMore(): void {
    this.loadMore.emit();
  }
}
