/** @format */

import { fork, ChildProcess } from 'child_process';
import { cpus } from 'os';
import { Difficulty, MaxValues, MinValues } from '../enums/Difficulty.js';

/**
 * A class that generates a new Sudoku board.
 */
export default class BoardGenerator {
	// store the size of the board
	private readonly size: number;
	// store the size of each subgrid. will be the square root of the board size.
	private readonly subgridSize: number;

	// store the board as a 2D array of numbers
	private _board: number[][];

	/**
	 * Creates a new `BoardGenerator` instance with the given size.
	 * @param size The size of the board to generate.
	 */
	constructor(size: number) {
		// validate the size. must be a perfect square.
		if (!Number.isInteger(Math.sqrt(size))) throw new Error('Invalid size');

		// store the size and subgrid size as read-only properties.
		this.size = size;
		this.subgridSize = Math.sqrt(size);

		// initialize the board as a 2D array of zeros.
		this._board = Array.from(Array(this.size), () =>
			Array(this.size).fill(0),
		);
	}

	/**
	 * Generates a new Sudoku board.
	 */
	public async generate() {
		// fill the diagonal subgrids
		this.fillDiagonal();

		// solve the board. if the board is over 16x16, spawn child processes to make the generation exponentially faster.
		if (this.size > 16) return this.solveLarge();
		return BoardGenerator.solve(this._board);
	}

	/**
	 * Fill all the diagonal subgrids with random numbers.
	 * @private
	 */
	private fillDiagonal(): void {
		// loop through each diagonal subgrid
		for (let i = 0; i < this.size; i += this.subgridSize) {
			// generate a random permutation of the numbers 1 to the size of the board
			const values = Array.from({ length: this.size }, (_, i) => i + 1);

			// shuffle the generated values
			BoardGenerator.shuffle(values);

			// fill the subgrid with the shuffled values
			for (let j = 0; j < this.subgridSize; j++) {
				for (let k = 0; k < this.subgridSize; k++) {
					this._board[i + j][i + k] =
						values[j * this.subgridSize + k];
				}
			}
		}
	}

	/**
	 * Helper method to spawn child processes to solve the board.
	 * @private
	 */
	private solveLarge(): Promise<boolean> {
		// get the number of CPU cores
		const numProcesses = cpus().length;

		// spawn a child process for each core
		const childPool: ChildProcess[] = Array.from({
			length: numProcesses,
		}).map(() => fork(__filename, ['child']));

		// private method to kill all child processes
		const killChildren = () => {
			for (const child of childPool) child.kill();
		};

		// return a promise that resolves when the board is solved by one of the child processes
		return new Promise<boolean>((resolve, reject) => {
			for (const child of childPool) {
				// send the board to the child process, as well as the function to solve the board.
				child.send({ board: this._board });

				// listen for the child process to send a message back. if the board is solved, kill all child processes and resolve the promise.
				child.on('message', (board: number[][]) => {
					this._board = board;
					killChildren();
					resolve(true);
				});

				// listen for the child process to send an error. if an error occurs, kill all child processes and reject the promise.
				child.on('error', (err) => {
					console.error(err);
					killChildren();
					reject(err);
				});
			}
		});
	}

	/**
	 * Checks if the given board is valid.
	 * Does this by validating that each cell contains a valid value.
	 * @param board The board to validate.
	 */
	public isBoardFilled(board: number[][]): boolean {
		return board.every((row) => row.every((cell) => cell !== 0));
	}

	/**
	 * Remove cells from the board.
	 * @param count The number of cells to remove.
	 * @private
	 */
	private removeCells(count: number) {
		// loop until the correct number of cells have been removed
		let removedCount = 0;
		while (removedCount < count) {
			// get a random row and column
			const row = Math.floor(Math.random() * this.size);
			const col = Math.floor(Math.random() * this.size);

			// if the cell is not already 0, set it to 0 and increment the removed count
			if (this._board[row][col] !== 0) {
				this._board[row][col] = 0;
				removedCount++;
			}
		}
	}

	/**
	 * Get the number of blanks to remove from the board based on the difficulty level and the size of the board.
	 * @param level The difficulty level.
	 * @private
	 */
	private getBlanks(level: Difficulty) {
		// get a number between the min and max values for the given difficulty level
		return Math.floor(
			this._board.length *
				this._board.length *
				(Math.random() * (MaxValues[level] - MinValues[level]) +
					MaxValues[level]),
		);
	}

