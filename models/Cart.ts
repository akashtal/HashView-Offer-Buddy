import mongoose, { Schema, Document, Model } from 'mongoose';
import './Product';

export interface ICartItem {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number; // Price at the time of adding
}

export interface ICart extends Document {
    userId: mongoose.Types.ObjectId;
    items: ICartItem[];
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false }); // No specific ID for item subdoc needed unless for complex management

const CartSchema = new Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User', // Linking to the End User
            required: true,
            unique: true, // One cart per user
        },
        items: [CartItemSchema],
        totalAmount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
    }
);

// Calculate total before saving
CartSchema.pre('save', function (next) {
    if (this.items) {
        this.totalAmount = this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    next();
});

const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
