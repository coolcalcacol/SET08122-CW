/** @format */

import Sudoku from './classes/Sudoku.js';

// only start new game if not a child process
if (process.argv[2] !== 'child') {
	new Sudoku();
}
