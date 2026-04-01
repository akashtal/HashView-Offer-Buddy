import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getUserFromRequest } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/utils';

// Configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.error("❌ Cloudinary Environment Variables Missing! Please check your .env file and restart the server.");
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);

        // Allow vendors and admins to upload
        if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
            return NextResponse.json(apiError('Unauthorized'), { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(apiError('No file provided'), { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create dynamic folder path: Offerbuddy/{role}s/{userId}
        const folderPath = `Offerbuddy/${user.role}s/${user.userId}`;

        // Upload to Cloudinary using a stream
        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folderPath,
                    resource_type: 'auto', // Auto-detect image/video
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json(
            apiSuccess({ url: result.secure_url }, 'Image uploaded successfully'),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(apiError('Upload failed: ' + error.message), { status: 500 });
    }
}
