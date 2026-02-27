import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { MOCK_TESTIMONIALS } from '../data/mock-testimonials';
import { Testimonial } from '../models/testimonial';

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  private readonly testimonials = MOCK_TESTIMONIALS;

  // private readonly baseUrl = '/api/testimonials';

  getTestimonials(): Observable<Testimonial[]> {
    return of(this.testimonials);
  }
}
