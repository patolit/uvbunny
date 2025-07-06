import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'uvbunny';

  constructor(private router: Router) {}

  protected navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
