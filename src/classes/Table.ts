/** @format */

import chalk from 'chalk';
import { SelectMenuData } from '../interfaces/SelectMenuData.js';

/**
 * extract the chalk colours I use
 */
const { black, blackBright, greenBright, dim, blue, blueBright, white } = chalk;

/**
 * Defines a class for a table.
 */
export default class Table {
	// Elements for the top row of the table
	private static topLeft = black('┌');
	private static topMiddle = black('┬');
	private static topRight = black('┐');

	// Elements for the middle rows of the table
	private static leftMiddle = black('├');
	private static middleMiddle = (major: boolean) =>
		(major ? black : blackBright)('┼');
	private static rightMiddle = black('┤');

	// Elements for the bottom row of the table
	private static bottomLeft = black('└');
	private static bottomMiddle = black('┴');
	private static bottomRight = black('┘');

	// Elements for the vertical and horizontal lines
	private static horizontal = (major: boolean) =>
		(major ? black : blackBright)('─');
	private static vertical = (major: boolean) =>
		(major ? black : blackBright)('│');

	// Elements to handle the padding for the table
	private static padSize = (boardSize: number) => (boardSize > 9 ? 4 : 3);
	private static leftPad = (boardSize: number) =>
		' '.repeat(this.padSize(boardSize) - 1);
	private static horizontalPad = (boardSize: number, horizontal = true) =>
		this.horizontal(horizontal).repeat(this.padSize(boardSize));

	public static textPad = (boardSize: number, text: string) =>
		`${this.leftPad(boardSize)} ${text}`;

	// horizontal divider for the table
	public static horizontalDivider = (boardSize: number) =>
		this.leftPad(boardSize) +
		this.horizontalPad(boardSize).repeat(boardSize);

	/**
	 * Get the top letter row, and top bounding box of the table
	 * @param boardSize the size of the board
	 * @private
	 */
	private static getTopRowString(boardSize: number): [string, string] {
		const horizontalPad = Table.horizontalPad(boardSize);

		// create an array of the letters, and join them together with a space
		const letterRow = Array.from(
			Array(boardSize),
			(_, i) => Table.leftPad(boardSize) + String.fromCharCode(65 + i),
		).join(' ');

		// create the top row of the table by repeating the top middle element for the board size
		const topRowMiddle = `${`${horizontalPad}${Table.topMiddle}`.repeat(
			boardSize - 1,
		)}${horizontalPad}`;

		// join the top left and top right elements with the top row middle
		const topRow = `${Table.topLeft}${topRowMiddle}${Table.topRight}`;

		// return the letter row and top row with left padding
		return [
			`${Table.leftPad(boardSize)}${letterRow}`,
			`${Table.leftPad(boardSize)}${topRow}`,
		];
	}

	/**
	 * Get the bottom row of the table
	 * @param boardSize the size of the board
	 * @private
	 */
	private static getBottomRowString(boardSize: number): string {
		const horizontalPad = Table.horizontalPad(boardSize);

		// create the bottom row of the table by repeating the bottom middle element for the board size
		const bottomRowMiddle = `${`${horizontalPad}${Table.bottomMiddle}`.repeat(
			boardSize - 1,
		)}${horizontalPad}`;

		// join the bottom left and bottom right elements with the bottom row middle
		const bottomRow = `${Table.bottomLeft}${bottomRowMiddle}${Table.bottomRight}`;

		// return the bottom row with left padding
		return `${Table.leftPad(boardSize)}${bottomRow}`;
	}

