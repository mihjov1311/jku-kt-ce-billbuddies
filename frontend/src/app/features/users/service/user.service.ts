import { Injectable } from '@angular/core';
import { supabase } from '../../../core/services/supabase/supabaseClient';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Supabase error:', error.message);
      return [];
    }
    return data;
  }
}
