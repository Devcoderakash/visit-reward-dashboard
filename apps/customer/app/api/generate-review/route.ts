export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { shop_name, shop_category, stars } = await request.json();

    if (!shop_name || !shop_category || !stars) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      console.error('Missing GROK_API_KEY');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const getReviews = async (stricter: boolean = false) => {
      let prompt = `Generate exactly 3 unique Google reviews for ${shop_name}, a ${shop_category}, rated ${stars} stars. Reviews should be natural, 2-3 sentences each, varied in tone. Return ONLY a JSON array of 3 strings, no other text, no markdown formatting, no code fences.`;
      if (stricter) {
        prompt += " Respond with raw JSON only, starting with [ and ending with ].";
      }

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-4-fast',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    };

    let content = await getReviews(false);
    let parsedReviews;

    try {
      parsedReviews = JSON.parse(content);
    } catch (e) {
      // Retry parsing once after stripping markdown
      try {
        const cleanStr = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedReviews = JSON.parse(cleanStr);
      } catch (e2) {
        // Retry whole API call once with stricter prompt
        content = await getReviews(true);
        try {
          const cleanStr2 = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedReviews = JSON.parse(cleanStr2);
        } catch (e3) {
          console.error('Failed to parse Grok response twice');
          return NextResponse.json({ error: 'Failed to generate reviews' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ reviews: parsedReviews });

  } catch (error: any) {
    console.error('Error in /api/generate-review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