	/**
	 * Method to format the current game's board
	 * @param currentBoard the current board
	 * @param initialBoard the initial board, used to check if a number is to be blue or default colour
	 * @param displayExtra whether to display extra information
	 */
	public static format(
		currentBoard: number[][],
		initialBoard: number[][],
		displayExtra = true,
	): string[] {
		// create an array to store the output
		const outputString = [];

		// get the board size for easier access
		const boardSize = currentBoard.length;

		// add the top rows to the table
		outputString.push(...Table.getTopRowString(boardSize));

		// create an array to store the used numbers
		const usedNumbers = Array.from(Array(boardSize).fill(0));

		// loop through the current board and add the rows to the table
		for (const [i, tableDataRow] of currentBoard.entries()) {
			// check if the row is a major row
			const isMajorRow = i % Math.sqrt(boardSize) === 0;

			// create the divider string and row string
			let dividerString = `${Table.leftPad(boardSize)}${
					Table.leftMiddle
				}${Table.horizontalPad(boardSize, isMajorRow)}`,
				rowString =
					boardSize > 9 ? `${i + 1} `.padStart(3, ' ') : `${i + 1} `;

			// loop through the row and add the elements to the row string and divider string
			for (const [j, number] of tableDataRow.entries()) {
				const isMajorCol = j % Math.sqrt(boardSize) === 0;
				usedNumbers[number - 1]++;

				// formatting of number rows and divider rows
				if (j !== 0)
					dividerString +=
						Table.middleMiddle(isMajorCol || isMajorRow) +
						Table.horizontalPad(boardSize, isMajorRow);

				rowString += Table.vertical(isMajorCol);

				// determining the colour of the number, or if it is a blank space
				if (number !== 0) {
					// if the number is user inputted, make it blue, otherwise make it white
					const inString = ` ${(initialBoard[i][j] === number
						? white
						: blue)(number)} `;

					// if the board size is greater than 9, add a space to the number if it is less than 10 to not break the formatting
					if (boardSize > 9 && number < 10) {
						rowString += ` `;
					}
					// add the number to the row string
					rowString += inString;

					// if the number hasn't been placed yet (0), instead of placing a number, place a void
				} else {
					rowString += '   ';
					if (boardSize > 9) rowString += ' ';
				}
			}

			// finalize the divider string and row string
			dividerString += Table.rightMiddle;
			rowString += Table.vertical(true);

			// add the divider string and row string to the output string
			if (i !== 0) outputString.push(dividerString);
			outputString.push(rowString);
		}

		// add the bottom row to the output string
		outputString.push(Table.getBottomRowString(boardSize));

		// if display extra is true, add the extra information to the output string
		if (displayExtra) {
			// add help information
			outputString.push(
				this.leftPad(boardSize) +
					dim(`for help type "${blueBright('help')}"`),
			);
			outputString.push(Table.horizontalDivider(boardSize));

			// add the used numbers information
			outputString.push(
				this.leftPad(boardSize) +
					dim(`${blueBright('blue')} - can still be used`),
			);
			outputString.push(
				dim(
					this.leftPad(boardSize) +
						`${blackBright(
							'grey',
						)} - all values for this number are used`,
				),
			);
			outputString.push(
				usedNumbers.reduce(
					(t, n, i) =>
						t +
						`${(n === boardSize ? blackBright : blue)(
							`${i + 1}`,
						)}   `,
					'    ',
				),
			);
			outputString.push(Table.horizontalDivider(boardSize));
		}

		// return the output string
		return outputString;
	}

	/**
	 * Method to format the welcome message in a format that can be used by Select Menus
	 */
	public static formatWelcomeMessage(): SelectMenuData {
		return {
			title: `Welcome to ${greenBright('Sudoku')}!`,
			preText: ['Select an option below:'],
			options: [
				blueBright('New Game'),
				blueBright('Load Game'),
				blueBright('Exit'),
			],
		};
	}

	/**
	 * Method to format the new game message in a format that can be used by Select Menus
	 */
	public static formatNewGameMessage(): SelectMenuData {
		return {
			title: `New Game`,
			preText: ['Select a board size:'],
			options: [
				`Start a ${blueBright('4x4')} game`,
				`Start a ${blueBright('9x9')} game`,
				`Start a ${blueBright('16x16')} game`,
				`Start a ${blueBright('25x25')} game`,
			],
		};
	}

	/**
	 * Method to format the difficulty message in a format that can be used by Select Menus
	 */
	public static formatDifficultyMessage(): SelectMenuData {
		return {
			title: `Difficulty`,
			preText: ['Select a difficulty level:'],
			options: [
				`Start a ${blueBright('Easy')} game`,
				`Start a ${blueBright('Medium')} game`,
				`Start a ${blueBright('Hard')} game`,
				`Start a ${blueBright('Extreme')} game`,
				`Start a ${blueBright('Impossible')} game`,
				`Start a ${blueBright('Custom')} game`,
			],
		};
	}

	/**
	 * Return a formatted message for the custom difficulty menu
	 * @param max
	 */
	public static formatCustomDifficultyMessage(max: number): string {
		return `Enter how many blank squares you want, between ${blueBright(
			1,
		)} and ${blueBright(max)}:`;
	}

	/**
	 * Method to format the load game message in a format that can be used by Select Menus
	 * @param messages
	 */
	public static formatLoadGameMessage(messages: string[]): SelectMenuData {
		return {
			title: `Load Game`,
			preText: ['Select a game to load:'],
			options: messages,
		};
	}
}
