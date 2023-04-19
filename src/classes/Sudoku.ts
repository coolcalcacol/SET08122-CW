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
import { HistoryTree } from './History.js';
import Table from './Table.js';
import SelectMenu from './SelectMenu.js';
import BoardGenerator from './BoardGenerator.js';
import {
	PreviousParsedGame,
	PreviousRawGame,
} from '../interfaces/PreviousGame.js';
import { Difficulty } from '../enums/Difficulty.js';

/**
 * extract the chalk colours I use
 */
const { greenBright, dim, blue, blueBright, red } = chalk;

/**
 * the default prompt for readline
 */
const DEFAULT_PROMPT = dim('sudoku> ');

/**
 * Defines a class for the Sudoku game.
 */
export default class {
	// an array of previous games
	private previousGames: PreviousParsedGame[] = [];

	// the current board
	private currentBoard?: Board;

	/**
	 * Set up the game.
	 */
	constructor() {
		// read the folder for saved games, parsing to the previousGames array if exists, else create folder
		this.readFolder();

		// clear the screen and set the cursor to the top left
		this.resetCursor(100, 100);

		// display the welcome message and start game
		this.displayWelcome().then(() => {
			return;
		});
	}

	/**
	 * Reads the folder for saved games, parsing to the previousGames array if exists, else create folder
	 * @private
	 */
	private readFolder() {
		// read folder for saved games
		if (fs.existsSync('./saves')) {
			// read the files in the folder
			const files = fs.readdirSync('./saves');

			// for each file, read the contents, parse the JSON, and push to the previousGames array
			for (const file of files) {
				// read the contents of the file
				const contents = fs.readFileSync(`./saves/${file}`, {
					encoding: 'utf-8',
					flag: 'r',
				});

				// parse the JSON as a PreviousRawGame
				const game = JSON.parse(contents) as PreviousRawGame;

				// push to the previousGames array
				this.previousGames.push({
					...game,
					history: HistoryTree.fromStructure(game.history),
				});
			}
		} else {
			// else create folder for saved games
			fs.mkdirSync('./saves');
		}
	}

	/**
	 * Writes a game to the saves folder
	 * @param board the board to write
	 * @private
	 */
	private writeGame(board: Board) {
		// get the structure from the board
		const structure = board.structure;

		// create the data to write
		const data: PreviousRawGame = {
			initialBoard: board.initialBoard,
			history: structure,
			difficulty: board.difficulty,
			createdAt: board.createdAt,
			solvedAt: board.solvedAt as Date,
		};

		// write data to file named after the structure's root ID
		fs.writeFileSync(`./saves/${structure._id}.json`, JSON.stringify(data));

		// push to the previousGames array
		this.previousGames.push({
			...data,
			history: HistoryTree.fromStructure(board.structure),
		});
	}

	/**
	 * Displays the welcome message and prompts the user to select a mode.
	 * @private
	 */
	private async displayWelcome() {
		// create a new select menu
		const menu = new SelectMenu(Table.formatWelcomeMessage());

		// wait for the user to select a mode
		const mode = await new Promise<0 | 1 | 2>((resolve) =>
			// when the user selects a mode, resolve the promise
			menu.on('select', (mode) => resolve(mode)),
		);

		switch (mode) {
			// if the user selected new game, start a new game
			case 0:
				await this.newGame();
				break;
			// if the user selected load game, start the load game menu
			case 1:
				await this.loadGame();
				break;
			// if the user selected exit, exit the game
			case 2:
				this.exit();
				break;
		}
	}