	/**
	 * Getter for the board
	 */
	get board(): number[][] {
		return this._board;
	}

	/**
	 * Generate a new puzzle by punching numbers from the solved board.
	 * @param difficulty The difficulty level of the puzzle.
	 */
	public generatePuzzle(difficulty: Difficulty): number[][] {
		// remove cells from the board based on the difficulty level
		this.removeCells(this.getBlanks(difficulty));

		// return the puzzle board.
		return this._board;
	}

	/**
	 * Generate a new puzzle by punching numbers from the solved board.
	 * @param count The number of cells to remove.
	 */
	public generateCustomPuzzle(count: number): number[][] {
		// remove cells from the board based on the number the user entered
		this.removeCells(count);

		// return the puzzle board.
		return this._board;
	}

	/**
	 * Helper method to shuffle an array
	 * @param array The array to shuffle.
	 * @private
	 */
	private static shuffle<T>(array: T[]): void {
		// loop through the array backwards and swap each element with a random element
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	/**
	 * Check if the given value is valid on the given board at the specified position.
	 * @param board The board to check.
	 * @param row The row of the cell.
	 * @param col The column of the cell.
	 * @param value The value to check.
	 * @private
	 */
	private static isValid(
		board: number[][],
		row: number,
		col: number,
		value: number,
	): boolean {
		// check the row and column for the value
		const subgridSize = Math.sqrt(board.length);
		for (let i = 0; i < board.length; i++) {
			if (board[row][i] === value) return false;
			if (board[i][col] === value) return false;
		}

		// check the subgrid for the value
		const subgridRow = row - (row % subgridSize);
		const subgridCol = col - (col % subgridSize);

		for (let i = subgridRow; i < subgridRow + subgridSize; i++) {
			for (let j = subgridCol; j < subgridCol + subgridSize; j++) {
				if (board[i][j] === value) return false;
			}
		}

		// return true if the value is valid
		return true;
	}

	/**
	 * Return the valid values for the given cell.
	 * @param board The board to check.
	 * @param row The row of the cell.
	 * @param col The column of the cell.
	 */
	public static getValidValues(
		board: number[][],
		row: number,
		col: number,
	): number[] {
		// get all possible values for the cell
		const values: number[] = Array.from(
			{ length: board.length },
			(_, i) => i + 1,
		);

		// remove any values that are not valid, by calling the isValid method for each value.
		for (const value of values) {
			if (!BoardGenerator.isValid(board, row, col, value)) {
				values.splice(values.indexOf(value), 1);
			}
		}

		// return the valid values
		return values;
	}

	/**
	 * Find the next empty cell on the board.
	 * @param board The board to check.
	 * @private
	 */
	private static findNextEmpty(board: number[][]): {
		row: number;
		col: number;
	} {
		// loop through the board and return the first empty cell
		for (let row = 0; row < board.length; row++) {
			for (let col = 0; col < board.length; col++) {
				if (board[row][col] === 0) return { row, col };
			}
		}

		// return -1, -1 if no empty cells are found
		return { row: -1, col: -1 };
	}

	/**
	 * Solve the given board.
	 * @param board The board to solve.
	 */
	public static solve(board: number[][]): boolean {
		// check if the board is full. If it is, the board is solved
		if (board.every((row) => row.every((v) => v !== 0))) return true;

		// find the next empty cell
		const { row, col } = BoardGenerator.findNextEmpty(board);

		// if no empty cells are found, return false. This should never happen, but we backtrack if it does.
		if (row === -1 && col === -1) return false;

		// get and shuffle the valid values for the current cell
		const candidates = BoardGenerator.getValidValues(board, row, col);
		BoardGenerator.shuffle(candidates);

		// loop through the valid values and try to solve the board with each value
		for (const value of candidates) {
			if (!BoardGenerator.isValid(board, row, col, value)) continue;

			// temporarily set the value on the board and try to solve the board
			board[row][col] = value;

			// if the board is solved, break from the loop
			if (BoardGenerator.solve(board)) return true;

			// if the board is not solved, reset the value on the board and try the next value
			board[row][col] = 0;
		}

		// if no values are valid, backtrack
		return false;
	}
}

/**
 * This is what controls the child processes as they are spawned, since the final compiled code is a single file.
 */
process.on('message', ({ board }: { board: number[][] }) => {
	// try to solve the board
	const solvedBoard = BoardGenerator.solve(board);

	// send the solved board back to the parent process
	if (solvedBoard) process.send?.(board);
});
