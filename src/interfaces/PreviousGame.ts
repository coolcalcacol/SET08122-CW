/** @format */

import { Structure } from './Structure.js';
import { HistoryTree } from '../classes/History.js';
import { Difficulty } from '../enums/Difficulty.js';

/**
 * Defines an interface for the base properties of a previous game.
 */
interface PreviousGameBase {
	// The initial state of the game board.
	initialBoard: number[][];

	// The history of moves made during the game.
	history: Structure<string[]> | HistoryTree<string[]>;

	// The difficulty level of the game.
	difficulty: Difficulty | 'custom';

	// The date the game was created.
	createdAt: Date;

	// The date the game was solved.
	solvedAt: Date;
}

// Defines a type alias for a previous game with a raw (unparsed) history.
type PreviousRawGame = PreviousGameBase & { history: Structure<string[]> };

// Defines a type alias for a previous game with a parsed history.
type PreviousParsedGame = PreviousGameBase & { history: HistoryTree<string[]> };

export { PreviousRawGame, PreviousParsedGame };
