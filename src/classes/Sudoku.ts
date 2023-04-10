/** @format */

import fs from 'fs';
import chalk from 'chalk';
import {
	clearLine,
	clearScreenDown,
	createInterface,
	moveCursor,
	Interface,
} from 'readline';
import Board from './Board.js';
import { Structure } from '../interfaces/Structure.js';
import { HistoryTree } from './History.js';
import Table from './Table.js';
import SelectMenu from './SelectMenu.js';
import BoardGenerator from './BoardGenerator.js';

const { greenBright, dim, blue, blueBright, red } = chalk;

const DEFAULT_PROMPT = dim('sudoku> ');
export enum Difficulty {
	Easy,
	Medium,
	Hard,
	Extreme,
	Impossible,
}

interface PreviousGame {
	initialBoard: number[][];
	history: Structure<string[]>;
	difficulty: Difficulty | 'custom';
	createdAt: Date;
	solvedAt: Date;
}

interface PreviousParsedGame {
	initialBoard: number[][];
	history: HistoryTree<string[]>;
	difficulty: Difficulty | 'custom';
	createdAt: Date;
	solvedAt: Date;
}

export default class {
	private previousGames: PreviousParsedGame[] = [];
	private currentBoard?: Board;
	constructor() {
		this.readFolder();
		this.displayWelcome().then(() => {
			return;
		});
	}

	private readFolder() {
		// read folder for saved games
		if (fs.existsSync('./saves')) {
			const files = fs.readdirSync('./saves');
			for (const file of files) {
				const contents = fs.readFileSync(`./saves/${file}`, {
					encoding: 'utf-8',
					flag: 'r',
				});

				const game = JSON.parse(contents) as PreviousGame;

				this.previousGames.push({
					...game,
					history: HistoryTree.fromStructure(game.history),
				});
			}
		} else {
			fs.mkdirSync('./saves');
		}
	}

	private writeGame(board: Board) {
		const structure = board.structure;
		const data: PreviousGame = {
			initialBoard: board.initialBoard,
			history: structure,
			difficulty: board.difficulty,
			createdAt: board.createdAt,
			solvedAt: board.solvedAt as Date,
		};

		// write folder for saved games
		fs.writeFileSync(`./saves/${structure._id}.json`, JSON.stringify(data));
		this.previousGames.push({
			...data,
			history: HistoryTree.fromStructure(board.structure),
		});
	}

	private async displayWelcome() {
		this.resetCursor(100, 100);
		const menu = new SelectMenu(Table.formatWelcomeMessage());
		const mode = await new Promise<0 | 1 | 2>((resolve) =>
			menu.on('select', (mode) => resolve(mode)),
		);

		switch (mode) {
			case 0:
				await this.newGame();
				break;
			case 1:
				await this.loadGame();
				break;
			case 2:
				this.exit();
				break;
		}
	}

	private async newGame() {
		const sizeMenu = new SelectMenu(Table.formatNewGameMessage(), 1);

		const mode = await new Promise<0 | 1 | 2 | 3>((resolve) =>
			sizeMenu.on('select', (mode) => resolve(mode)),
		);

		const modes = {
			0: 4,
			1: 9,
			2: 16,
			3: 25,
		};

		const boardGenerator = new BoardGenerator(modes[mode]);
		await boardGenerator.generate();

		const difficultyMenu = new SelectMenu(
			Table.formatDifficultyMessage(),
			1,
		);

		const difficulties = {
			0: Difficulty.Easy,
			1: Difficulty.Medium,
			2: Difficulty.Hard,
			3: Difficulty.Extreme,
			4: Difficulty.Impossible,
		};
		const difficulty = await new Promise<0 | 1 | 2 | 3 | 4 | 5>((resolve) =>
			difficultyMenu.on('select', (difficulty) => resolve(difficulty)),
		);

		let puzzle: number[][];
		if (difficulty !== 5) {
			puzzle = boardGenerator.generatePuzzle(difficulties[difficulty]);
			console.log(
				dim(blueBright(`${Difficulty[difficulty]} puzzle generated\n`)),
			);
			this.currentBoard = new Board(
				puzzle,
				boardGenerator,
				difficulties[difficulty],
			);
		} else {
			const max =
				boardGenerator.getBoard().length *
				boardGenerator.getBoard().length;
			const count = await SelectMenu.promptNumberInput(
				Table.formatCustomDifficultyMessage(max),
				1,
				max,
			);

			puzzle = boardGenerator.generateCustomPuzzle(count);
			console.log(
				dim(blueBright(`Custom puzzle generated with ${count} clues`)),
			);
			this.currentBoard = new Board(puzzle, boardGenerator, 'custom');
		}

		await this.playGame(this.currentBoard);
	}

