/** @format */

import { HistoryTree } from './History.js';
import BoardGenerator from './BoardGenerator.js';
import { Structure } from '../interfaces/Structure.js';
import { Difficulty } from '../enums/Difficulty.js';

/**
 * The `Board` class represents a Sudoku game board and provides methods to manipulate and query the board state.
 */
export default class Board {
	// Store the current state of the board as a history tree.
	private history: HistoryTree<string[]>;

	// Store the initial board, so we can reset to it, and colour the original numbers a different colour to the user inputted ones.
	public readonly initialBoard: number[][];

	// Store the board generator, so we can generate new puzzles.
	public readonly generator: BoardGenerator;

	// Store the difficulty level of the board.
	public readonly difficulty: Difficulty | 'custom';

	// Store the creation date of the board.
	public readonly createdAt: Date = new Date();

	// Store the solve date of the board (null until the board is solved).
	public solvedAt: Date | null = null;

	/**
	 * Creates a new `Board` instance with the given initial state, board generator, and difficulty level.
	 * @param board The initial state of the board.
	 * @param boardGenerator The board generator to use.
	 * @param difficulty The difficulty level of the board.
	 */
	constructor(
		board: number[][],
		boardGenerator: BoardGenerator,
		difficulty: Difficulty | 'custom',
	) {
		// Initialize the history tree with the initial board state.
		this.history = new HistoryTree<string[]>(
			board.map((row) => row.join(',')),
		);

		// Deep copy the initial board to store it as a separate property.
		this.initialBoard = JSON.parse(JSON.stringify(board));

		// Store the board generator and difficulty level as read-only properties.
		this.generator = boardGenerator;
		this.difficulty = difficulty;
	}

	/**
	 * Returns the current state of the board as a 2D array of numbers.
	 */
	get currentBoard(): number[][] {
		return this.history.current.map((row) =>
			`${row}`.split(',').map((n) => parseInt(n)),
		);
	}

	/**
	 * Returns `true` if the board is solved, `false` otherwise.
	 */
	get solved(): boolean {
		return this.generator.isBoardFilled(this.currentBoard);
	}

	/**
	 * Returns the structure of the board as a tree of `Structure` nodes.
	 */
	get structure(): Structure<string[]> {
		return this.history.structure;
	}

	/**
	 * Adds a new child node to the history tree representing the board state after the given move.
	 * @param i The row index of the cell to update.
	 * @param j The column index of the cell to update.
	 * @param num The new value to set in the cell.
	 */
	public move = (i: number, j: number, num: number): void => {
		const board = this.currentBoard;
		board[i][j] = num;
		this.history.addChild(board.map((row) => row.join(',')));
	};

	/**
	 * Undoes the last move on the board and returns `true` if successful, `false` otherwise.
	 */
	public undo = (): boolean => this.history.undo();

	/**
	 * Redoes the last undone move on the board and returns `true` if successful, `false` otherwise.
	 */
	public redo = (): boolean => this.history.redo();
}
