import { Component } from '@angular/core';
import { ScratchCard } from './scratch-card/scratch-card';

@Component({
	selector: 'yo-root',
	imports: [ScratchCard],
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {}