	private async loadGame() {
		if (this.previousGames.length === 0) {
			console.log(
				Table.textPad(
					9,
					red('No saved games found. Please create a new game'),
				),
			);
			return this.displayWelcome();
		}

		const messages = this.previousGames.map(
			(game, index) =>
				`Game #${index + 1} | ${
					game.difficulty === 'custom'
						? 'Custom'
						: Difficulty[game.difficulty]
				} | ${game.createdAt.toLocaleString()}`,
		);
		const loadMenu = new SelectMenu(Table.formatLoadGameMessage(messages));

		const mode = await new Promise<number>((resolve) =>
			loadMenu.on('select', (mode) => resolve(mode)),
		);

		this.loadedGame(this.previousGames[mode]);
	}

	private exit() {
		console.log(Table.textPad(9, red('Goodbye! Thanks for playing.')));
		process.exit(0);
	}

	private playGame(board: Board) {
		if (board.solved) {
			board.solvedAt = new Date();
			for (const line of Table.format(
				board.currentBoard,
				board.initialBoard,
			))
				console.log(line);

			console.log(
				dim(greenBright('Congratulations! You completed the puzzle!')),
			);
			this.writeGame(board);
			return this.displayWelcome();
		}
		this.promptMove(board);
	}

	private loadedGame(previousGame: PreviousParsedGame) {
		const table = this.printLoadedGame(previousGame);

		// forwards, backwards and exit
		let failedAttempts = 1;

		const rl = createInterface(process.stdin, process.stdout);

		rl.setPrompt(DEFAULT_PROMPT);
		rl.prompt();

		rl.on('line', (line) => {
			const data = line.trim();

			if (data === 'exit') {
				this.resetCursor(failedAttempts, table.length);
				rl.close();
			} else if (data === 'next') {
				// go to next move
				previousGame.history.redo();
				this.resetCursor(failedAttempts, table.length);
				this.printLoadedGame(previousGame);
				rl.prompt();
			} else if (data === 'prev') {
				// go to previous move
				previousGame.history.undo();
				this.resetCursor(failedAttempts, table.length);
				this.printLoadedGame(previousGame);
				rl.prompt();
			} else {
				failedAttempts = this.badAttempt(
					rl,
					'Invalid command supplied. Try again.',
					failedAttempts,
				);
			}
		})
			.on('close', () => {
				return this.displayWelcome();
			})
			.on('SIGINT', () => {
				rl.pause();
			});
	}

	private printLoadedGame(previousGame: PreviousParsedGame) {
		const table = Table.format(
			previousGame.history.current.map((row) =>
				`${row}`.split(',').map((n) => parseInt(n)),
			),
			previousGame.initialBoard,
			false,
		);
		table.push(
			dim(`To go to the next move, type "${greenBright('next')}"`),
		);
		table.push(
			dim(`To go to the previous move, type "${greenBright('prev')}"`),
		);
		table.push(dim(`To exit, type "${greenBright('exit')}"`));
		console.log(table.join('\n'));

		return table;
	}

	private displayHelp(
		board: Board,
		rl: Interface,
		args: string[],
		failedAttempts: number,
	): number {
		this.resetLine();
		switch (args[0]) {
			case 'help':
				console.log(
					`Help Message - ${dim('Help')}:\n` +
						`  ${blueBright('help')} - Display this help message\n`,
				);
				failedAttempts += 3;
				break;
			case 'undo':
				console.log(
					`Help Message - ${dim('Undo')}:\n` +
						`  ${blueBright('undo')} - Undo the latest move\n`,
				);
				failedAttempts += 3;
				break;
			case 'redo':
				console.log(
					`Help Message - ${dim('Redo')}:\n` +
						`  ${blueBright(
							'redo',
						)} - Redo a move undone by undo\n`,
				);
				failedAttempts += 3;
				break;
			case 'play':
				console.log(
					`Help Message - ${dim('Play')}:\n` +
						`  ${blueBright('play')} - Play a move\n` +
						`  Arguments: ${blueBright(
							'play',
						)} <row><column> <number>\n` +
						`  Example: ${blueBright('play')} 1A 1\n`,
				);
				failedAttempts += 5;
				break;
			case undefined:
				console.log(`Help Message - ${dim('Commands:')}`);
				console.log(
					`  ${blueBright('help')} - Display this help message\n` +
						`  ${blueBright('undo')} - Undo the latest move\n` +
						`  ${blueBright(
							'redo',
						)} - Redo a move undone by undo\n` +
						`  ${blueBright('play')} - Play a move\n`,
				);
				console.log(
					dim(
						`Type '${greenBright(
							'help <command>',
						)}' for more information on a specific command.`,
					),
				);
				console.log(Table.horizontalDivider(board.currentBoard.length));
				failedAttempts += 8;
				break;
			default:
				console.log(
					`Invalid subcommand supplied.` +
						` Type '${greenBright(
							'help',
						)}' for a list of commands.`,
				);
				failedAttempts += 1;
				break;
		}
		rl.prompt();
		return failedAttempts;
	}

	private resetCursor(inputLength: number, tableHeight: number): void {
		moveCursor(process.stdout, -3, -inputLength - tableHeight);
		clearScreenDown(process.stdout);
	}

	private resetLine(): void {
		moveCursor(process.stdout, -3, -1);
		clearLine(process.stdout, 0);
	}

