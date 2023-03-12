/** @format */

import chalk from 'chalk';
import {
	clearLine,
	clearScreenDown,
	createInterface,
	moveCursor,
	Interface,
} from 'readline';
import Board from './Board.js';

const {
	black: black,
	blackBright: gray,
	green,
	dim,
	blue,
	blueBright,
	red,
	yellow,
} = chalk;

export enum Difficulty {
	Easy,
	Medium,
	Hard,
}
export default class {
	private board?: Board;
	private difficulty?: Difficulty;
	constructor() {
		this.displayStart();
		this.startGame();
	}

	private displayStart() {
		console.log(black('───────────────────────────────────────'));
		console.log(green(' Welcome to Sudoku!'));
		console.log(black('───────────────────────────────────────'));
		console.log(dim('INSTRUCTIONS:\n'));
		console.log(
			dim(
				'To place a number, first type the row number, then the column letter, then the number you want to place.',
			),
		);
		console.log(
			dim('For example, to place a 5 in the top left corner, type "') +
				blueBright('1A 5') +
				dim('".'),
		);
		// output instructions here
		console.log(black('───────────────────────────────────────'));
	}

	private startGame() {
		if (this.board === undefined) this.promptDifficulty();
		else if (!this.board.solved) {
			this.promptMove(this.board);
		} else {
			this.displayTable(this.board);
			console.log(dim(green('Congratulations! You won!')));
			console.log(black('───────────────────────────────────────'));
			// game over. Display completed table
		}
	}

	private promptDifficulty(): void {
		const rl = createInterface(process.stdin, process.stdout);

		console.log(dim('Choose a difficulty:'));
		console.log(`${green('easy')}, ${yellow('normal')}, ${red('hard')}`);

		rl.setPrompt(dim('> '));
		rl.prompt();

		rl.on('line', (line) => {
			switch (line.trim()) {
				case 'easy':
					this.difficulty = Difficulty.Easy;
					break;
				case 'medium':
					this.difficulty = Difficulty.Medium;
					break;
				case 'hard':
					this.difficulty = Difficulty.Hard;
					break;
				default:
					this.difficulty = Difficulty.Medium;
					break;
			}
			moveCursor(process.stdout, -3, -1);
			clearLine(process.stdout, 0);
			console.log(dim(`Generating "${line}" board...\n`));
			this.board = Board.generateBoard(this.difficulty);
			rl.close();
		})
			.on('close', () => {
				return this.startGame();
			})
			.on('SIGINT', () => {
				rl.pause();
			});
	}
	private displayTable(board: Board) {
		const topRow = black('┌───┬───┬───┬───┬───┬───┬───┬───┬───┐'),
			middleRowMinor =
				black('├') +
				gray('───┼───┼───') +
				black('┼') +
				gray('───┼───┼───') +
				black('┼') +
				gray('───┼───┼───') +
				black('┤'),
			middleRowMajor = black('├───┼───┼───┼───┼───┼───┼───┼───┼───┤'),
			bottomRow = black('└───┴───┴───┴───┴───┴───┴───┴───┴───┘');

		console.log(`    A   B   C   D   E   F   G   H   I`);
		console.log(`  ${topRow}`);
		for (const [i, tableDataRow] of board.board.entries()) {
			let rowString = `${i + 1} `;
			for (const [j, number] of tableDataRow.entries()) {
				const rowFunc = j % 3 === 0 ? black : gray;

				const numString =
					number === 0
						? ' '
						: board.initialBoard[i].includes(number)
						? number
						: blueBright(number);
				rowString += rowFunc('│') + ` ${numString} `;
			}
			rowString += black('│');

			if (i !== 0)
				console.log(
					`  ${i % 3 === 0 ? middleRowMajor : middleRowMinor}`,
				);
			console.log(rowString);
		}
		console.log(`  ${bottomRow}`);
	}

	private promptMove(board: Board): void {
		this.displayTable(board);

		let failedAttempts = 0;

		const rl = createInterface(process.stdin, process.stdout);

		rl.setPrompt(dim('> '));
		rl.prompt();

		rl.on('line', (line) => {
			const data = line.trim();

			// e.g. "1A 5"
			if (data.split(' ').length !== 2) {
				failedAttempts = this.badAttempt(
					rl,
					'Coordinate and number not recognized. Try again.',
					failedAttempts,
				);
				return;
			}

			const [position, number] = data.split(' ');

			if (position.length !== 2) {
				failedAttempts = this.badAttempt(
					rl,
					'Invalid coordinates supplied. Try again.',
					failedAttempts,
				);
				return;
			}

			let row;
			if ((row = position.match(/[1-9]/)) === null) {
				failedAttempts = this.badAttempt(
					rl,
					'Cannot extract row number from input. Try again.',
					failedAttempts,
				);
				return;
			}
			const col =
				position.split(row[0]).join('').toUpperCase().charCodeAt(0) -
				65;
			row = parseInt(row[0]) - 1;

			if (
				isNaN(parseInt(number)) ||
				parseInt(number) < 1 ||
				parseInt(number) > 9
			) {
				failedAttempts = this.badAttempt(
					rl,
					'Invalid number received. Try again.',
					failedAttempts,
				);
				return;
			}

			if (board.initialBoard[row][col] !== 0) {
				failedAttempts = this.badAttempt(
					rl,
					'That is a generated value, it cannot be changed. Try again.',
					failedAttempts,
				);
				return;
			}
			const existingNumber = board.board[row][col];
			board.board[row][col] = parseInt(number);
			if (!Board.isValid(board.board)) {
				board.board[row][col] = existingNumber;
				failedAttempts = this.badAttempt(
					rl,
					'That is an invalid move. Try again.',
					failedAttempts,
				);
				return;
			}
			board.history.push({ x: row, y: col, val: parseInt(number) });

			moveCursor(process.stdout, -3, -failedAttempts - 21);
			clearScreenDown(process.stdout);
			console.log(
				dim('Played ') +
					blueBright(number) +
					dim(' at ') +
					blue(String.fromCharCode(col + 65) + (row + 1)) +
					dim('.'),
			);
			console.log(black('───────────────────────────────────────'));

			rl.close();
		})
			.on('close', () => {
				return this.startGame();
			})
			.on('SIGINT', () => {
				rl.pause();
			});
	}

	private badAttempt(
		rl: Interface,
		message: string,
		failedAttempts: number,
	): number {
		moveCursor(process.stdout, -3, -1);
		clearLine(process.stdout, 0);
		console.log(dim(red(message)));
		rl.prompt();

		return failedAttempts + 1;
	}
}
