import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import sharp from 'sharp';

// Configuration
const AVATAR_SIZE = 40; // 40x40 pixels
const MAX_FILE_SIZE = 250 * 1024; // 250KB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const uploadBunnyAvatar = onCall({
  maxInstances: 10,
  memory: '256MiB',
  timeoutSeconds: 60,
}, async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { bunnyId, imageData, mimeType } = request.data;

    // Validate input
    if (!bunnyId) {
      throw new Error('Bunny ID is required');
    }

    if (!imageData) {
      throw new Error('Image data is required');
    }

    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error('Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed');
    }

    // Check if bunny exists
    const db = admin.firestore();
    const bunnyRef = db.collection('bunnies').doc(bunnyId);
    const bunnyDoc = await bunnyRef.get();

    if (!bunnyDoc.exists) {
      throw new Error('Bunny not found');
    }

    // Decode base64 image data
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Check file size before processing
    if (imageBuffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size too large. Maximum allowed: ${MAX_FILE_SIZE / 1024}KB`);
    }

    // Resize and optimize image
    let processedImageBuffer: Buffer;
    let processedMimeType: string;

        try {
      const sharpInstance = sharp(imageBuffer);

      // Resize image to 40x40 pixels, maintaining aspect ratio
      const resizedImage = sharpInstance
        .resize(AVATAR_SIZE, AVATAR_SIZE, {
          fit: 'cover',
          position: 'center'
        });

      // Convert to WebP for better compression
      processedImageBuffer = await resizedImage
        .webp({ quality: 80 })
        .toBuffer();

      processedMimeType = 'image/webp';
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }

    // Check processed file size
    if (processedImageBuffer.length > MAX_FILE_SIZE) {
      throw new Error('Processed image is still too large');
    }

    // Upload to Firebase Storage
    const storage = admin.storage();
    const bucket = storage.bucket();

    const fileName = `bunny-avatars/${bunnyId}.webp`;
    const file = bucket.file(fileName);

    // Upload the processed image
    await file.save(processedImageBuffer, {
      metadata: {
        contentType: processedMimeType,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      }
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update bunny document with avatar reference
    await bunnyRef.update({
      avatarUrl: publicUrl,
      avatarUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create an avatar upload event for tracking
    const avatarEvent = {
      bunnyId: bunnyId,
      eventType: 'avatar_upload',
      status: 'finished',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      avatarUrl: publicUrl,
      originalSize: imageBuffer.length,
      processedSize: processedImageBuffer.length,
      originalMimeType: mimeType,
      processedMimeType: processedMimeType
    };

    await db.collection('bunnieEvent').add(avatarEvent);

    return {
      success: true,
      avatarUrl: publicUrl,
      message: 'Avatar uploaded successfully',
      stats: {
        originalSize: imageBuffer.length,
        processedSize: processedImageBuffer.length,
        compressionRatio: Math.round((1 - processedImageBuffer.length / imageBuffer.length) * 100)
      }
    };

  } catch (error: any) {
    console.error('Avatar upload error:', error);

    return {
      success: false,
      error: error.message || 'Failed to upload avatar'
    };
  }
});

// Function to delete avatar when bunny is deleted
export const deleteBunnyAvatar = onCall({
  maxInstances: 5,
  memory: '128MiB',
  timeoutSeconds: 30,
}, async (request) => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { bunnyId } = request.data;

    if (!bunnyId) {
      throw new Error('Bunny ID is required');
    }

    const storage = admin.storage();
    const bucket = storage.bucket();
    const fileName = `bunny-avatars/${bunnyId}.webp`;
    const file = bucket.file(fileName);

    // Check if file exists
    const [exists] = await file.exists();

    if (exists) {
      // Delete the file
      await file.delete();
    }

    return {
      success: true,
      message: 'Avatar deleted successfully'
    };

  } catch (error: any) {
    console.error('Avatar deletion error:', error);

    return {
      success: false,
      error: error.message || 'Failed to delete avatar'
    };
  }
});
