/** @format */

import { Difficulty } from './Sudoku.js';

export default class BoardGenerator {
	private readonly board: number[][];
	private readonly size: number;
	private readonly subgridSize: number;

	constructor(size: number) {
		if (!Number.isInteger(Math.sqrt(size))) throw new Error('Invalid size');
		this.size = size;
		this.subgridSize = Math.sqrt(size);
		this.board = this.generateBoard();
	}

	private generateBoard(): number[][] {
		const board: number[][] = Array.from(Array(this.size), () =>
			Array(this.size).fill(0),
		);
		this.solve(board, 0, 0);

		return board;
	}

	public solve(board: number[][], row: number, col: number): boolean {
		if (row === this.size) return true;

		let nextRow = row;
		let nextCol = col + 1;

		if (nextCol === this.size) {
			nextRow++;
			nextCol = 0;
		}

		if (board[row][col] !== 0) {
			return this.solve(board, nextRow, nextCol);
		}

		const values = this.shuffle(this.getValidValues(board, row, col));

		for (const element of values) {
			board[row][col] = element;

			if (this.solve(board, nextRow, nextCol)) {
				return true;
			}
		}

		board[row][col] = 0;

		return false;
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

		for (let i = 1; i <= this.size; i++) {
			values.push(i);
		}

		for (let i = 0; i < this.size; i++) {
			const rowValue = board[row][i];
			const colValue = board[i][col];

			if (rowValue !== 0 || colValue !== 0) {
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

	private removeCells(board: number[][], count: number) {
		let removedCount = 0;

		while (removedCount < count) {
			const row = Math.floor(Math.random() * this.size);
			const col = Math.floor(Math.random() * this.size);

			if (board[row][col] !== 0) {
				const value = board[row][col];
				board[row][col] = 0;

				if (this.hasUniqueSolution(board)) {
					removedCount++;
				} else {
					board[row][col] = value;
				}
			}
		}
	}

	//TODO: Implement this, or don't. lol.
	private hasUniqueSolution(board: number[][]): boolean {
		const copy = JSON.parse(JSON.stringify(board));
		return this.solve(copy, 0, 0);
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

	public generatePuzzle(difficulty: Difficulty | number): number[][] {
		const board = this.getBoard();

		switch (difficulty) {
			case Difficulty.Easy:
			case Difficulty.Medium:
			case Difficulty.Hard:
			case Difficulty.Extreme:
			case Difficulty.Impossible:
				this.removeCells(board, this.getBlanks(difficulty));
				break;
			default:
				this.removeCells(board, difficulty);
		}

		return board;
	}
}
