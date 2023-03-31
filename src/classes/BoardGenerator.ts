/** @format */

import { Difficulty } from './Sudoku.js';

interface BoardTile {
	row: number;
	col: number;
	candidates: number[];
}
export default class BoardGenerator {
	private readonly size: number;
	private readonly subgridSize: number;

	private readonly board: number[][];
	private boardTiles: BoardTile[] = [];
	constructor(size: number) {
		if (!Number.isInteger(Math.sqrt(size))) throw new Error('Invalid size');
		this.size = size;
		this.subgridSize = Math.sqrt(size);
		this.board = Array.from(Array(this.size), () =>
			Array(this.size).fill(0),
		);

		this.boardTiles = this.board
			.map((row, rowIndex) =>
				row.map(
					(col, colIndex) =>
						({
							row: rowIndex,
							col: colIndex,
							candidates: Array.from(
								Array(this.size),
								(_, i) => i + 1,
							),
						} as BoardTile),
				),
			)
			.flat();

		console.log('BoardGenerator is now generating');
		console.time('Main-Solving');
		this.solve();
		console.timeEnd('Main-Solving');
	}

	public solve(): boolean {
		if (this.boardTiles.length === 0) return true;

		const sortedBoardTiles = this.boardTiles.sort(
			(a, b) => b.candidates.length - a.candidates.length,
		);

		const { row, col, candidates } = sortedBoardTiles.shift() as BoardTile;
		const values = this.shuffle(candidates);

		for (const value of values) {
			if (!this.isValid(row, col, value)) continue;

			this.board[row][col] = value;

			if (this.solve()) return true;

			this.board[row][col] = 0;
		}

		this.boardTiles.push({ row, col, candidates });
		return false;
	}

	public isBoardFilled(board: number[][]): boolean {
		return board.every((row) => row.every((cell) => cell !== 0));
	}

	public isValid(row: number, col: number, value: number): boolean {
		for (let i = 0; i < this.board.length; i++) {
			if (this.board[row][i] === value) return false;
			if (this.board[i][col] === value) return false;
		}

		const subgridRow =
			Math.floor(row / this.subgridSize) * this.subgridSize;
		const subgridCol =
			Math.floor(col / this.subgridSize) * this.subgridSize;

		for (let i = subgridRow; i < subgridRow + this.subgridSize; i++) {
			for (let j = subgridCol; j < subgridCol + this.subgridSize; j++) {
				if (this.board[i][j] === value) return false;
			}
		}

		return true;
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

	private shuffle<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	private removeCells(count: number) {
		let removedCount = 0;

		while (removedCount < count) {
			const row = Math.floor(Math.random() * this.size);
			const col = Math.floor(Math.random() * this.size);

			if (this.board[row][col] !== 0) {
				const value = this.board[row][col];
				this.board[row][col] = 0;
				if (this.solve()) {
					removedCount++;
				} else {
					this.board[row][col] = value;
				}
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

		return (
			this.board.length *
			this.board.length *
			(Math.floor(Math.random() * (max[level] - min[level])) + max[level])
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
