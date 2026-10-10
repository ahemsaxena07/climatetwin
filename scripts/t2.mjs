/**
 * 
set "OPENAI_API_KEY=bedrock-api-key-YmVkcm9jay5hbWF6b25hd3MuY29tLz9BY3Rpb249Q2FsbFdpdGhCZWFyZXJUb2tlbiZYLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFTSUFXRURWTzNMVldPMlE3SlVUJTJGMjAyNjEwMTAlMkZ1cy1lYXN0LTElMkZiZWRyb2NrJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjEwMTBUMTAzOTQ4WiZYLUFtei1FeHBpcmVzPTQzMjAwJlgtQW16LVNlY3VyaXR5LVRva2VuPUlRb0piM0pwWjJsdVgyVmpFSXYlMkYlMkYlMkYlMkYlMkYlMkYlMkYlMkYlMkYlMkZ3RWFDWFZ6TFdWaGMzUXRNU0pGTUVNQ0h4dVdCZ3UwYXhwMVVabE1yJTJCJTJGa0xHMjl4amNveCUyRk9HaXJoUEVJZVdtRDRDSUg3bWlzODA4eEJGWXFaTDRmTGppTEdOJTJCYktOSXdvYSUyQlJ0bEVubkN3MklRS3VBQ0NGUVFBQm9NTkRJeE1UVXpNVE0xTXpNNUlneTg2V3VaaFE0bldpbndDNVFxdlFMTFAyVmFLNDN5bUliVkFaRzdKNm5FaTcyWjA5aHh1b0M4VzVYTTRHa1o3enR0R1FFa0FycFFudHp6JTJGWHliJTJCJTJGNU5KSjIlMkZYRjZlUjNFb084RlYzeDI2QVltYjJ4TVV5aCUyRkxPajNiT2hwd200cmhQU05oQTBBQWo4WkNxVDZzVTIlMkJTZzlkN1IzcHU5bjBmaHdUMVBoWFkxYlhYVEJnTWJJc2gzcDFETlBFYzE1aUEwUHl0clhYVGw1QXMlMkJyNU03OHpTS2FsRlQlMkZYTUZLbjlwQVJwQUhZSFIwVnk5dUJTaHZZYmNJS1M3RHVaeWhsUGtzTVV4V0x4aFFpYTljMnIzMUZkUWRFRlIybnh1OFBuUkdBUm95T0h1S1J5a0JXQmFsNUpvemdNckZaTEtkeGprZEFyUFo0d09iVjJCcGhCd01HOEZ4cE1vUiUyRkVEM0RjeFNBNWlPOEtBVEd3d2tzOEolMkZDeEhqY2E3Z3EySUVQT1RyOURGbXlNMnIlMkZEV1lnZUhlYW54NHVjN3JCaG9iSTVSV1RaNVklMkZDMkM3ekREJTJGRGU2NCUyQnJLWHJsekNmbDZqV0JqcVJBalBxVFRxJTJGRnIlMkZzVHB5T3R1VXRCbDhiTzZ0WXJvMVozTVd3NyUyRmsyMnJwRVZZV3hydzVIVVR6JTJCS1BLOTljeXE1MnFZRlo3OTRxemhMajdraWoySnJwJTJGQjZ2NTZhNEVzbmVzcGNDTFBXN2RFVWltQ2dseFBEUHJoSkpoNngwWG1qU3o5V0s5NUFuWlpwTkp1ODVmTmJUVkJaUzFxOUUzVklQMzE2MXRSTCUyQlhZa3hUbjdzZFZ0cDBPUlZjRDVLYlRGSzZXZjFpUFhkelkzbHc0RG5YdlhEb00yd0EwYUVNbmdJUVNoa2tLUzBWQ3gyTnJRSDNMWGRObENvd0thcEwwTmdvZG9qV01CbjFLOSUyRmdRRDF1aFNkaWtSJTJGaXBzWXR4cWlGdW1iWHNLUnBFVkxpN1VYUFZwN1Fmc2lWcm9ibXlBbTlETURkNFI2OFhEcHhLSW5yYlBYY1JFJTJGeFpZWThra1Q1WXNyd2I4TkgyelElM0QlM0QmWC1BbXotU2lnbmF0dXJlPTdhZWUzODUxZTMxMjVkMTg0NDA0ZWE1YWY1N2RiYjEzZWZjMWMzMmUyY2M5YmQyNmYyYmYxNGQ3ZjVmNTBjY2UmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JlZlcnNpb249MQ=="
set "OPENAI_BASE_URL=https://bedrock-mantle.us-east-1.api.aws/v1"
set "OPENAI_PROJECT_ID=default"
 */
import OpenAI from "openai";
import 'dotenv/config';

const client = new OpenAI({
  apiKey: process.env.AWS_ACCESS_KEY_ID, 
  baseURL: `https://bedrock-runtime.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`, 
});

async function main() {
  try {
    const response = await client.chat.completions.create({
      model: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0", 
      messages: [{ role: "user", content: "What is Amazon Bedrock?" }],
    });

    // 1. Log the FULL response so you can see the structure
    console.log("Full Response from Bedrock:", JSON.stringify(response, null, 2));

    // 2. Use optional chaining (?.) to prevent the crash

    if (content) {
      console.log("\n✅ Result:", content);
    } else {
      console.log("\n⚠️ The response was successful, but 'choices[0].message.content' was not found.");
    }

  } catch (error) {
    console.error("❌ Error calling Bedrock via OpenAI SDK:", error);
  }
}

main();