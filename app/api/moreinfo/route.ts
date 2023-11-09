// @ts-nocheck
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { ChatCompletionCreateParams } from "openai/resources/index.mjs";
import { ComputeEngine } from "@cortex-js/compute-engine";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: "get_current_weather",
    description: "Get the current weather",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
        format: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          description:
            "The temperature unit to use. Infer this from the users location.",
        },
      },
      required: ["location", "format"],
    },
  },
];

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages,
    functions,
    temperature: 0.1,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    async experimental_onFunctionCall(
      { name, arguments: args },
      createFunctionCallMessages
    ) {
      // if you skip the function call and return nothing, the `function_call`
      // message will be sent to the client for it to handle

      console.log("function call", name, JSON.stringify(args, null, 2));

      const weatherData = {
        temperature: 20,
        unit: args.format === "celsius" ? "C" : "F",
      };

      let newMessages = createFunctionCallMessages(weatherData);

      const reply = [...messages, ...newMessages];

      return openai.chat.completions.create({
        messages: reply,
        stream: true,
        model: "gpt-3.5-turbo-0613",
        // see "Recursive Function Calls" below
        functions,
      });
    },
  });

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
