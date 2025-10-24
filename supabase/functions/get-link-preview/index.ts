import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

// Helper function to fetch and scrape
async function scrapeUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      throw new Error('Not an HTML page');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMetaTag = (name: string) =>
      $(`meta[property="og:${name}"]`).attr('content') ||
      $(`meta[name="${name}"]`).attr('content');

    const title = getMetaTag('title') || $('title').first().text();
    const description = getMetaTag('description');
    const image = getMetaTag('image');

    return { title, description, image };
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return { error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*', // Be more specific in production!
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      throw new Error("Missing 'url' parameter");
    }

    const data = await scrapeUrl(url);

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          'Access-Control-Allow-Origin': '*', // Be more specific in production!
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          'Access-Control-Allow-Origin': '*', // Be more specific in production!
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});
