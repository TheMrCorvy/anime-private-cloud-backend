import { simpleId } from '../src/utils/simpleId';

describe('simpleId', () => {
    it('should generate an ID with default length of 8 characters plus timestamp', () => {
        const id = simpleId();
        
        // Should have format: [8 characters]-[timestamp in base36]
        const parts = id.split('-');
        expect(parts).toHaveLength(2);
        expect(parts[0]).toHaveLength(8);
        expect(parts[1]).toMatch(/^[a-z0-9]+$/); // timestamp in base36
    });

    it('should generate an ID with custom length', () => {
        const customLength = 12;
        const id = simpleId(customLength);
        
        const parts = id.split('-');
        expect(parts[0]).toHaveLength(customLength);
    });

    it('should generate unique IDs on subsequent calls', () => {
        const id1 = simpleId();
        const id2 = simpleId();
        
        expect(id1).not.toBe(id2);
        
        // The random parts should be different
        const parts1 = id1.split('-');
        const parts2 = id2.split('-');
        expect(parts1[0]).not.toBe(parts2[0]);
    });

    it('should contain only valid characters in the random part', () => {
        const id = simpleId();
        const randomPart = id.split('-')[0];
        
        // Should only contain alphanumeric characters
        expect(randomPart).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should have timestamp part that increases over time', async () => {
        const id1 = simpleId();
        
        // Wait a small amount to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 1));
        
        const id2 = simpleId();
        
        const timestamp1 = id1.split('-')[1];
        const timestamp2 = id2.split('-')[1];
        
        // Convert back from base36 to compare
        const time1 = parseInt(timestamp1, 36);
        const time2 = parseInt(timestamp2, 36);
        
        expect(time2).toBeGreaterThanOrEqual(time1);
    });

    it('should handle edge case of length 0', () => {
        const id = simpleId(0);
        
        const parts = id.split('-');
        expect(parts[0]).toHaveLength(0);
        expect(parts[1]).toBeTruthy(); // timestamp should still be there
    });

    it('should handle edge case of length 1', () => {
        const id = simpleId(1);
        
        const parts = id.split('-');
        expect(parts[0]).toHaveLength(1);
        expect(parts[0]).toMatch(/^[A-Za-z0-9]$/);
    });

    it('should handle large lengths', () => {
        const largeLength = 100;
        const id = simpleId(largeLength);
        
        const parts = id.split('-');
        expect(parts[0]).toHaveLength(largeLength);
        expect(parts[0]).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should use all characters from the character set', () => {
        // Generate many IDs to test character distribution
        const ids = Array.from({ length: 1000 }, () => simpleId(50));
        const allRandomParts = ids.map(id => id.split('-')[0]).join('');
        
        // Check that we have uppercase, lowercase, and numbers
        expect(allRandomParts).toMatch(/[A-Z]/);
        expect(allRandomParts).toMatch(/[a-z]/);
        expect(allRandomParts).toMatch(/[0-9]/);
    });

    it('should have consistent format across multiple calls', () => {
        const ids = Array.from({ length: 10 }, () => simpleId());
        
        ids.forEach(id => {
            expect(id).toMatch(/^[A-Za-z0-9]+-[a-z0-9]+$/);
            const parts = id.split('-');
            expect(parts).toHaveLength(2);
        });
    });

    it('should generate IDs with different lengths correctly', () => {
        const lengths = [1, 5, 10, 15, 20, 25];
        
        lengths.forEach(length => {
            const id = simpleId(length);
            const randomPart = id.split('-')[0];
            expect(randomPart).toHaveLength(length);
        });
    });

    it('should have timestamp that represents current time approximately', () => {
        const beforeTime = Date.now();
        const id = simpleId();
        const afterTime = Date.now();
        
        const timestampPart = id.split('-')[1];
        const timestamp = parseInt(timestampPart, 36);
        
        // The timestamp should be between the before and after times
        expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should work correctly with floating point lengths', () => {
        // JavaScript's for loop will use the floating point numbers as-is
        const id1 = simpleId(5.7);
        const id2 = simpleId(5.2);
        
        const parts1 = id1.split('-');
        const parts2 = id2.split('-');
        
        // The actual behavior: for loop runs while i < length, so for both 5.7 and 5.2:
        // i runs: 0, 1, 2, 3, 4, 5 (6 iterations total)
        expect(parts1[0]).toHaveLength(6); // 5.7 -> 6 (loop runs while i < 5.7)
        expect(parts2[0]).toHaveLength(6); // 5.2 -> 6 (loop runs while i < 5.2)
    });

    it('should maintain randomness across different sessions', () => {
        // Generate multiple IDs and ensure they're different
        const ids = new Set();
        const count = 100;
        
        for (let i = 0; i < count; i++) {
            const id = simpleId();
            ids.add(id);
        }
        
        // All IDs should be unique
        expect(ids.size).toBe(count);
    });
});
