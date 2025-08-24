import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaceSection } from "../../sections/place-section/place-section"
import { SupportSection } from '../../sections/support-section/support-section';
import { AboutSection } from '../../sections/about-section/about-section';
import { ProvidersSection } from '../../sections/providers-section/providers-section';
import { TestimonialsSection } from '../../sections/testimonials-section/testimonials-section';
import { ExpertsSection } from '../../sections/experts-section/experts-section';
import { BlogSection } from '../../sections/blog-section/blog-section';
import { HeroSection } from '../../sections/hero-section/hero-section';
import { FeaturedCategories } from '../../sections/featured-categories/featured-categories';
import { HowWork } from '../../sections/how-work/how-work';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
     FeaturedCategories,
        HowWork,
        PlaceSection,
        SupportSection,
        AboutSection,
        ProvidersSection,
        TestimonialsSection,
        ExpertsSection,
        BlogSection,
        HeroSection,
  ]
  ,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
