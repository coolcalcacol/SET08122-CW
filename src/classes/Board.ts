/** @format */
import { Difficulty } from './Sudoku.js';
import { HistoryTree } from './History.js';

// Sudoku Grid

const row: number[] = Array.from({ length: 9 }),
	col: number[] = Array.from({ length: 9 }),
	box: number[] = Array.from({ length: 9 });
const getBox = (i: number, j: number) =>
	Math.floor(i / 3) * 3 + Math.floor(j / 3);
const isSafe = (i: number, j: number, num: number) =>
	!((row[i] >> num) & 1) &&
	!((col[j] >> num) & 1) &&
	!((box[getBox(i, j)] >> num) & 1);

export default class Board {
	// store the current state of the board
	private history: HistoryTree<string[]>;

	// store the initial board, so we can reset to it, and colour the original numbers a different colour to the user inputted ones.
	public readonly initialBoard: number[][];
	constructor(board: number[][]) {
		this.history = new HistoryTree<string[]>(
			board.map((row) => row.join('')),
		);
		this.initialBoard = JSON.parse(JSON.stringify(board));
	}

	get board(): string[][] {
		return this.history.current.map((row) => row.split(''));
	}

	get solved(): boolean {
		return this.board.every((row) =>
			row.every((cell) => parseInt(cell) !== 0),
		);
	}

	move(i: number, j: number, num: string): void {
		const board = this.board;
		board[i][j] = num;
		this.history.addChild(board.map((row) => row.join('')));
	}

	undo(): void {
		this.history.undo();
	}

	redo(): void {
		this.history.redo();
	}

	public static isValid(board: number[][]): boolean {
		for (let i = 0; i < board.length; i++) {
			const row = new Set(),
				col = new Set(),
				box = new Set();
			for (let j = 0; j < board[i].length; j++) {
				const _row = board[i][j];
				const _col = board[j][i];
				const _box = board[getBox(i, j)][3 * (i % 3) + (j % 3)];

				if (_row !== 0) {
					if (row.has(_row)) return false;
					row.add(_row);
				}
				if (_col !== 0) {
					if (col.has(_col)) return false;
					col.add(_col);
				}
				if (_box !== 0) {
					if (box.has(_box)) return false;
					box.add(_box);
				}
			}
		}
		return true;
	}

	private static solveBoard(
		board: number[][],
		i: number,
		j: number,
	): true | false {
		if (i === 8 && j === 9) return true;
		if (j === 9) {
			j = 0;
			i++;
		}

		const usedNumbers: number[] = [];
		let k = 1;
		while (k <= 9) {
			const R = Math.ceil(Math.random() * 9);
			if (!usedNumbers.includes(R)) {
				usedNumbers.push(R);
				if (isSafe(i, j, R)) {
					board[i][j] = R;
					row[i] |= 1 << R;
					col[j] |= 1 << R;
					box[getBox(i, j)] |= 1 << R;

					if (this.solveBoard(board, i, j + 1)) return true;

					// Remove R from each bitmask
					// and search for another possibility
					row[i] &= ~(1 << R);
					col[j] &= ~(1 << R);
					box[getBox(i, j)] &= ~(1 << R);
				}

				k++;
				board[i][j] = 0;
			}
		}

		return false;
	}

	private static makePuzzle(board: number[][], level: Difficulty): void {
		const max = {
			[Difficulty.Easy]: 40,
			[Difficulty.Medium]: 32,
			[Difficulty.Hard]: 28,
		};
		const min = {
			[Difficulty.Easy]: 35,
			[Difficulty.Medium]: 30,
			[Difficulty.Hard]: 23,
		};

		const numberOfSquares =
			Math.floor(Math.random() * (max[level] - min[level])) + max[level];

		let preTotal = board.reduce(
			(p, c) => p + c.filter((v) => v !== 0).length,
			0,
		);

		// remove squares until we have the correct number of squares
		while (preTotal - numberOfSquares > 0) {
			const i = Math.floor(Math.random() * 9);
			const j = Math.floor(Math.random() * 9);

			if (board[i][j] !== 0) {
				board[i][j] = 0;
				preTotal--;
			}
		}
	}
	static generateBoard(level: Difficulty): Board {
		// generate a board with a certain number of unsolved squares
		const board = Array.from(Array(9), () => Array(9).fill(0));

		const rows = new Set(
			Array.from({ length: 3 }, () => Math.ceil(Math.random() * 9)),
		);

		for (const v of rows) {
			const usedNumbers: number[] = [];
			let i = 0;
			while (i < 9) {
				const R = Math.ceil(Math.random() * 9);
				if (!usedNumbers.includes(R)) {
					usedNumbers.push(R);
					board[v - 1][i] = R;
					i++;
				}
			}
		}
		if (this.isValid(board)) {
			Board.solveBoard(board, 0, 0);

			Board.makePuzzle(board, level);
			// fill the rest of the board and return it.
			return new Board(board);
		} else return this.generateBoard(level);
	}
}

// example board

// const board = [
// 	[0, 7, 2, 0, 3, 1, 9, 0, 0],
// 	[8, 0, 0, 0, 0, 9, 0, 5, 7],
// 	[5, 0, 0, 8, 2, 0, 0, 1, 0],
// 	[2, 0, 4, 0, 0, 3, 0, 9, 0],
// 	[3, 9, 6, 2, 1, 0, 0, 4, 5],
// 	[1, 0, 0, 0, 0, 6, 0, 3, 2],
// 	[0, 0, 3, 0, 0, 0, 0, 2, 0],
// 	[4, 0, 5, 9, 6, 0, 0, 0, 8],
// 	[9, 0, 0, 0, 0, 4, 0, 0, 1],
// ];
