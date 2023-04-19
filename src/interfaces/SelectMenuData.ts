/** @format */

/**
 * Defines an interface for the data required to create a select menu.
 */
interface SelectMenuData {
	// The title of the menu. If not provided, no title will be displayed.
	readonly title?: string;

	// The text to display before the options. If not provided, no text will be displayed.
	readonly preText?: string[];

	// The options to display in the menu.
	readonly options: string[];

	// The text to display after the options. If not provided, no text will be displayed.
	readonly postText?: string[];
}

export { SelectMenuData };
