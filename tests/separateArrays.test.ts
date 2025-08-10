import separateArrays from '../src/utils/separateArrays';

describe('separateArrays', () => {
    it('should separate array into chunks of specified size', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const chunkSize = 3;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
            [10]
        ]);
    });

    it('should handle exact division', () => {
        const input = ['a', 'b', 'c', 'd', 'e', 'f'];
        const chunkSize = 2;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([
            ['a', 'b'],
            ['c', 'd'],
            ['e', 'f']
        ]);
    });

    it('should handle single element array', () => {
        const input = [42];
        const chunkSize = 3;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([[42]]);
    });

    it('should handle empty array', () => {
        const input: number[] = [];
        const chunkSize = 5;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([]);
    });

    it('should handle chunk size larger than array length', () => {
        const input = [1, 2, 3];
        const chunkSize = 10;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle chunk size of 1', () => {
        const input = ['x', 'y', 'z'];
        const chunkSize = 1;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([['x'], ['y'], ['z']]);
    });

    it('should work with different data types', () => {
        interface TestObject {
            id: number;
            name: string;
        }
        
        const input: TestObject[] = [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Charlie' },
            { id: 4, name: 'David' },
            { id: 5, name: 'Eve' }
        ];
        const chunkSize = 2;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([
            [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
            [{ id: 3, name: 'Charlie' }, { id: 4, name: 'David' }],
            [{ id: 5, name: 'Eve' }]
        ]);
    });

    it('should work with string arrays', () => {
        const input = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape'];
        const chunkSize = 3;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([
            ['apple', 'banana', 'cherry'],
            ['date', 'elderberry', 'fig'],
            ['grape']
        ]);
    });

    it('should not modify the original array', () => {
        const input = [1, 2, 3, 4, 5];
        const originalInput = [...input]; // Create a copy for comparison
        const chunkSize = 2;
        
        const result = separateArrays(input, chunkSize);
        
        expect(input).toEqual(originalInput); // Original should be unchanged
        expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle large arrays efficiently', () => {
        const largeArray = Array.from({ length: 1000 }, (_, i) => i);
        const chunkSize = 100;
        
        const result = separateArrays(largeArray, chunkSize);
        
        expect(result).toHaveLength(10);
        expect(result[0]).toHaveLength(100);
        expect(result[9]).toHaveLength(100);
        expect(result[0][0]).toBe(0);
        expect(result[9][99]).toBe(999);
    });

    it('should handle arrays with null and undefined values', () => {
        const input = [1, null, 3, undefined, 5, null];
        const chunkSize = 2;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([
            [1, null],
            [3, undefined],
            [5, null]
        ]);
    });

    it('should handle mixed data types', () => {
        const input = [1, 'two', true, { id: 4 }, [5, 6], null];
        const chunkSize = 3;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([
            [1, 'two', true],
            [{ id: 4 }, [5, 6], null]
        ]);
    });

    it('should maintain element order within chunks', () => {
        const input = ['first', 'second', 'third', 'fourth', 'fifth'];
        const chunkSize = 3;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result[0]).toEqual(['first', 'second', 'third']);
        expect(result[1]).toEqual(['fourth', 'fifth']);
    });

    it('should work with boolean arrays', () => {
        const input = [true, false, true, true, false, false, true];
        const chunkSize = 3;
        
        const result = separateArrays(input, chunkSize);
        
        expect(result).toEqual([
            [true, false, true],
            [true, false, false],
            [true]
        ]);
    });
});
