/** @format */

class HistoryTreeNode {
	private _id = -1;
	private state = '';
	private father: HistoryTreeNode | null = null;
	private children: HistoryTreeNode[] = [];
	private activeIndex = -1;

	getId(): number {
		return this._id;
	}

	setId(id: number): this {
		this._id = id;
		return this;
	}

	getState(): string {
		return this.state;
	}

	setState(state: string): this {
		this.state = state;
		return this;
	}

	getFather(): HistoryTreeNode | null {
		return this.father;
	}

	setFather(father: HistoryTreeNode | null): this {
		this.father = father;
		return this;
	}

	addChild(child: HistoryTreeNode): this {
		this.children.push(child);
		this.activeIndex = this.children.length - 1;
		return this;
	}

	getChildren(): HistoryTreeNode[] {
		return this.children;
	}

	getActiveIndex(): number {
		return this.activeIndex;
	}

	setActiveIndex(activeIndex: number): this {
		this.activeIndex = activeIndex;
		return this;
	}

	getActiveNode(): HistoryTreeNode | null {
		if (this.activeIndex === -1) {
			return null;
		}
		return this.children[this.activeIndex];
	}

	getStructure(): Record<string, any> {
		const structure: Record<string, any> = {
			id: this._id,
			state: this.state,
			active: this.activeIndex,
			father: null,
			children: [],
		};
		if (this.father !== null) {
			structure.father = this.father.getId();
		}
		for (const child of this.children) {
			structure.children.push(child.getStructure());
		}
		return structure;
	}

	getPath(): number[] {
		let path: number[] = [];
		path.push(this._id);

		if (this.activeIndex !== -1) {
			path = path.concat(this.children[this.activeIndex].getPath());
		}

		return path;
	}

	countLeaves(): number {
		let count = 0;
		if (this.children.length === 0) {
			count = 1;
		} else {
			for (const child of this.children) {
				count += child.countLeaves();
			}
		}
		return count;
	}

	maxDepth(): number {
		let depth = 1;
		if (this.children.length !== 0) {
			let childrenMaxDepth = 1;
			for (const child of this.children) {
				const childrenDepth = child.maxDepth();
				if (childrenDepth > childrenMaxDepth) {
					childrenMaxDepth = childrenDepth;
				}
			}
			depth += childrenMaxDepth;
		}
		return depth;
	}
}

class HistoryTree {
	private root: HistoryTreeNode | null = null;
	private activeNode: HistoryTreeNode | null = null;

	getRoot(): HistoryTreeNode | null {
		return this.root;
	}

	setRoot(root: HistoryTreeNode): this {
		this.root = root;
		this.activeNode = root;
		return this;
	}

	getActiveNode(): HistoryTreeNode | null {
		return this.activeNode;
	}

	setActiveNode(activeNode: HistoryTreeNode): this {
		this.activeNode = activeNode;
		return this;
	}

	undo(): HistoryTreeNode | null {
		if (this.activeNode === null || this.activeNode.getFather() === null) {
			return null;
		}
		this.activeNode = this.activeNode.getFather();
		return this.activeNode;
	}

	redo(): HistoryTreeNode | null {
		if (
			this.activeNode === null ||
			this.activeNode.getChildren().length === 0
		) {
			return null;
		}
		this.activeNode = this.activeNode.getActiveNode();
		return this.activeNode;
	}
}
