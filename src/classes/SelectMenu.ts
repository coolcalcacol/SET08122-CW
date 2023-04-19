/** @format */

import {
	clearLine,
	clearScreenDown,
	createInterface,
	emitKeypressEvents,
	Key,
	moveCursor,
} from 'readline';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import Table from './Table.js';
import { SelectMenuData } from '../interfaces/SelectMenuData.js';

/**
 * extract the chalk colours I use
 */
const { inverse, dim } = chalk;

/**
 * allows for keypress events to be emitted from stdin
 */
emitKeypressEvents(process.stdin);

/**
 * Defines a class for a select menu.
 */
export default class SelectMenu extends EventEmitter {
	// the data for the menu
	private readonly data: SelectMenuData;

	// the index of the selected option
	private selectedIndex = 0;

	// the size of the menu
	private menuSize = 0;

	/**
	 * creates a new select menu, and displays it
	 * @param data the data for the menu
	 * @param selectedIndex the index of the selected option
	 */
	constructor(data: SelectMenuData, selectedIndex?: number) {
		super();
		// set the data
		this.data = data;

		// if a selected index was provided, set it
		if (selectedIndex) this.selectedIndex = selectedIndex;

		// set up stdin to listen for keypress events
		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.on('keypress', this.handleSelectMenuKeypress);

		// display the menu
		this.writeMenu();
	}

	/**
	 * handles keypress events for the select menu
	 * @param _ Unused
	 * @param key the key that was pressed
	 */
	private handleSelectMenuKeypress = (_: string, key?: Key) => {
		if (key !== undefined) {
			// get the maximum index
			const maxIndex = this.data.options.length - 1;

			// handle the keypress
			switch (key.name) {
				case 'up':
					// move the selected index up, or if already at the top of the menu, to the bottom
					this.selectedIndex =
						this.selectedIndex === 0
							? maxIndex
							: this.selectedIndex - 1;

					// rewrite the menu
					this.rewriteMenu();
					break;
				case 'down':
					// move the selected index down, or if already at the bottom of the menu, to the top
					this.selectedIndex =
						this.selectedIndex === maxIndex
							? 0
							: this.selectedIndex + 1;

					// rewrite the menu
					this.rewriteMenu();
					break;
				case 'return':
					// remove the keypress listener
					process.stdin.off(
						'keypress',
						this.handleSelectMenuKeypress,
					);
					process.stdin.setRawMode(false);
					process.stdin.pause();

					// clear the menu
					this.clearMenu();

					// emit the select event, to tell the program that an option has been selected
					this.emit('select', this.selectedIndex);
					return;
				case 'escape':
					// remove the keypress listener
					process.stdin.off(
						'keypress',
						this.handleSelectMenuKeypress,
					);
					process.stdin.setRawMode(false);
					process.stdin.pause();

					// clear the menu
					this.clearMenu();

					// exit the program
					process.exit(0);
					return;
			}
		}
	};

	/**
	 * resets the cursor position and clears the menu
	 */
	private clearMenu = () => {
		moveCursor(process.stdout, -3, -this.menuSize);
		clearScreenDown(process.stdout);
		this.menuSize = 0;
	};

	/**
	 * writes the menu to the console
	 */
	private writeMenu = () => {
		// get the visible options
		const visibleOptions = this.data.options.slice(
			this.selectedIndex - 3 < 0 ? 0 : this.selectedIndex - 3,
			this.selectedIndex + 4 >= this.data.options.length
				? undefined
				: this.selectedIndex + 4,
		);

		// if a title was provided, display it
		if (this.data.title) {
			this.log(Table.horizontalDivider(9));
			this.log(Table.textPad(9, this.data.title));
		}

		// if pre-text was provided, display it
		if (this.data.preText) {
			this.log(Table.horizontalDivider(9));
			for (const line of this.data.preText)
				this.log(Table.textPad(9, line));
		}

		// display a divider
		this.log(Table.horizontalDivider(9));

		// if the first option is not visible, display an ellipsis
		if (visibleOptions[0] !== this.data.options[0]) {
			this.log(Table.textPad(9, dim('...')));
		}

		// display the options
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

		// if the last option is not visible, display an ellipsis
		if (!lastSeen) {
			this.log(Table.textPad(9, dim('...')));
		}

		// display a divider
		this.log(Table.horizontalDivider(9));

		// if post-text was provided, display it
		if (this.data.postText) {
			for (const line of this.data.postText)
				this.log(Table.textPad(9, line));
			this.log(Table.horizontalDivider(9));
		}
	};

	/**
	 * clears the menu and rewrites it
	 */
	private rewriteMenu = () => {
		this.clearMenu();
		this.writeMenu();
	};

	/**
	 * helper method that allows for keeping track of the size of the menu
	 * @param message the message to log
	 */
	private log = (message: string) => {
		this.menuSize++;
		console.log(message);
	};

	/**
	 * resets the cursor position and clears the current line
	 */
	private static resetLine = () => {
		moveCursor(process.stdout, -3, -1);
		clearLine(process.stdout, 0);
	};

	/**
	 * prompts the user for a number input
	 * @param message the message to display
	 * @param min the minimum number
	 * @param max the maximum number
	 */
	public static promptNumberInput = async (
		message: string,
		min: number,
		max: number,
	): Promise<number> => {
		// create a readline interface
		const rl = createInterface(process.stdin, process.stdout);

		// wait for the user to input a number and return it
		const res = await new Promise<number>((resolve) => {
			// set the prompt and send it.
			rl.setPrompt(dim(message + ' '));
			rl.prompt();

			// listen for the user to input a number
			rl.on('line', (line) => {
				// if the input is not a number, or is not within the range, prompt again
				const num = Number(line);
				SelectMenu.resetLine();
				if (isNaN(num) || num < min || num > max) rl.prompt();
				// otherwise, resolve the promise
				else resolve(num);
			}).on('SIGINT', () => rl.pause());
		});

		// close the readline interface and return the result
		rl.close();
		return res;
	};
}
