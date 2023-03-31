/** @format */

import chalk from 'chalk';
import { SelectMenuData } from './SelectMenu.js';

const { black, blackBright, greenBright, dim, blue, blueBright, white } = chalk;

export default class Table {
	// top elements
	private static topLeft = black('┌');
	private static topMiddle = black('┬');
	private static topRight = black('┐');
	// middle elements
	private static leftMiddle = black('├');
	private static middleMiddle = (major: boolean) =>
		(major ? black : blackBright)('┼');
	private static rightMiddle = black('┤');
	// bottom elements
	private static bottomLeft = black('└');
	private static bottomMiddle = black('┴');
	private static bottomRight = black('┘');
	// line elements
	private static horizontal = (major: boolean) =>
		(major ? black : blackBright)('─');
	private static vertical = (major: boolean) =>
		(major ? black : blackBright)('│');
	// padding
	private static padSize = (boardSize: number) => (boardSize > 9 ? 4 : 3);
	private static leftPad = (boardSize: number) =>
		' '.repeat(this.padSize(boardSize) - 1);
	private static horizontalPad = (boardSize: number, horizontal = true) =>
		this.horizontal(horizontal).repeat(this.padSize(boardSize));

	public static textPad = (boardSize: number, text: string) =>
		`${this.leftPad(boardSize)} ${text}`;

	//TODO: Fix this method
	public static horizontalDivider = (boardSize: number) =>
		this.leftPad(boardSize) +
		this.horizontalPad(boardSize).repeat(boardSize);

	private static getTopRowString(boardSize: number): [string, string] {
		const horizontalPad = Table.horizontalPad(boardSize);
		const letterRow = Array.from(
			Array(boardSize),
			(_, i) => Table.leftPad(boardSize) + String.fromCharCode(65 + i),
		).join(' ');
		const topRowMiddle = `${`${horizontalPad}${Table.topMiddle}`.repeat(
			boardSize - 1,
		)}${horizontalPad}`;
		const topRow = `${Table.topLeft}${topRowMiddle}${Table.topRight}`;

		return [
			`${Table.leftPad(boardSize)}${letterRow}`,
			`${Table.leftPad(boardSize)}${topRow}`,
		];
	}
	private static getBottomRowString(boardSize: number): string {
		const horizontalPad = Table.horizontalPad(boardSize);
		const bottomRowMiddle = `${`${horizontalPad}${Table.bottomMiddle}`.repeat(
			boardSize - 1,
		)}${horizontalPad}`;
		const bottomRow = `${Table.bottomLeft}${bottomRowMiddle}${Table.bottomRight}`;
		return `${Table.leftPad(boardSize)}${bottomRow}`;
	}
	public static format(
		currentBoard: number[][],
		initialBoard: number[][],
		displayExtra = true,
	): string[] {
		const outputString = [];
		const boardSize = currentBoard.length;
		outputString.push(...Table.getTopRowString(boardSize));

		const usedNumbers = Array.from(Array(boardSize).fill(0));

		for (const [i, tableDataRow] of currentBoard.entries()) {
			const isMajorRow = i % Math.sqrt(boardSize) === 0;
			let dividerString = `${Table.leftPad(boardSize)}${
					Table.leftMiddle
				}${Table.horizontalPad(boardSize, isMajorRow)}`,
				rowString =
					boardSize > 9 ? `${i + 1} `.padStart(3, ' ') : `${i + 1} `;

			for (const [j, number] of tableDataRow.entries()) {
				const isMajorCol = j % Math.sqrt(boardSize) === 0;
				usedNumbers[number - 1]++;

				if (j !== 0)
					dividerString +=
						Table.middleMiddle(isMajorCol || isMajorRow) +
						Table.horizontalPad(boardSize, isMajorRow);

				rowString += Table.vertical(isMajorCol);
				if (number !== 0) {
					const inString = ` ${(initialBoard[i][j] === number
						? white
						: blue)(number)} `;
					if (boardSize > 9 && number < 10) {
						rowString += ` ${inString}`;
					} else {
						rowString += inString;
					}
				} else {
					rowString += '   ';
					if (boardSize > 9) rowString += ' ';
				}
			}
			dividerString += Table.rightMiddle;
			rowString += Table.vertical(true);

			if (i !== 0) outputString.push(dividerString);
			outputString.push(rowString);
		}
		outputString.push(Table.getBottomRowString(boardSize));
		if (displayExtra) {
			outputString.push(
				this.leftPad(boardSize) +
					dim(`for help type "${blueBright('help')}"`),
			);
			outputString.push(Table.horizontalDivider(boardSize));
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

		return outputString;
	}
	public static formatWelcomeMessage(): SelectMenuData {
		return {
			title: `Welcome to ${greenBright('Sudoku')}!`,
			preText: ['Select an option below:'],
			options: [
				`To start a game type ${blueBright('new')}`,
				`To load a game type ${blueBright('load')}`,
				`To exit type ${blueBright('exit')}`,
			],
		};
	}

	// New Game Menu

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

	public static formatCustomDifficultyMessage(max: number): string {
		return `Enter how many blank squares you want, between ${blueBright(
			1,
		)} and ${blueBright(max)}:`;
	}

	// Load Game Menu

	public static formatLoadGameMessage(messages: string[]): SelectMenuData {
		return {
			title: `Load Game`,
			preText: ['Select a game to load:'],
			options: messages,
		};
	}
}
