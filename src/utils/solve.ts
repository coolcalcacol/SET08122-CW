/** @format */

const isValid = (
	board: number[][],
	row: number,
	col: number,
	value: number,
): boolean => {
	const subgridSize = Math.sqrt(board.length);
	for (let i = 0; i < board.length; i++) {
		if (board[row][i] === value) return false;
		if (board[i][col] === value) return false;
	}

	const subgridRow = row - (row % subgridSize);
	const subgridCol = col - (col % subgridSize);

	for (let i = subgridRow; i < subgridRow + subgridSize; i++) {
		for (let j = subgridCol; j < subgridCol + subgridSize; j++) {
			if (board[i][j] === value) return false;
		}
	}

	return true;
};

const shuffle = <T>(array: T[]) => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
};

const getValidValues = (
	board: number[][],
	row: number,
	col: number,
): number[] => {
	const values: number[] = Array.from(
		{ length: board.length },
		(_, i) => i + 1,
	);

	for (const value of values) {
		if (!isValid(board, row, col, value)) {
			values.splice(values.indexOf(value), 1);
		}
	}

	return values;
};

const findNextEmpty = (board: number[][]): { row: number; col: number } => {
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board.length; col++) {
			if (board[row][col] === 0) return { row, col };
		}
	}

	return { row: -1, col: -1 };
};

const fillDiagonals = (board: number[][]) => {
	const size = board.length;
	const subgridSize = Math.sqrt(board.length);
	for (let i = 0; i < size; i += subgridSize) {
		const values = Array.from({ length: size }, (_, i) => i + 1);
		shuffle(values);
		for (let j = 0; j < subgridSize; j++) {
			for (let k = 0; k < subgridSize; k++) {
				board[i + j][i + k] = values[j * subgridSize + k];
			}
		}
	}
};
const solve = (board: number[][]) => {
	if (board.every((row) => row.every((v) => v !== 0))) return true;

	const { row, col } = findNextEmpty(board);
	if (row === -1 && col === -1) return false;

	const candidates = getValidValues(board, row, col);
	shuffle(candidates);

	for (const value of candidates) {
		if (!isValid(board, row, col, value)) continue;

		board[row][col] = value;

		if (solve(board)) return true;
		board[row][col] = 0;
	}

	return false;
};

process.on('message', ({ board }: { board: number[][] }) => {
	fillDiagonals(board);
	const solvedBoard = solve(board);
	if (solvedBoard) process.send?.(board);
});
