import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversation extends Document {
    participants: {
        participantId: mongoose.Types.ObjectId;
        participantModel: 'User' | 'Vendor';
    }[];
    lastMessage?: mongoose.Types.ObjectId;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                participantId: {
                    type: Schema.Types.ObjectId,
                    required: true,
                    refPath: 'participants.participantModel',
                },
                participantModel: {
                    type: String,
                    required: true,
                    enum: ['User', 'Vendor'],
                },
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for quick lookup of conversations for a participant
ConversationSchema.index({ 'participants.participantId': 1 });

const Conversation: Model<IConversation> =
    mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
