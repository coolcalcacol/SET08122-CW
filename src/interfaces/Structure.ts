/** @format */

/**
 * A recursive data structure that represents a tree.
 * @template T The type of the value stored in the tree.
 */
interface Structure<T> {
	// Unique identifier of the structure.
	_id: string;

	// Value associated with the structure.
	value: T;

	// Identifier of the parent structure, or null if the structure has no parent.
	parent: string | null;

	// Index of the active child of the structure.
	activeChild: number;

	// Array of child structures.
	children: Structure<T>[];
}

export { Structure };
