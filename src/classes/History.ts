/** @format */

import { randomUUID } from 'crypto';
import { Structure } from '../interfaces/Structure.js';

/**
 * Defines a class for a node in a history tree.
 */
class HistoryTreeNode<T> {
	// Unique identifier of the node.
	private readonly _id: string;

	// Value associated with the node.
	private readonly _value: T;

	// Parent of the node, or null if the node has no parent.
	private _parent: HistoryTreeNode<T> | null = null;

	// Array of child nodes.
	private _children: HistoryTreeNode<T>[] = [];

	// Index of the active child of the node.
	public activeIndex = -1;

	/**
	 * Creates a new `HistoryTreeNode` instance with the given value and identifier.
	 * @param value The value to store in the node.
	 * @param id The unique identifier of the node. Generated if not provided.
	 */
	constructor(value: T, id?: string) {
		this._value = value;
		this._id = id ?? randomUUID();
	}

	/**
	 * Returns the value stored in the node.
	 */
	get value(): T {
		return this._value;
	}

	/**
	 * Returns the parent of the node, or null if the node has no parent.
	 */
	get parent(): HistoryTreeNode<T> | null {
		return this._parent;
	}

	/**
	 * Returns the children of the node.
	 */
	get children(): HistoryTreeNode<T>[] {
		return this._children.slice();
	}

	/**
	 * returns the structure of the node as a `Structure` object.
	 */
	get structure(): Structure<T> {
		return {
			_id: this._id,
			value: this._value,
			parent: this._parent?._id ?? null,
			activeChild: this.activeIndex,
			children: this._children.map((child) => child.structure),
		};
	}

	/**
	 * Adds a child to the node with the given value.
	 * @param value The value to store in the child node.
	 */
	public addChild(value: T): HistoryTreeNode<T> {
		// create a new child node with the given value, set its parent to this node, and add it to the children array.
		const child = new HistoryTreeNode(value);
		child._parent = this;
		this._children.push(child);

		// set the active index to the index of the new child.
		this.activeIndex = this.children.length - 1;

		// return the new child node.
		return child;
	}

	/**
	 * Adds children to the node from the given structure.
	 * @param children The structure to add children from.
	 */
	addChildrenFromStructure(children: Structure<T>[]): void {
		// for each child in the structure, create a new node from the structure, set its parent to this node, and add it to the children array.
		for (const child of children) {
			const node = HistoryTreeNode.fromStructure(child);
			node._parent = this;
			this._children.push(node);
		}
	}

	/**
	 * Creates a new `HistoryTreeNode` instance from the given structure.
	 * @param structure The structure to create the node from.
	 */
	private static fromStructure<T>(
		structure: Structure<T>,
	): HistoryTreeNode<T> {
		// create a new node with the value and id from the structure, and add its children from the structure.
		const node = new HistoryTreeNode(structure.value, structure._id);
		node.addChildrenFromStructure(structure.children);

		// set the active index to the active child index from the structure.
		node.activeIndex = structure.activeChild;

		// return the new node.
		return node;
	}
}

/**
 * Defines a class for a history tree.
 */
export class HistoryTree<T> {
	// Root node of the tree.
	private readonly root: HistoryTreeNode<T>;

	// Current node of the tree.
	private currentNode: HistoryTreeNode<T>;

	/**
	 * Creates a new `HistoryTree` instance with the given value and identifier.
	 * @param value The value to store in the root node.
	 * @param id The unique identifier of the root node. Generated if not provided.
	 */
	constructor(value: T, id?: string) {
		// create a new root node with the given value and id, and set the current node to the root.
		this.root = new HistoryTreeNode(value, id || undefined);
		this.currentNode = this.root;
	}

	/**
	 * Returns the value stored in the current node.
	 */
	get current(): T {
		return this.currentNode.value;
	}

	/**
	 * Returns the structure of the tree from the root node as a `Structure` object.
	 */
	get structure(): Structure<T> {
		return this.root.structure;
	}

	/**
	 * Adds a child to the current node with the given value, and sets the current node as itself.
	 * @param value The value to store in the child node.
	 */
	public addChild(value: T): HistoryTreeNode<T> {
		// add a child to the current node with the given value, and set the current node to the new child.
		const child = this.currentNode.addChild(value);
		this.currentNode = child;

		// return the new child node.
		return child;
	}

	/**
	 * Undoes the last action, and sets the current node to its parent.
	 */
	public undo(): boolean {
		// if the current node has no parent, return false.
		if (this.currentNode.parent === null) return false;

		// reset currentNode parent's active index to -1, and set currentNode to its parent.
		this.currentNode.parent.activeIndex = -1;
		this.currentNode = this.currentNode.parent;

		// the action was successful, so return true.
		return true;
	}

	/**
	 * Redoes the last undone action, and sets the current node to its child.
	 */
	public redo(): boolean {
		// if the current node has no children, return false.
		if (this.currentNode.children.length === 0) return false;

		// set currentNode's active index to the last child, and set currentNode to that child.
		const index = this.currentNode.children.length - 1;
		this.currentNode.activeIndex = index;
		this.currentNode = this.currentNode.children[index];

		// the action was successful, so return true.
		return true;
	}

	/**
	 * Creates a new `HistoryTree` instance from the given structure.
	 * @param structure The structure to create the tree from.
	 */
	public static fromStructure<T>(structure: Structure<T>): HistoryTree<T> {
		// create a new tree with the value and id from the structure, and add its children from the structure.
		const tree = new HistoryTree(structure.value, structure._id);
		tree.root.activeIndex = structure.activeChild;
		tree.root.addChildrenFromStructure(structure.children);

		// set the current node to the root.
		tree.currentNode = tree.root;

		// return the new tree.
		return tree;
	}
}
