/** @format */

import { HistoryTree } from './History.js';
import { Structure } from '../interfaces/Structure.js';
import BoardGenerator from './BoardGenerator.js';
import { Difficulty } from './Sudoku.js';

export default class Board {
	// store the current state of the board
	private history: HistoryTree<string[]>;

	// store the initial board, so we can reset to it, and colour the original numbers a different colour to the user inputted ones.
	public readonly initialBoard: number[][];

	// store the board generator, so we can generate new puzzles
	public readonly generator: BoardGenerator;

	public readonly difficulty: Difficulty | 'custom';
	public readonly createdAt: Date = new Date();
	public solvedAt: Date | null = null;

	constructor(
		board: number[][],
		boardGenerator: BoardGenerator,
		difficulty: Difficulty | 'custom',
	) {
		this.history = new HistoryTree<string[]>(
			board.map((row) => row.join('')),
		);
		this.initialBoard = JSON.parse(JSON.stringify(board));
		this.generator = boardGenerator;
		this.difficulty = difficulty;
	}

	get currentBoard(): number[][] {
		return this.history.current.map((row) =>
			`${row}`.split('').map((n) => parseInt(n)),
		);
	}

	get solved(): boolean {
		return this.generator.isBoardFilled(this.currentBoard);
	}

	get structure(): Structure<string[]> {
		return this.history.structure;
	}

	public move = (i: number, j: number, num: number): void => {
		const board = this.currentBoard;
		board[i][j] = num;
		this.history.addChild(board.map((row) => row.join('')));
	};

	public undo = (): boolean => this.history.undo();
	public redo = (): boolean => this.history.redo();
}
