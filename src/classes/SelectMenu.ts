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
	private menuSize = 0;
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
		moveCursor(process.stdout, -3, -this.menuSize);
		clearScreenDown(process.stdout);
		this.menuSize = 0;
	};

	private writeMenu = () => {
		const visibleOptions = this.data.options.slice(
			this.selectedIndex - 3 < 0 ? 0 : this.selectedIndex - 3,
			this.selectedIndex + 4 >= this.data.options.length
				? undefined
				: this.selectedIndex + 4,
		);

		if (this.data.title) {
			this.log(Table.horizontalDivider(9));
			this.log(Table.textPad(9, this.data.title));
		}
		if (this.data.preText) {
			this.log(Table.horizontalDivider(9));
			for (const line of this.data.preText)
				this.log(Table.textPad(9, line));
		}

		this.log(Table.horizontalDivider(9));

		if (visibleOptions[0] !== this.data.options[0]) {
			this.log(Table.textPad(9, dim('...')));
		}

		let lastSeen = false;
		for (const [i, line] of this.data.options.entries()) {
			if (!visibleOptions.includes(line)) continue;
			this.log(
				Table.textPad(
					9,
					(i === this.selectedIndex ? inverse : dim)(line),
				),
			);
			if (this.data.options[this.data.options.length - 1] === line)
				lastSeen = true;
		}

		if (!lastSeen) {
			this.log(Table.textPad(9, dim('...')));
		}

		this.log(Table.horizontalDivider(9));

		if (this.data.postText) {
			for (const line of this.data.postText)
				this.log(Table.textPad(9, line));
			this.log(Table.horizontalDivider(9));
		}
	};
	private rewriteMenu = () => {
		this.clearMenu();
		this.writeMenu();
	};

	private log = (message: string) => {
		this.menuSize++;
		console.log(message);
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
