/** @format */

export interface Structure<T> {
	_id: string;
	value: T;
	parent: string | null;
	activeChild: number;
	children: Structure<T>[];
}