	/**
	 * Takes the user through the process of starting a new game.
	 * @private
	 */
	private async newGame() {
		//create a new SelectMenu to ask the user for the size of the board
		const sizeMenu = new SelectMenu(Table.formatNewGameMessage(), 1);

		// wait for the user to select a size
		const mode = await new Promise<0 | 1 | 2 | 3>((resolve) =>
			// when the user selects a size, resolve the promise
			sizeMenu.on('select', (mode) => resolve(mode)),
		);

		// map the mode to the size of the board
		const modes = { 0: 4, 1: 9, 2: 16, 3: 25 };

		// create a new BoardGenerator with the selected size
		const boardGenerator = new BoardGenerator(modes[mode]);

		// generate a solved board
		if (!(await boardGenerator.generate())) {
			// if the board could not be generated, display an error and start a new game
			console.log(red('Could not generate a board!'));
			await this.newGame();
			return;
		}

		// create a new SelectMenu to ask the user for the difficulty of the puzzle
		const difficultyMenu = new SelectMenu(
			Table.formatDifficultyMessage(),
			1,
		);

		// wait for the user to select a difficulty
		const difficulty = await new Promise<0 | 1 | 2 | 3 | 4 | 5>((resolve) =>
			// when the user selects a difficulty, resolve the promise
			difficultyMenu.on('select', (difficulty) => resolve(difficulty)),
		);

		// this will be the fully solved board
		let puzzle: number[][];

		// map the difficulty to the difficulty enum
		const difficulties = [
			Difficulty.Easy,
			Difficulty.Medium,
			Difficulty.Hard,
			Difficulty.Extreme,
			Difficulty.Impossible,
		];

		// if the user selected a difficulty, generate a puzzle with that difficulty
		if (difficulty !== 5) {
			// generate a puzzle with the selected difficulty
			puzzle = boardGenerator.generatePuzzle(difficulties[difficulty]);

			// inform the user that the puzzle has been generated
			console.log(
				dim(
					blueBright(
						`${difficulties[difficulty]} puzzle generated\n`,
					),
				),
			);

			// create a new Board with the puzzle and the difficulty
			this.currentBoard = new Board(
				puzzle,
				boardGenerator,
				difficulties[difficulty],
			);

			// else the user selected custom difficulty
		} else {
			// determine the maximum number of clues that can be removed
			const max =
				boardGenerator.board.length * boardGenerator.board.length;

			// create a new SelectMenu to ask the user for the number of clues to remove
			const count = await SelectMenu.promptNumberInput(
				Table.formatCustomDifficultyMessage(max),
				1,
				max,
			);

			// generate a puzzle with the selected number of clues removed
			puzzle = boardGenerator.generateCustomPuzzle(count);

			// inform the user that the custom puzzle has been generated
			console.log(
				dim(blueBright(`Custom puzzle generated with ${count} clues`)),
			);

			// create a new Board with the puzzle and the difficulty set to custom
			this.currentBoard = new Board(puzzle, boardGenerator, 'custom');
		}

		// start the game
		await this.playGame(this.currentBoard);
	}

	/**
	 * Displays the load game menu and prompts the user to select a game.
	 * @private
	 */
	private async loadGame() {
		// if there are no saved games, inform the user and return to the welcome menu
		if (this.previousGames.length === 0) {
			console.log(
				Table.textPad(
					9,
					red('No saved games found. Please create a new game'),
				),
			);
			return this.displayWelcome();
		}

		// parse the previous games into a list of messages that can be displayed in the SelectMenu
		const messages = this.previousGames.map(
			(game, index) =>
				`Game #${index + 1} | ${
					game.difficulty === 'custom'
						? 'Custom'
						: Difficulty[game.difficulty]
				} | ${game.createdAt.toLocaleString()}`,
		);

		// create a new SelectMenu to display the list of previous games
		const loadMenu = new SelectMenu(Table.formatLoadGameMessage(messages));

		// wait for the user to select a game
		const mode = await new Promise<number>((resolve) =>
			// when the user selects a game, resolve the promise
			loadMenu.on('select', (mode) => resolve(mode)),
		);

		// load the selected game
		this.loadedGame(this.previousGames[mode]);
	}

	/**
	 * Displays the exit message and exits the game.
	 */
	private exit() {
		console.log(Table.textPad(9, red('Goodbye! Thanks for playing.')));
		process.exit(0);
	}

