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
		this.fillDiagonal();
		if (this.size > 16) return this.solveLarge();
		return BoardGenerator.solve(this.board);
	}

	private fillDiagonal(): void {
		for (let i = 0; i < this.size; i += this.subgridSize) {
			const values = Array.from({ length: this.size }, (_, i) => i + 1);
			BoardGenerator.shuffle(values);
			for (let j = 0; j < this.subgridSize; j++) {
				for (let k = 0; k < this.subgridSize; k++) {
					this.board[i + j][i + k] = values[j * this.subgridSize + k];
				}
			}
		}
	}
	private solveLarge(): Promise<boolean> {
		const childPool: ChildProcess[] = [];
		const numProcesses = cpus().length / 2;

		for (let i = 0; i < numProcesses; i++)
			childPool.push(fork(join(__dirname, 'BoardGenerator.js')));

		const killChildren = () => {
			for (const child of childPool) child.kill();
		};

		return new Promise<boolean>((resolve, reject) => {
			for (const child of childPool) {
				child.send({
					solve: BoardGenerator.solve,
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

	private static shuffle<T>(array: T[]): void {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	private static isValid(
		board: number[][],
		row: number,
		col: number,
		value: number,
	): boolean {
		const subgridSize = Math.sqrt(board.length);
		for (let i = 0; i < board.length; i++) {
			if (board[row][i] === value) return false;
			if (board[i][col] === value) return false;
		}

		const subgridRow = row - (row % subgridSize);
		const subgridCol = col - (col % subgridSize);

		for (let i = subgridRow; i < subgridRow + subgridSize; i++) {
			for (let j = subgridCol; j < subgridCol + subgridSize; j++) {
				if (board[i][j] === value) return false;
			}
		}

		return true;
	}

	private static getValidValues(
		board: number[][],
		row: number,
		col: number,
	): number[] {
		const values: number[] = Array.from(
			{ length: board.length },
			(_, i) => i + 1,
		);

		for (const value of values) {
			if (!BoardGenerator.isValid(board, row, col, value)) {
				values.splice(values.indexOf(value), 1);
			}
		}

		return values;
	}

	private static findNextEmpty(board: number[][]): {
		row: number;
		col: number;
	} {
		for (let row = 0; row < board.length; row++) {
			for (let col = 0; col < board.length; col++) {
				if (board[row][col] === 0) return { row, col };
			}
		}
		return { row: -1, col: -1 };
	}

	public static solve(board: number[][]): boolean {
		if (board.every((row) => row.every((v) => v !== 0))) return true;

		const { row, col } = BoardGenerator.findNextEmpty(board);
		if (row === -1 && col === -1) return false;

		const candidates = BoardGenerator.getValidValues(board, row, col);
		BoardGenerator.shuffle(candidates);

		for (const value of candidates) {
			if (!BoardGenerator.isValid(board, row, col, value)) continue;

			board[row][col] = value;

			if (BoardGenerator.solve(board)) return true;
			board[row][col] = 0;
		}

		return false;
	}
}

process.on('message', ({ board }: { board: number[][] }) => {
	const solvedBoard = BoardGenerator.solve(board);
	if (solvedBoard) process.send?.(board);
});
