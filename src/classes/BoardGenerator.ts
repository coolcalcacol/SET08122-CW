/** @format */

import { fork, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cpus } from 'os';

import { Difficulty } from './Sudoku.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class BoardGenerator {
	private readonly size: number;
	private readonly subgridSize: number;

	private board: number[][];
	constructor(size: number) {
		if (!Number.isInteger(Math.sqrt(size))) throw new Error('Invalid size');
		this.size = size;
		this.subgridSize = Math.sqrt(size);
		this.board = Array.from(Array(this.size), () =>
			Array(this.size).fill(0),
		);
	}

	public async generate() {
		return this.solve();
	}

	private solve(): Promise<boolean> {
		const childPool: ChildProcess[] = [];
		const numProcesses = cpus().length / 2;

		for (let i = 0; i < numProcesses; i++)
			childPool.push(fork(join(__dirname, '..', 'utils', 'solve.js')));

		const killChildren = () => {
			for (const child of childPool) child.kill();
		};

		return new Promise<boolean>((resolve, reject) => {
			for (const child of childPool) {
				child.send({
					board: this.board,
				});
				child.on('message', (board: number[][]) => {
					this.board = board;
					killChildren();
					resolve(true);
				});
				child.on('error', (err) => {
					console.error(err);
					killChildren();
					reject(err);
				});
			}
		});
	}

	public isBoardFilled(board: number[][]): boolean {
		return board.every((row) => row.every((cell) => cell !== 0));
	}

	public getValidValues(
		board: number[][],
		row: number,
		col: number,
	): number[] {
		const values: number[] = [];

		for (let i = 1; i <= this.size; i++) values.push(i);

		for (let i = 0; i < this.size; i++) {
			const rowValue = board[row][i];
			const colValue = board[i][col];

			if (rowValue !== 0) {
				const rowIndex = values.indexOf(rowValue);
				if (rowIndex !== -1) values.splice(rowIndex, 1);
			}
			if (colValue !== 0) {
				const colIndex = values.indexOf(colValue);
				if (colIndex !== -1) values.splice(colIndex, 1);
			}
		}

		const subgridRow =
			Math.floor(row / this.subgridSize) * this.subgridSize;
		const subgridCol =
			Math.floor(col / this.subgridSize) * this.subgridSize;

		for (let i = subgridRow; i < subgridRow + this.subgridSize; i++) {
			for (let j = subgridCol; j < subgridCol + this.subgridSize; j++) {
				const value = board[i][j];

				if (value !== 0) {
					const index = values.indexOf(value);

					if (index !== -1) values.splice(index, 1);
				}
			}
		}

		return values;
	}

	private removeCells(count: number) {
		let removedCount = 0;
		while (removedCount < count) {
			const row = Math.floor(Math.random() * this.size);
			const col = Math.floor(Math.random() * this.size);

			if (this.board[row][col] !== 0) {
				this.board[row][col] = 0;
				removedCount++;
			}
		}
	}

	private getBlanks(level: Difficulty) {
		//
		const max = {
			[Difficulty.Easy]: 0.45,
			[Difficulty.Medium]: 0.55,
			[Difficulty.Hard]: 0.65,
			[Difficulty.Extreme]: 0.75,
			[Difficulty.Impossible]: 0.85,
		};
		const min = {
			[Difficulty.Easy]: 0.4,
			[Difficulty.Medium]: 0.5,
			[Difficulty.Hard]: 0.6,
			[Difficulty.Extreme]: 0.7,
			[Difficulty.Impossible]: 0.8,
		};

		return Math.floor(
			this.board.length *
				this.board.length *
				(Math.random() * (max[level] - min[level]) + max[level]),
		);
	}

	public getBoard(): number[][] {
		return this.board;
	}

	public generatePuzzle(difficulty: Difficulty): number[][] {
		switch (difficulty) {
			case Difficulty.Easy:
			case Difficulty.Medium:
			case Difficulty.Hard:
			case Difficulty.Extreme:
			case Difficulty.Impossible:
				this.removeCells(this.getBlanks(difficulty));
				break;
		}

		return this.board;
	}

	public generateCustomPuzzle(count: number): number[][] {
		this.removeCells(count);
		return this.board;
	}
}
