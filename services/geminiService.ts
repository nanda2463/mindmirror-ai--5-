import { FocusState, ChatMessage } from "../types";

// This service now acts as a bridge to our secure backend
const API_URL = 'http://localhost:3001/api/chat';

export const getChatResponse = async (
  message: string,
  focusState: FocusState,
  history: ChatMessage[],
  fileContext?: { name: string; content: string }
): Promise<string> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        focusState,
        fileContext
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Chat Service Error:", error);
    return "I'm having trouble connecting to the MindMirror server. Please ensure the backend is running.";
  }
};
