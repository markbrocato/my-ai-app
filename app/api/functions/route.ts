// @ts-nocheck
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { ChatCompletionCreateParams } from "openai/resources/index.mjs";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: "execute_ruby",
    description: "Executes ruby code and returns the result",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The code to execute",
        },
      },
      required: ["code"],
    },
  },
];

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
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

      const data = {
        result: 99,
      };

      let newMessages = createFunctionCallMessages(data);

      const reply = [...messages, ...newMessages];

      console.log("reply", reply);

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
