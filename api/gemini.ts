export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { message, systemInstruction } = await request.json();

        const API_KEY = process.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) {
            throw new Error("Missing Gemini API Key in Server Environment.");
        }

        // Direct fetch to Gemini API from Edge Function (protects API key)
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: message }] }],
                    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                }),
            }
        );

        if (!geminiRes.ok) {
            const errorText = await geminiRes.text();
            throw new Error(`Gemini API Error: ${errorText}`);
        }

        const data = await geminiRes.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

        return new Response(JSON.stringify({ response: replyText }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
