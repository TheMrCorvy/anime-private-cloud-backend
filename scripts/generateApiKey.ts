import { generateApiKeyWithPrefix } from '../src/services/apiKeyService';

const main = async () => {
    const args = process.argv.slice(2);
    const prefix = args[0] || 'apc_';
    const length = parseInt(args[1]) || 32;

    console.log('🔑 Generating API Key...\n');

    try {
        const apiKey = await generateApiKeyWithPrefix(prefix, length);

        console.log('✅ API Key generated successfully!\n');
        console.log('📋 Details:');
        console.log(`   Key:     ${apiKey.key}`);
        console.log(`   Hash:      ${apiKey.hash}`);
        console.log(`   Created:    ${apiKey.createdAt.toISOString()}\n`);
        console.log('⚠️  Important:');
        console.log('   - Save this key in a safe place');
        console.log('   - Use the hash for verification in the database');
        console.log('   - The key CANNOT be recovered once lost\n');
        console.log('💡 Example to use in your application:');
        console.log(`   process.env.API_KEY = "${apiKey.key}"`);
        console.log(`   // Hash to store on DB: "${apiKey.hash}"\n`);
    } catch (error) {
        console.error('❌ Error generating the API key:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    main();
}