	/**
	 * initiates the game loop.
	 * @param board The board to play the game on.
	 * @private
	 */
	private playGame(board: Board) {
		// if the board is solved, congratulate the user and return to the welcome menu
		if (board.solved) {
			// set the solvedAt date to the current date
			board.solvedAt = new Date();

			// print the solved board
			for (const line of Table.format(
				board.currentBoard,
				board.initialBoard,
			))
				console.log(line);

			// congratulate the user
			console.log(
				dim(greenBright('Congratulations! You completed the puzzle!')),
			);

			// save the game to the filesystem
			this.writeGame(board);

			// return to the welcome menu
			return this.displayWelcome();
		}

		// else the board is not solved, so print the board and prompt the user for a move
		this.promptMove(board);
	}

	/**
	 * Handle a loaded game.
	 * @param previousGame The previous game to load.
	 * @private
	 */
	private loadedGame(previousGame: PreviousParsedGame) {
		// print the loaded game
		const table = this.printLoadedGame(previousGame);

		// create a new readline interface
		let failedAttempts = 1;
		const rl = createInterface(process.stdin, process.stdout);

		// set the prompt and prompt the user
		rl.setPrompt(DEFAULT_PROMPT);
		rl.prompt();

		// when the user enters a command
		rl.on('line', (line) => {
			// trim the input
			const data = line.trim();

			// if the user entered a valid command, handle it
			if (data === 'exit') {
				// if the user wants to exit, reset the cursor and close the readline interface
				this.resetCursor(failedAttempts, table.length);
				rl.close();
			} else if (data === 'next' || data === 'prev') {
				// if the user wants to undo or redo, execute the command and re-display the board
				const mode = data === 'next' ? 'redo' : 'undo';

				// if the command can be executed, execute it and re-display the board
				if (previousGame.history[mode]()) {
					this.resetCursor(failedAttempts, table.length);
					this.printLoadedGame(previousGame);
					rl.prompt();

					// else the command cannot be executed, inform the user and prompt them again
				} else {
					failedAttempts = this.badAttempt(
						rl,
						`Cannot ${mode} any further`,
						failedAttempts,
					);
				}

				// else the user entered an invalid command
			} else {
				// inform the user that the command is invalid and prompt them again
				failedAttempts = this.badAttempt(
					rl,
					'Invalid command supplied. Try again.',
					failedAttempts,
				);
			}
		})
			// when the readline interface is closed, return to the welcome menu
			.on('close', () => {
				return this.displayWelcome();
			})
			.on('SIGINT', () => {
				rl.pause();
			});
	}

	/**
	 * Prints the loaded game menu.
	 * @param previousGame The previous game to load.
	 * @private
	 */
	private printLoadedGame(previousGame: PreviousParsedGame) {
		// get the formatted table of the previous game without controls
		const table = Table.format(
			previousGame.history.current.map((row) =>
				`${row}`.split(',').map((n) => parseInt(n)),
			),
			previousGame.initialBoard,
			false,
		);

		// add custom help messages
		table.push(
			dim(`To go to the next move, type "${greenBright('next')}"`),
		);
		table.push(
			dim(`To go to the previous move, type "${greenBright('prev')}"`),
		);
		table.push(dim(`To exit, type "${greenBright('exit')}"`));

		// paste the table to the console
		console.log(table.join('\n'));

		// return the pasted table
		return table;
	}

