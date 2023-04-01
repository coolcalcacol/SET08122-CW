/** @format */

import { randomUUID } from 'crypto';
import { Structure } from '../interfaces/Structure.js';

class HistoryTreeNode<T> {
	private readonly _id: string;
	private readonly _value: T;
	private _parent: HistoryTreeNode<T> | null = null;
	private _children: HistoryTreeNode<T>[] = [];
	public activeIndex = -1;

	constructor(value: T, id?: string) {
		this._value = value;
		this._id = id ?? randomUUID();
	}

	get value(): T {
		return this._value;
	}

	get parent(): HistoryTreeNode<T> | null {
		return this._parent;
	}

	get children(): HistoryTreeNode<T>[] {
		return this._children.slice();
	}

	get structure(): Structure<T> {
		return {
			_id: this._id,
			value: this._value,
			parent: this._parent?._id ?? null,
			activeChild: this.activeIndex,
			children: this._children.map((child) => child.structure),
		};
	}

	addChild(value: T): HistoryTreeNode<T> {
		const child = new HistoryTreeNode(value);
		child._parent = this;
		this._children.push(child);
		this.activeIndex = this.children.length - 1;
		return child;
	}

	addChildrenFromStructure(children: Structure<T>[]): void {
		for (const child of children) {
			const node = HistoryTreeNode.fromStructure(child);
			node._parent = this;
			this._children.push(node);
		}
	}
	static fromStructure<T>(structure: Structure<T>): HistoryTreeNode<T> {
		const node = new HistoryTreeNode(structure.value, structure._id);
		node.addChildrenFromStructure(structure.children);
		node.activeIndex = structure.activeChild;
		return node;
	}
}

export class HistoryTree<T> {
	private readonly root: HistoryTreeNode<T>;
	private currentNode: HistoryTreeNode<T>;

	constructor(value: T, id?: string) {
		this.root = new HistoryTreeNode(value, id || undefined);
		this.currentNode = this.root;
	}

	get current(): T {
		return this.currentNode.value;
	}

	get structure(): Structure<T> {
		return this.root.structure;
	}

	addChild(value: T): HistoryTreeNode<T> {
		const child = this.currentNode.addChild(value);
		this.currentNode = child;
		return child;
	}

	undo(): boolean {
		if (this.currentNode.parent === null) return false;

		// reset currentNode parent's active index to -1, and set currentNode to its parent.
		this.currentNode.parent.activeIndex = -1;
		this.currentNode = this.currentNode.parent;
		return true;
	}

	redo(): boolean {
		if (this.currentNode.children.length === 0) return false;

		// set currentNode's active index to the last child, and set currentNode to that child.
		const index = this.currentNode.children.length - 1;
		this.currentNode.activeIndex = index;
		this.currentNode = this.currentNode.children[index];
		return true;
	}

	static fromStructure<T>(structure: Structure<T>): HistoryTree<T> {
		const tree = new HistoryTree(structure.value, structure._id);
		tree.root.activeIndex = structure.activeChild;
		tree.root.addChildrenFromStructure(structure.children);
		tree.currentNode = tree.root;
		return tree;
	}
}
