import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindmirror';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Do not exit process in dev environment to allow server to keep running if DB is flaky
    // process.exit(1); 
  }
};

// --- SCHEMAS ---

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  preferences: { type: Object, default: {} }
});

const SessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  startTime: Number,
  endTime: Number,
  durationSeconds: Number,
  stateDistribution: Object,
  notes: String
});

const ChatSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: String,
  attachmentName: String,
  timestamp: { type: Number, default: Date.now }
});

// --- MODELS ---

const User = mongoose.model('User', UserSchema);
const Session = mongoose.model('Session', SessionSchema);
const Chat = mongoose.model('Chat', ChatSchema);

// --- DB INTERFACE ---

export const db = {
  connect: connectDB,
  
  users: {
    findAll: async () => User.find({}),
    findByEmail: async (email: string) => User.findOne({ email }),
    findById: async (id: string) => User.findOne({ id }),
    create: async (user: any) => User.create(user),
    update: async (id: string, updates: any) => {
      return User.findOneAndUpdate({ id }, { $set: updates }, { new: true });
    }
  },

  sessions: {
    findAllByUser: async (userId: string) => Session.find({ userId }).sort({ startTime: -1 }),
    create: async (session: any) => Session.create(session)
  },

  chats: {
    findAllByUser: async (userId: string) => Chat.find({ userId }).sort({ timestamp: 1 }),
    createMessage: async (userId: string, message: any) => {
      const newMessage = {
        id: uuidv4(),
        userId,
        ...message,
        timestamp: Date.now()
      };
      
      const created = await Chat.create(newMessage);
      
      // Cleanup: Keep only last 100 messages for this user to prevent bloat
      const count = await Chat.countDocuments({ userId });
      if (count > 100) {
        const oldest = await Chat.find({ userId }).sort({ timestamp: 1 }).limit(count - 100);
        const idsToDelete = oldest.map(c => c._id);
        await Chat.deleteMany({ _id: { $in: idsToDelete } });
      }

      return created;
    }
  }
};