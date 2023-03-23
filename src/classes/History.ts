/** @format */

import { randomUUID } from 'crypto';
import { Structure } from '../interfaces/Structure.js';

class HistoryTreeNode<T> {
	private readonly _id = randomUUID();
	private readonly _value: T;
	private _parent: HistoryTreeNode<T> | null = null;
	private _children: HistoryTreeNode<T>[] = [];
	public activeIndex = -1;

	constructor(value: T) {
		this._value = value;
	}

	get value(): T {
		return this._value;
	}

	get parent(): HistoryTreeNode<T> | null {
		return this._parent;
	}

	get children(): HistoryTreeNode<T>[] {
		return this._children.slice();
		// return a copy to prevent direct modification
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
}

export class HistoryTree<T> {
	private readonly root: HistoryTreeNode<T>;
	private currentNode: HistoryTreeNode<T>;

	constructor(value: T) {
		this.root = new HistoryTreeNode(value);
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

	undo(): void {
		if (this.currentNode.parent === null) {
			throw new Error('No parent to undo to');
			// Can't undo. Fail?
		} else {
			// put current node in the end.
			this.currentNode.parent.activeIndex = -1;

			this.currentNode = this.currentNode.parent;
		}
	}

	redo(): void {
		if (this.currentNode.children.length === 0) {
			throw new Error('No children to redo to');
			// Can't redo. Fail?
		} else {
			const index = this.currentNode.children.length - 1;
			this.currentNode.activeIndex = index;
			this.currentNode = this.currentNode.children[index];
		}
	}
}
