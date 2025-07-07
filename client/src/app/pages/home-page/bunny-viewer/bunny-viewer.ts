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
  @Output() addBunny = new EventEmitter<void>();

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
}
