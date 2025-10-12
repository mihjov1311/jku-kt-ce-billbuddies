import { Component, signal } from '@angular/core';
import { NgIf, NgForOf } from '@angular/common';
import { supabase } from './core/services/supabase/supabaseClient';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf, NgForOf], // Nur die Direktiven, die wirklich genutzt werden
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('Supabase:');
  users: any[] = [];

  constructor() {
    this.loadUsers();
  }

  async loadUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Supabase error:', error.message);
    } else {
      this.users = data ?? [];
      console.log('Users:', this.users);
    }
  }
}
