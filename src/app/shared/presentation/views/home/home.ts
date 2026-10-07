import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IamStore } from '@iam/application/iam-store';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  protected readonly iamStore = inject(IamStore);
}
