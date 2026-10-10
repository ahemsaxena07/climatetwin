import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';


async function testChat() {
  console.log("🚀 Starting Bedrock Connection Test...");

  // 1. Initialize Client
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    ...("ABSKTWFudGxlQXBpS2V5LWlvbG4yMnM1LWF0LTQyMTE1MzEzNTMzOTorbEtwZ3ZoT3pxVU00OGtsb0g0d0UyYzN4MDNzVzVIN1VjbTBqK1NXbVhPNFpyTDZjQU9RZ3h2NkhPWT0="
      ? {
          token: { token: "ABSKTWFudGxlQXBpS2V5LWlvbG4yMnM1LWF0LTQyMTE1MzEzNTMzOTorbEtwZ3ZoT3pxVU00OGtsb0g0d0UyYzN4MDNzVzVIN1VjbTBqK1NXbVhPNFpyTDZjQU9RZ3h2NkhPWT0=" },
          authSchemePreference: ['httpBearerAuth'],
        }
      : {}),
  });

  // 2. Define the Model ID (Use a known working ID from your .env)
  const modelId = 'google.gemma-4-31b'
  
  console.log(`🤖 Testing Model: ${modelId}`);
  console.log(`🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);

  try {
    // 3. Send a simple Converse command
    const command = new ConverseCommand({
      modelId: modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Hello! If you can read this, respond with "Bedrock is working!" and a short joke about architects.' }],
        },
      ],
      inferenceConfig: {
        maxTokens: 512,
        temperature: 0.5,
      },
    });

    const response = await client.send(command);
    
    // 4. Extract the text response
    const responseText = response.output?.message?.content?.[0]?.text;

    if (responseText) {
      console.log("\n✅ SUCCESS!");
      console.log("--------------------------------------------------");
      console.log("Response:", responseText);
      console.log("--------------------------------------------------");
    } else {
      console.log("\n⚠️ Received a response, but it was empty.");
    }
  } catch (error) {
    console.error("\n❌ ERROR DETECTED:");
    
    if (error.name === 'AccessDeniedException' || error.message.includes('AccessDenied')) {
      console.error("👉 ERROR: Model Access Denied. You must enable this model in the AWS Console -> Bedrock -> Model Access.");
    } else if (error.message.includes('invalid')) {
      console.error("👉 ERROR: Invalid Model ID. Check if the model ID exists in your current region.");
    } else if (error.name === 'CredentialsProviderError' || error.message.includes('credentials')) {
      console.error("👉 ERROR: AWS Credentials not found. Check your .env or AWS CLI config.");
    } else {
      console.error("👉 Full Error:", error);
    }
    process.exit(1);
  }
}

testChat();