	/**
	 * Display the help message for the user
	 * @param board The board to play the game on.
	 * @param rl The readline interface.
	 * @param args The arguments to the help command.
	 * @param failedAttempts The number of failed attempts.
	 * @private
	 */
	private displayHelp(
		board: Board,
		rl: Interface,
		args: string[],
		failedAttempts: number,
	): number {
		// clear the user's input
		this.resetLine();
		switch (args[0]) {
			// if the user wants help with the help command, display the help message for the help command
			case 'help':
				console.log(
					`Help Message - ${dim('Help')}:\n` +
						`  ${blueBright('help')} - Display this help message\n`,
				);
				failedAttempts += 3;
				break;

			// if the user wants help with the undo command, display the help message for the undo command
			case 'undo':
				console.log(
					`Help Message - ${dim('Undo')}:\n` +
						`  ${blueBright('undo')} - Undo the latest move\n`,
				);
				failedAttempts += 3;
				break;

			// if the user wants help with the redo command, display the help message for the redo command
			case 'redo':
				console.log(
					`Help Message - ${dim('Redo')}:\n` +
						`  ${blueBright(
							'redo',
						)} - Redo a move undone by undo\n`,
				);
				failedAttempts += 3;
				break;

			// if the user wants help with the play command, display the help message for the play command
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

			// if the user doesn't want any specific help, display the help message for the game
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

			// if the user supplied an invalid command, inform them
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

		// prompt the user again
		rl.prompt();

		// return the updated number of failed attempts
		return failedAttempts;
	}

	/**
	 * Helper method to reset the cursor to the correct position.
	 * @param inputLength The length of the user's input.
	 * @param tableHeight The height of the pasted table.
	 * @private
	 */
	private resetCursor(inputLength: number, tableHeight: number): void {
		moveCursor(process.stdout, -3, -inputLength - tableHeight);
		clearScreenDown(process.stdout);
	}

	/**
	 * Helper method to reset the line.
	 * @private
	 */
	private resetLine(): void {
		moveCursor(process.stdout, -3, -1);
		clearLine(process.stdout, 0);
	}

	/**
	 * handle the user's input and place the number on the board
	 * @param board The board to play the game on.
	 * @private
	 */
	private promptMove(board: Board): void {
		// paste the table to the console
		const table = Table.format(board.currentBoard, board.initialBoard);
		console.log(table.join('\n'));

		// keep track of the number of failed attempts
		let failedAttempts = 1;

		// create the readline interface
		const rl = createInterface(process.stdin, process.stdout);

		// set the prompt and prompt the user
		rl.setPrompt(DEFAULT_PROMPT);
		rl.prompt();

		// handle the user's input
		rl.on('line', (line) => {
			// trim the input
			const data = line.trim();

			// if the user wants to play a move
			if (data.startsWith('play ')) {
				// try and place the number
				failedAttempts = this.placeNumber(
					board,
					rl,
					failedAttempts,
					table.length,
					data.replace('play ', ''),
				);

				// if the user wants to redo or undo a move
			} else if (data === 'undo' || data === 'redo') {
				// try and undo or redo the move
				if (board[data]()) {
					// if the move was successfully undone or redone, inform the user
					this.resetCursor(failedAttempts, table.length);
					const keyword = data === 'undo' ? 'Undid' : 'Redid';
					console.log(dim(`${keyword} previous move`));
					console.log(
						Table.horizontalDivider(board.currentBoard.length),
					);

					// close the readline interface
					rl.close();

					// if the user cannot undo or redo any further, inform them and prompt them again
				} else {
					failedAttempts = this.badAttempt(
						rl,
						`Cannot ${data} any further`,
						failedAttempts,
					);
				}

				// if the user wants help
			} else if (data === 'help' || data.startsWith('help ')) {
				// parse the subcommand
				const parsedData = data.split('help ').slice(1);

				// display the help message
				failedAttempts = this.displayHelp(
					board,
					rl,
					parsedData,
					failedAttempts,
				);

				// if the user supplied an invalid command, inform them and prompt them again
			} else {
				failedAttempts = this.badAttempt(
					rl,
					'Invalid command supplied. Try again.',
					failedAttempts,
				);
			}
		})
			.on('close', () => {
				// if the move is over, return to the play game method to handle next steps
				return this.playGame(board);
			})
			.on('SIGINT', () => {
				rl.pause();
			});
	}

	/**
	 * Helper method to parse user input for coordinates
	 * @param board The board to play the game on.
	 * @param position The position to place the number.
	 * @param number The number to place on the board.
	 * @param rl The readline interface.
	 * @param failedAttempts The number of failed attempts.
	 * @private
	 */
	private extractRowColAndNumber(
		board: Board,
		position: string,
		number: string,
		rl: Interface,
		failedAttempts: number,
	): [number, number, number] | number {
		// if an invalid number of coordinates were supplied, inform the user and prompt them again
		if (
			!(
				position.length === 2 ||
				(board.initialBoard.length > 9 && position.length === 3)
			)
		) {
			failedAttempts = this.badAttempt(
				rl,
				'Invalid coordinates supplied. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}

		// try and extract the row from the input
		let row;
		if ((row = position.match(/[1-9]{1,2}/)) === null) {
			// if the row is invalid, inform the user and prompt them again
			failedAttempts = this.badAttempt(
				rl,
				'Cannot extract row number from input. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}

		// try and extract the column from the input
		const col =
			position.split(row[0]).join('').toUpperCase().charCodeAt(0) - 65;
		row = parseInt(row[0]) - 1;

		// if the number received is invalid, or out of range, inform the user and prompt them again
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

		// return the row, column and number
		return [row, col, parseInt(number)];
	}

	/**
	 * Helper method to place a number on the board
	 * @param board The board to play the game on.
	 * @param rl The readline interface.
	 * @param failedAttempts The number of failed attempts.
	 * @param tableSize The size of the table.
	 * @param data The data to parse.
	 * @private
	 */
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

		// split the data into two parts
		const splitData = data.split(' ');

		// if the data is not in the correct format, inform the user and prompt them again
		if (splitData.length !== 2) {
			failedAttempts = this.badAttempt(
				rl,
				'Coordinate and number not recognized. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}

		// helper function to check if a number is valid length
		const isValidNumber = (number: string) =>
			!Number.isNaN(parseInt(number)) &&
			(number.length === 1 ||
				(board.initialBoard.length > 9 && number.length === 2));

		// helper function to check if a coordinate is valid length
		const isValidCoords = (coords: string) =>
			coords.length === 2 ||
			(board.initialBoard.length > 9 && coords.length === 3);

		// check if the data is in the correct format
		const scenario1 =
			isValidCoords(splitData[0]) && isValidNumber(splitData[1]);
		const scenario2 =
			isValidCoords(splitData[1]) && isValidNumber(splitData[0]);

		let v: [string, string];

		// if the data is in the correct format, extract the row, column and number
		if (scenario1) v = [splitData[0], splitData[1]];
		else if (scenario2) v = [splitData[1], splitData[0]];
		// if the data is not in the correct format, inform the user and prompt them again
		else
			return this.badAttempt(
				rl,
				'Coordinate and number not recognized. Try again.',
				failedAttempts,
			);

		// extract the row, column and number
		const rowColAndNumber = this.extractRowColAndNumber(
			board,
			...v,
			rl,
			failedAttempts,
		);

		// if the rowColAndNumber is a number, return it. This means the user has entered invalid data
		if (typeof rowColAndNumber === 'number') return rowColAndNumber;

		// destructure the row, column and number
		const [row, col, number] = rowColAndNumber;

		// make sure we're not overwriting a generated value
		if (board.initialBoard[row][col] !== 0)
			return this.badAttempt(
				rl,
				'That is a generated value, it cannot be changed. Try again.',
				failedAttempts,
			);

		// get the possible values for the given row and column
		const possibleValues = BoardGenerator.getValidValues(
			board.currentBoard,
			row,
			col,
		);

		// if the number is not in the possible values, inform the user and prompt them again
		if (!possibleValues.includes(number)) {
			failedAttempts = this.badAttempt(
				rl,
				'That is an invalid move. Try again.',
				failedAttempts,
			);
			return failedAttempts;
		}

		// place the number on the board
		board.move(row, col, number);

		// reset the cursor and print move summary
		this.resetCursor(failedAttempts, tableSize);
		console.log(
			dim('Played ') +
				blueBright(number) +
				dim(' at ') +
				blue(String.fromCharCode(col + 65) + (row + 1)) +
				dim('.'),
		);
		console.log(Table.horizontalDivider(board.currentBoard.length));

		// close the readline interface
		rl.close();

		// return the number of failed attempts
		return failedAttempts;
	}

	/**
	 * helper method to output a bad attempt message
	 * @param rl The readline interface.
	 * @param message The message to output.
	 * @param failedAttempts The number of failed attempts.
	 * @private
	 */
	private badAttempt(
		rl: Interface,
		message: string,
		failedAttempts: number,
	): number {
		// reset the line and print the message
		this.resetLine();
		console.log(dim(red(message)));

		// prompt the user again
		rl.prompt();

		// return the number of failed attempts, plus the most recent
		return failedAttempts + 1;
	}
}
