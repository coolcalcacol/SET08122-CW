/** @format */

import Sudoku from './classes/Sudoku.js';

// only start new game if not a child process
if (process.argv[2] !== 'child') new Sudoku();

// import BoardGenerator from './classes/BoardGenerator.js';
//
// const label = (mode: number) => `Mode ${mode}x${mode} time`;
//
// console.time('Total time');
// console.time(label(9));
//
// for (let i = 0; i < 10000; i++) {
// 	const boardGenerator = new BoardGenerator(9);
// 	await boardGenerator.generate();
// }
// console.timeEnd(label(9));
// console.timeEnd('Total time');

// import solve from './utils/solve.js';
// const board = Array.from(Array(25), () => Array(25).fill(0));
// console.time('Total time');
// solve(board);
// console.timeEnd('Total time');

// const history = new HistoryTree('hello');
// history.addChild('world');
// history.addChild('!');
// history.undo();
// history.addChild('.');
// history.addChild('!');
// history.undo();
// history.redo();
// history.addChild('1');
//
// const tree1 = history.structure;
// console.log(JSON.stringify(history.structure, null, 2));
//
// const tree2 = HistoryTree.fromStructure(tree1);
// console.log(JSON.stringify(tree2.structure, null, 2));
