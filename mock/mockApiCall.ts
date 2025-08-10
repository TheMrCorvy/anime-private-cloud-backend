const fakeApiCall = async (time = 1000): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, time * 1000));
};

export default fakeApiCall;
