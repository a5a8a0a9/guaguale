import { DecimalPipe } from '@angular/common';
import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	signal,
	viewChild,
} from '@angular/core';

interface Coin {
	name: string;
	icon: string;
	radius: number;
	displaySize: number;
}

interface Prize {
	amount: number;
	weight: number;
	message: string;
}

const PRIZES: Prize[] = [
	{ amount: 0, weight: 35, message: '哈哈！貢龜 XD' },
	{ amount: 100, weight: 20, message: '小確幸～' },
	{ amount: 200, weight: 15, message: '不錯不錯 👍' },
	{ amount: 500, weight: 10, message: '小獎到手！' },
	{ amount: 1000, weight: 8, message: '千元入袋 💰' },
	{ amount: 2000, weight: 5, message: '兩千大洋！讚！' },
	{ amount: 5000, weight: 3, message: '五千塊！太幸運了 🎉' },
	{ amount: 10000, weight: 2, message: '萬元大獎！🔥' },
	{ amount: 50000, weight: 1, message: '五萬！！超級幸運 🍀' },
	{ amount: 200000, weight: 0.5, message: '二十萬！！人生贏家 🏆' },
	{ amount: 1000000, weight: 0.3, message: '百萬大獎！！！🤑🤑🤑' },
	{ amount: 2000000, weight: 0.15, message: '兩百萬！！財富自由 💎' },
	{ amount: 10000000, weight: 0.05, message: '🎆 超級大獎！！！🎆' },
];

const COINS: Coin[] = [
	{ name: '1元', icon: '1', radius: 10, displaySize: 24 },
	{ name: '5元', icon: '5', radius: 14, displaySize: 30 },
	{ name: '10元', icon: '10', radius: 18, displaySize: 36 },
	{ name: '50元', icon: '50', radius: 22, displaySize: 42 },
];

@Component({
	selector: 'yo-scratch-card',
	templateUrl: './scratch-card.html',
	styleUrl: './scratch-card.scss',
	imports: [DecimalPipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScratchCard {
	readonly coins = COINS;
	readonly selectedCoin = signal<Coin>(COINS[1]);
	readonly revealed = signal(false);
	readonly scratchPercent = signal(0);
	readonly prizeAmount = signal(0);
	readonly prizeMessage = signal('');

	// 累積統計
	readonly totalPlays = signal(0);
	readonly totalWinnings = signal(0);

	readonly prizeDisplay = computed(() => `$${this.prizeAmount().toLocaleString()}`);

	private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('scratchCanvas');
	private ctx!: CanvasRenderingContext2D;
	private isScratching = false;
	private canvasW = 0;
	private canvasH = 0;
	private dpr = 1;

	private trackCanvas!: HTMLCanvasElement;
	private trackCtx!: CanvasRenderingContext2D;

	private moveCount = 0;

	constructor() {
		afterNextRender(() => {
			this.initCard();
		});
	}

	selectCoin(coin: Coin): void {
		this.selectedCoin.set(coin);
	}

	reveal(): void {
		if (this.revealed()) return;
		this.revealed.set(true);
		this.totalPlays.update(n => n + 1);
		this.totalWinnings.update(n => n + this.prizeAmount());
	}

	restart(): void {
		this.revealed.set(false);
		this.scratchPercent.set(0);
		this.moveCount = 0;
		this.initCard();
	}

	onPointerDown(e: PointerEvent): void {
		if (this.revealed()) return;
		this.isScratching = true;
		const canvas = this.canvasRef().nativeElement;
		canvas.setPointerCapture(e.pointerId);
		this.scratch(e);
	}

	onPointerMove(e: PointerEvent): void {
		if (!this.isScratching || this.revealed()) return;
		this.scratch(e);
	}

	onPointerUp(): void {
		if (this.isScratching) {
			this.isScratching = false;
			this.updateScratchPercent();
		}
	}

	private initCard(): void {
		const prize = this.randomPrize();
		this.prizeAmount.set(prize.amount);
		this.prizeMessage.set(prize.message);

		const canvas = this.canvasRef().nativeElement;
		const container = canvas.parentElement!;
		this.dpr = window.devicePixelRatio || 1;

		this.canvasW = container.offsetWidth;
		this.canvasH = container.offsetHeight;
		canvas.width = this.canvasW * this.dpr;
		canvas.height = this.canvasH * this.dpr;

		this.ctx = canvas.getContext('2d')!;
		this.ctx.scale(this.dpr, this.dpr);

		this.trackCanvas = document.createElement('canvas');
		this.trackCanvas.width = this.canvasW;
		this.trackCanvas.height = this.canvasH;
		this.trackCtx = this.trackCanvas.getContext('2d', { willReadFrequently: true })!;
		this.trackCtx.fillStyle = '#fff';
		this.trackCtx.fillRect(0, 0, this.canvasW, this.canvasH);

		this.drawScratchLayer();
	}

	private drawScratchLayer(): void {
		const { ctx, canvasW: w, canvasH: h } = this;

		const gradient = ctx.createLinearGradient(0, 0, w, h);
		gradient.addColorStop(0, '#b8b8c8');
		gradient.addColorStop(0.5, '#d0d0d8');
		gradient.addColorStop(1, '#a8a8b8');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);

		ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
		ctx.lineWidth = 1;
		for (let i = -h; i < w + h; i += 8) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i + h, h);
			ctx.stroke();
		}

		ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
		ctx.font = '600 1rem Inter, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('刮開這裡 ▼', w / 2, h / 2);
	}

	private scratch(e: PointerEvent): void {
		const canvas = this.canvasRef().nativeElement;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const r = this.selectedCoin().radius;

		this.ctx.globalCompositeOperation = 'destination-out';
		this.ctx.beginPath();
		this.ctx.arc(x, y, r, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.globalCompositeOperation = 'source-over';

		this.trackCtx.globalCompositeOperation = 'destination-out';
		this.trackCtx.beginPath();
		this.trackCtx.arc(x, y, r, 0, Math.PI * 2);
		this.trackCtx.fill();
		this.trackCtx.globalCompositeOperation = 'source-over';

		this.moveCount++;
		if (this.moveCount % 5 === 0) {
			this.updateScratchPercent();
		}
	}

	private updateScratchPercent(): void {
		const { canvasW: w, canvasH: h } = this;
		const imageData = this.trackCtx.getImageData(0, 0, w, h);
		const pixels = imageData.data;
		let transparent = 0;
		const totalSampled = Math.ceil((w * h) / 4);

		for (let i = 3; i < pixels.length; i += 16) {
			if (pixels[i] === 0) transparent++;
		}

		const percent = (transparent / totalSampled) * 100;
		this.scratchPercent.set(Math.min(Math.round(percent), 100));

		if (percent >= 90) {
			this.reveal();
		}
	}

	private randomPrize(): Prize {
		const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
		let rand = Math.random() * totalWeight;
		for (const prize of PRIZES) {
			rand -= prize.weight;
			if (rand <= 0) return prize;
		}
		return PRIZES[0];
	}
}
