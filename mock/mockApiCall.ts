const fakeApiCall = async (): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, 2000));
};

export default fakeApiCall;
