// /api/index.js
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULTS = {
  TITLE: "AIMedNet - Healthcare Professional Networking Platform",
  DESCRIPTION: "Where Healthcare Professionals Connect, Collaborate, and Grow.",
  IMAGE: "https://storage.googleapis.com/gpt-engineer-file-uploads/EFM38HzF6yRP1jPiegZu8ZBHmID2/social-images/social-1761047907106-1000165051.jpg",
};
// --- END CONFIGURATION ---

// --- DATA FETCHERS ---

async function getPostData(threadId) {
  try {
    const { data: threadData } = await supabase.from('threads').select('title').eq('id', threadId).single();
    const { data: messageData } = await supabase.from('messages').select('body, id').eq('thread_id', threadId).order('created_at', { ascending: true }).limit(1).single();
    const { data: attachments } = await supabase.from('message_attachments').select('file_url, file_type').eq('message_id', messageData.id).limit(1);

    const title = threadData?.title || DEFAULTS.TITLE;
    const description = (messageData?.body || 'View attachment').substring(0, 150) + '...';
    const firstImage = attachments?.find(att => att.file_type.startsWith('image/'));
    const image = firstImage ? firstImage.file_url : DEFAULTS.IMAGE;

    return { title, description, image };
  } catch (error) {
    console.warn("Error fetching post data:", error.message);
    return null;
  }
}

async function getProfileData(userId) {
  try {
    const { data } = await supabase.from('profiles').select('full_name, profile_picture_url, current_position, bio').eq('id', userId).single();
    if (!data) return null;

    const title = `${data.full_name || 'View Profile'} | AIMedNet`;
    const description = (data.current_position || data.bio || DEFAULTS.DESCRIPTION).substring(0, 150) + '...';
    const image = data.profile_picture_url || DEFAULTS.IMAGE;

    return { title, description, image };
  } catch (error) {
    console.warn("Error fetching profile data:", error.message);
    return null;
  }
}

async function getSpaceData(spaceId) {
  try {
    const { data } = await supabase.from('spaces').select('name, description').eq('id', spaceId).single();
    if (!data) return null;

    const title = `${data.name} | AIMedNet`;
    const description = (data.description || DEFAULTS.DESCRIPTION).substring(0, 150) + '...';
    
    return { title, description, image: DEFAULTS.IMAGE }; // Assuming spaces don't have unique images yet
  } catch (error) {
    console.warn("Error fetching space data:", error.message);
    return null;
  }
}

// --- MAIN HANDLER ---
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathName = url.pathname;

  let og = { ...DEFAULTS };
  let pageUrl = `https://${req.headers.host}${pathName}`;

  // Define our URL patterns
  const profileRegex = /^\/profile\/(.*)/;
  const threadRegex = /^\/community\/thread\/(.*)/;
  const spaceRegex = /^\/community\/space\/(.*)/;

  const profileMatch = pathName.match(profileRegex);
  const threadMatch = pathName.match(threadRegex);
  const spaceMatch = pathName.match(spaceRegex);

  // --- ROUTING LOGIC ---
  try {
    if (pathName === '/' || pathName === '') {
      // Homepage
      og.TITLE = DEFAULTS.TITLE;
    
    } else if (profileMatch && profileMatch[1]) {
      // PROFILE page
      const data = await getProfileData(profileMatch[1]);
      if (data) { og = data; }

    } else if (threadMatch && threadMatch[1]) {
      // THREAD page
      const data = await getPostData(threadMatch[1]);
      if (data) { og = data; }
    
    } else if (spaceMatch && spaceMatch[1]) {
      // SPACE page
      const spaceId = spaceMatch[1].split('/')[0]; // Get ID, ignore /members
      const data = await getSpaceData(spaceId);
      if (data) { og = data; }

    } else if (pathName === '/community') {
      og.TITLE = "Community Hub | AIMedNet";
      og.DESCRIPTION = "Explore public posts, forums, and discussions.";
    
    } else if (pathName === '/industryhub') {
      og.TITLE = "Industry Hub | AIMedNet";
      og.DESCRIPTION = "Connect with companies and explore industry partnerships.";
    
    } else if (pathName === '/jobs') {
      og.TITLE = "Jobs | AIMedNet";
      og.DESCRIPTION = "Find your next career opportunity in healthcare.";
    }
    // ... add more 'else if' blocks for other static pages ...

  } catch (e) {
    console.error("Data fetching error, using defaults:", e.message);
  }
  // --- END ROUTING ---

  try {
    // 1. Read the built index.html file
    // This path works in Vercel's environment
    const htmlPath = path.resolve('./.vercel/output/static/index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // 2. Find and replace all placeholders
    html = html.replace(/__OG_TITLE__/g, og.TITLE);
    html = html.replace(/__OG_DESCRIPTION__/g, og.DESCRIPTION);
    html = html.replace(/__OG_IMAGE__/g, og.IMAGE);
    html = html.replace(/__OG_URL__/g, pageUrl);
    
    // 3. Send the modified HTML
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error("Error reading index.html:", error.message);
    // Fallback if file reading fails
    res.status(500).send("Error loading page.");
  }
}
