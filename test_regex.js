const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

const testCases = [
    'Teste1234',
    'Test1234',
    'Teste123',
    'test1234',
    '12345678',
    'TESTE1234'
];

testCases.forEach(password => {
    console.log(`${password}: ${passwordRegex.test(password)}`);
});
