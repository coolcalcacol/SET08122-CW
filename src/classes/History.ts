/** @format */

class HistoryTreeNode<T> {
	private readonly _value: T;
	private _parent: HistoryTreeNode<T> | null = null;
	private _children: HistoryTreeNode<T>[] = [];

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

	addChild(value: T): HistoryTreeNode<T> {
		const child = new HistoryTreeNode(value);
		child._parent = this;
		this._children.push(child);
		return child;
	}
}

export class HistoryTree<T> {
	private readonly root: HistoryTreeNode<T>;
	private currentNode: HistoryTreeNode<T>;
	private undoStack: HistoryTreeNode<T>[] = [];
	private redoStack: HistoryTreeNode<T>[] = [];

	constructor(value: T) {
		this.root = new HistoryTreeNode(value);
		this.currentNode = this.root;
	}

	get current(): T {
		return this.currentNode.value;
	}

	addChild(value: T): HistoryTreeNode<T> {
		const child = this.currentNode.addChild(value);
		this.undoStack.push(this.currentNode);
		this.currentNode = child;
		this.redoStack = [];
		return child;
	}

	undo(): void {
		if (this.undoStack.length > 0) {
			const parent = this.undoStack.pop();
			if (parent !== undefined) {
				this.redoStack.push(this.currentNode);
				this.currentNode = parent;
			}
		}
	}

	redo(): void {
		if (this.redoStack.length > 0) {
			const child = this.redoStack.pop();
			if (child !== undefined) {
				this.undoStack.push(this.currentNode);
				this.currentNode = child;
			}
		}
	}
}
