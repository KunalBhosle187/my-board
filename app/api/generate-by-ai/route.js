import OpenAI from "openai";

export const POST = async (req, res) => {
  const prompt = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid prompt provided" });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

  const responses = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an AI coding assistant that Generate a Mermaid diagram based on the prompt,
            and create requirements based on the output Mermaid diagram.
            Limit your response to no more than 200 words, but make sure to construct complete code.
            Return response in JSON with key and value.
            For mermaid code key is mermaid and for requirement key is requirement.
     `,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "gpt-3.5-turbo",
  });

  const mermaid = JSON.parse(responses.choices[0].message.content).mermaid;
  const requirement = JSON.parse(
    responses.choices[0].message.content
  ).requirement;

  console.log(JSON.parse(responses.choices[0].message.content));

  if (!mermaid || !requirement) {
    return Response.json({
      error: "Failed to generate mermaid or requirement",
    });
  }
  async function generateEditorJSFromContent(content) {
    // const editorJSPrompt = `can you convert requirement in editorJS JSON Format based on the provided information "${content}".
    // Only provide blocks array in JSON.`;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });
    const editorJSFormat = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI coding assistant that generate detailed EditorJS JSON document based on the following information.
            Limit your response to no more than 200 words, but make sure to construct complete code.
       `,
        },
        {
          role: "user",
          content: `Please create an EditorJS JSON document based on the user-provided information: ${content}**Consider including relevant blocks and formatting them appropriately based on the information provided. You may use the following block types:
          * Header: Title of your document.
          * Paragraph: Body text describing the content.
          * List: Ordered or unordered list of items.
          * Quote: Quote from a source.
          * Image: Image with optional caption.
          * Code: Code snippet with syntax highlighting.`,
        },
      ],
      model: "gpt-3.5-turbo",
    });
    return editorJSFormat.choices[0].message.content;
  }
  // 5. Construct and return data object
  const data = {
    mermaid,
    editorJSFormat: await generateEditorJSFromContent(requirement), // Separate function for cost efficiency
  };

  console.log({ data });

  return Response.json(data);
};
