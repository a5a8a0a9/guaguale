import { Component } from '@angular/core';
import { ScratchCard } from './scratch-card/scratch-card';

@Component({
	selector: 'yo-root',
	imports: [ScratchCard],
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {
	constructor() {
		console.log(
			'%c抓到！好色哦！你竟然想偷看！\nMen! What can i say?\n嚴厲斥責你發瘋啦 這什麼東西啦不可以啊 不要再亂搞了啦',
			'color: white; background-color: #ff6699; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 48px'
		);
	}
}
