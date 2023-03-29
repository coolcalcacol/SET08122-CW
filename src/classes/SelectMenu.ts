/** @format */
import {
	clearLine,
	clearScreenDown,
	createInterface,
	emitKeypressEvents,
	Key,
	moveCursor,
} from 'readline';
import * as process from 'process';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import Table from './Table.js';

const { inverse, dim } = chalk;

export interface SelectMenuData {
	readonly title?: string;
	readonly preText?: string[];
	readonly options: string[];
	readonly postText?: string[];
}

//TODO: This could have SubMenus maybe, allowing the user to go back and forward between stages of selection?
//TODO: Look into limiting the number of shown options if options length is greater than a certain number

emitKeypressEvents(process.stdin);
export default class SelectMenu extends EventEmitter {
	private readonly data: SelectMenuData;

	private selectedIndex = 0;
	constructor(data: SelectMenuData, selectedIndex?: number) {
		super();
		this.data = data;
		if (selectedIndex) this.selectedIndex = selectedIndex;

		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.on('keypress', this.handleSelectMenuKeypress);
		this.writeMenu();
	}

	private handleSelectMenuKeypress = (str: string, key?: Key) => {
		if (key !== undefined) {
			const maxIndex = this.data.options.length - 1;
			switch (key.name) {
				case 'up':
					this.selectedIndex =
						this.selectedIndex === 0
							? maxIndex
							: this.selectedIndex - 1;
					this.rewriteMenu();
					break;
				case 'down':
					this.selectedIndex =
						this.selectedIndex === maxIndex
							? 0
							: this.selectedIndex + 1;
					this.rewriteMenu();
					break;
				case 'return':
					process.stdin.off(
						'keypress',
						this.handleSelectMenuKeypress,
					);
					process.stdin.setRawMode(false);
					process.stdin.pause();
					this.clearMenu();
					this.emit('select', this.selectedIndex);
					return;
				case 'escape':
					process.stdin.off(
						'keypress',
						this.handleSelectMenuKeypress,
					);
					process.stdin.setRawMode(false);
					process.stdin.pause();
					this.clearMenu();
					process.exit(0);
					return;
			}
		}
	};

	private clearMenu = () => {
		let messageLength = 0;
		// Header border and title message
		if (this.data.title) messageLength += 2;

		// Border and preText
		if (this.data.preText) messageLength += this.data.preText.length + 1;

		// Top and Bottom border and options
		messageLength += this.data.options.length + 2;

		// Footer border and postText
		if (this.data.postText) messageLength += this.data.postText.length + 1;

		moveCursor(process.stdout, -3, -messageLength);
		clearScreenDown(process.stdout);
	};

	private writeMenu = () => {
		if (this.data.title) {
			console.log(Table.horizontalDivider(9));
			console.log(Table.textPad(9, this.data.title));
		}
		if (this.data.preText) {
			console.log(Table.horizontalDivider(9));
			for (const line of this.data.preText)
				console.log(Table.textPad(9, line));
		}

		console.log(Table.horizontalDivider(9));
		for (const [i, line] of this.data.options.entries())
			console.log(
				Table.textPad(
					9,
					(i === this.selectedIndex ? inverse : dim)(line),
				),
			);
		console.log(Table.horizontalDivider(9));

		if (this.data.postText) {
			for (const line of this.data.postText)
				console.log(Table.textPad(9, line));
			console.log(Table.horizontalDivider(9));
		}
	};
	private rewriteMenu = () => {
		this.clearMenu();
		this.writeMenu();
	};

	private static resetLine = () => {
		moveCursor(process.stdout, -3, -1);
		clearLine(process.stdout, 0);
	};

	public static promptNumberInput = async (
		message: string,
		min: number,
		max: number,
	): Promise<number> => {
		const rl = createInterface(process.stdin, process.stdout);
		const res = await new Promise<number>((resolve) => {
			rl.setPrompt(dim(message + ' '));
			rl.prompt();

			rl.on('line', (line) => {
				const num = Number(line);
				SelectMenu.resetLine();
				if (isNaN(num) || num < min || num > max) rl.prompt();
				else {
					resolve(num);
				}
			}).on('SIGINT', () => rl.pause());
		});

		rl.close();
		return res;
	};
}
