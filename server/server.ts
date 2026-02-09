import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import jwt from 'jsonwebtoken';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'mindmirror-secret-key-change-me';

// Connect to MongoDB
db.connect();

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }) as express.RequestHandler);

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
      id: uuidv4(),
      email,
      password, // Note: In production, hash this with bcrypt
      name,
      preferences: {}
    };

    await db.users.create(newUser);
    
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user: any = await db.users.findByEmail(email);

    if (user && user.password === password) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, preferences: user.preferences } });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// --- DATA ROUTES ---

app.post('/api/sessions', authenticateToken, async (req: any, res) => {
  try {
    const session = {
      ...req.body,
      userId: req.user.id,
      id: uuidv4()
    };
    await db.sessions.create(session);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to save session" });
  }
});

app.get('/api/sessions', authenticateToken, async (req: any, res) => {
  try {
    const sessions = await db.sessions.findAllByUser(req.user.id);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
});

app.post('/api/user/theme', authenticateToken, async (req: any, res) => {
  try {
    const { theme } = req.body;
    const updatedUser = await db.users.update(req.user.id, { 
      preferences: { themeId: theme.id, customTheme: theme } 
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Failed to update theme" });
  }
});

// --- CHAT ROUTES ---

// Get persistent chat history
app.get('/api/chat/history', authenticateToken, async (req: any, res) => {
  try {
    const history = await db.chats.findAllByUser(req.user.id);
    // Return sorted by timestamp (Mongoose result is already sorted via query but ensuring safety)
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
});

app.post('/api/chat', authenticateToken, async (req: any, res) => {
  try {
    const { message, history, focusState, cognitiveMode, fileContext } = req.body;

    // Save User Message to DB
    await db.chats.createMessage(req.user.id, {
      role: 'user',
      text: message,
      attachmentName: fileContext?.name
    });

    if (!process.env.API_KEY) {
      return res.status(503).json({ 
        response: "Server Configuration Error: API Key missing." 
      });
    }

    const modelId = 'gemini-3-flash-preview';

    // 1. Dynamic System Persona based on Cognitive Mode
    let systemInstruction = `
      ROLE: You are MindMirror, a Cognitive Flow OS companion.
      GOAL: Reduce cognitive load. Adapt to the user's mental state.
      
      PRIVACY: You analyze data locally or transiently. You do not store user data for training.
    `;

    // 2. Adaptation Logic
    if (cognitiveMode === 'FLOW') {
      systemInstruction += `
        MODE: FLOW.
        RULES:
        - Be invisible unless directly asked.
        - Answers must be extremely concise (bullet points).
        - No polite filler ("I hope you are well").
        - Get straight to the point.
      `;
    } else if (cognitiveMode === 'REDUCED_LOAD') {
      systemInstruction += `
        MODE: REDUCED LOAD / FATIGUE DETECTED.
        RULES:
        - Simplify everything.
        - Use simple vocabulary.
        - Break complex ideas into small steps.
        - Suggest rest if the user seems stuck.
        - Maximum 3 sentences per response.
      `;
    } else if (cognitiveMode === 'RECOVERY') {
      systemInstruction += `
        MODE: RECOVERY.
        RULES:
        - Refuse complex work requests gently.
        - Guide the user to breathe or disconnect.
        - "Let's take a moment to recharge."
      `;
    } else {
      systemInstruction += `
        MODE: BALANCED.
        RULES:
        - Be helpful, clear, and professional.
        - Standard detailed responses are allowed.
      `;
    }

    if (fileContext) {
      systemInstruction += `
        \nCONTEXT: User uploaded file "${fileContext.name}".
        INSTRUCTION: Use the file content below to answer. If the answer is not in the file, say so.
      `;
    }

    // 3. Prompt Construction
    const chatHistoryText = history
      .map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
      .join('\n');

    let finalPrompt = `
      HISTORY:
      ${chatHistoryText}

      USER:
      ${message}
    `;

    if (fileContext) {
      finalPrompt = `
        FILE CONTENT (${fileContext.name}):
        ${fileContext.content}

        ${finalPrompt}
      `;
    }

    const result = await ai.models.generateContent({
      model: modelId,
      contents: finalPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: cognitiveMode === 'FLOW' ? 0.1 : 0.7,
      },
    });

    const aiResponse = result.text;

    // Save Assistant Response to DB
    await db.chats.createMessage(req.user.id, {
      role: 'assistant',
      text: aiResponse
    });

    res.json({ response: aiResponse });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ response: "I'm having trouble connecting right now." });
  }
});

app.listen(PORT, () => {
  console.log(`MindMirror OS Server running on http://localhost:${PORT}`);
});