	private promptMove(board: Board): void {
		const table = Table.format(board.currentBoard, board.initialBoard);
		console.log(table.join('\n'));

		let failedAttempts = 1;

		const rl = createInterface(process.stdin, process.stdout);

		rl.setPrompt(DEFAULT_PROMPT);
		rl.prompt();

		rl.on('line', (line) => {
			const data = line.trim();

			if (data.startsWith('play ')) {
				failedAttempts = this.placeNumber(
					board,
					rl,
					failedAttempts,
					table.length,
					data.replace('play ', ''),
				);
			} else if (data === 'undo' || data === 'redo') {
				if (board[data]()) {
					this.resetCursor(failedAttempts, table.length);
					const keyword = data === 'undo' ? 'Undid' : 'Redid';
					console.log(dim(`${keyword} previous move`));
					console.log(
						Table.horizontalDivider(board.currentBoard.length),
					);
					rl.close();
				} else {
					failedAttempts = this.badAttempt(
						rl,
						`Cannot ${data} any further`,
						failedAttempts,
					);
				}
			} else if (data === 'help' || data.startsWith('help ')) {
				const parsedData = data.split('help ').slice(1);
				failedAttempts = this.displayHelp(
					board,
					rl,
					parsedData,
					failedAttempts,
				);
			} else {
				failedAttempts = this.badAttempt(
					rl,
					'Invalid command supplied. Try again.',
					failedAttempts,
				);
			}
		})
			.on('close', () => {
				return this.playGame(board);
			})
			.on('SIGINT', () => {
				rl.pause();
			});
	}

	private extractRowColAndNumber(
		board: Board,
		position: string,
		number: string,
		rl: Interface,
		failedAttempts: number,
	): [number, number, number] | number {
		if (position.length !== 2) {
			failedAttempts = this.badAttempt(
				rl,
				'Invalid coordinates supplied. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}

		let row;
		if ((row = position.match(/[1-9]/)) === null) {
			failedAttempts = this.badAttempt(
				rl,
				'Cannot extract row number from input. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}
		const col =
			position.split(row[0]).join('').toUpperCase().charCodeAt(0) - 65;
		row = parseInt(row[0]) - 1;

		if (
			isNaN(parseInt(number)) ||
			parseInt(number) < 1 ||
			parseInt(number) > board.initialBoard.length
		) {
			failedAttempts = this.badAttempt(
				rl,
				'Invalid number received. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}

		return [row, col, parseInt(number)];
	}
	private placeNumber(
		board: Board,
		rl: Interface,
		failedAttempts: number,
		tableSize: number,
		data: string,
	): number {
		// Data:
		// 	1A 5
		// 	A1 5
		// 	5 A1
		// 	5 1A

		// Should all work

		const splitData = data.split(' ');

		if (splitData.length !== 2) {
			failedAttempts = this.badAttempt(
				rl,
				'Coordinate and number not recognized. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}

		const isValid = (number: string) =>
			!Number.isNaN(parseInt(number)) &&
			(number.length === 1 ||
				(board.initialBoard.length > 9 && number.length === 2));

		const scenario1 = splitData[0].length === 2 && isValid(splitData[1]);
		const scenario2 = splitData[1].length === 2 && isValid(splitData[0]);

		if (!scenario1 && !scenario2)
			return this.badAttempt(
				rl,
				'Coordinate and number not recognized. Try again.',
				failedAttempts,
			);

		let v: [string, string];
		if (scenario1) v = [splitData[0], splitData[1]];
		else if (scenario2) v = [splitData[1], splitData[0]];
		else
			return this.badAttempt(
				rl,
				'Coordinate and number not recognized. Try again.',
				failedAttempts,
			);

		const rowColAndNumber = this.extractRowColAndNumber(
			board,
			...v,
			rl,
			failedAttempts,
		);
		if (typeof rowColAndNumber === 'number') return rowColAndNumber;
		const [row, col, number] = rowColAndNumber;

		if (board.initialBoard[row][col] !== 0)
			return this.badAttempt(
				rl,
				'That is a generated value, it cannot be changed. Try again.',
				failedAttempts,
			);

		const possibleValues = board.generator.getValidValues(
			board.currentBoard,
			row,
			col,
		);
		if (!possibleValues.includes(number)) {
			failedAttempts = this.badAttempt(
				rl,
				'That is an invalid move. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}

		board.move(row, col, number);

		this.resetCursor(failedAttempts, tableSize);
		console.log(
			dim('Played ') +
				blueBright(number) +
				dim(' at ') +
				blue(String.fromCharCode(col + 65) + (row + 1)) +
				dim('.'),
		);
		console.log(Table.horizontalDivider(board.currentBoard.length));

		rl.close();
		return failedAttempts;
	}

	private badAttempt(
		rl: Interface,
		message: string,
		failedAttempts: number,
	): number {
		this.resetLine();
		console.log(dim(red(message)));
		rl.prompt();

		return failedAttempts + 1;
	}
}
