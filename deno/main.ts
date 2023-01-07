import {
  json,
  serve,
  validateRequest
} from "https://deno.land/x/sift@0.6.0/mod.ts";
import {
  DynamoDBClient,
  GetItemCommand
} from "https://esm.sh/@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID"),
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY"),
  },
});

serve({
  "/employees": handleRequest,
});

async function handleRequest(request) {
  const { error } = await validateRequest(request, {
    GET: {
      params: ["id"],
    }
  });

  if (error) {
    return json({ error: error.message }, { status: error.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const { Item } = await client.send(
      new GetItemCommand({
        TableName: "employees",
        Key: {
          pk: { S: searchParams.get("id") },
          sk: { S: searchParams.get("id") },
        },
      }),
    );

    if (Item) {
      return json({
        firstName: Item.first_name.S,
        lastName: Item.last_name.S,
        number: Item.number.N,
      });
    }
  } catch (error) {
    console.log(error);
  }

  return json(
    {
      message: "couldn't find the id",
    },
    { status: 404 },
  );
}
