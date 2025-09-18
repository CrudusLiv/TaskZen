import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-coach-page',
  imports: [CommonModule],
  templateUrl: './coach.page.html',
  styleUrls: ['./coach.page.scss'],
})
export class CoachPage {
  demoCards = [
    {
      category: 'Focus',
      title: 'Micro-start wins',
      body: 'Pick the smallest step inside your current top item. 90 seconds only.',
      suggestion: 'Open the item detail and create a 2-step micro list.',
      time: 'just now',
    },
    {
      category: 'Energy',
      title: 'Energy checkpoint',
      body: 'Logging your energy every ~90 minutes improves self-calibration.',
      suggestion: 'Log a quick energy + mood snapshot.',
      time: '5m',
    },
    {
      category: 'Mindset',
      title: 'Kind framing',
      body: 'Rephrase “I have to finish” into “I will explore for 5 focused minutes.”',
      suggestion: 'Say it out loud to reinforce the shift.',
      time: '12m',
    },
    {
      category: 'Routines',
      title: 'Routine anchoring',
      body: 'Stack a new habit onto a stable routine step for better recall.',
      suggestion: 'Pick one existing routine and note a micro add-on.',
      time: '30m',
    },
  ];
}
