describe('Sample Test Suite', () => {
  test('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle string operations', () => {
    const greeting = 'Hello World';
    expect(greeting).toContain('World');
    expect(greeting).toHaveLength(11);
  });

  test('should work with async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});
