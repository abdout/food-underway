import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const merchantId = formData.get('merchantId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID required' },
        { status: 400 }
      );
    }

    // Verify user has access to this merchant
    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { ownerId: true }
    });

    if (!merchant || merchant.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PNG and JPG allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `logo-${merchantId}-${Date.now()}.${fileExtension}`;

    // Save to public/uploads/logos directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos');

    // Create directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Generate public URL
    const logoUrl = `/uploads/logos/${fileName}`;

    // Update merchant record
    await db.merchant.update({
      where: { id: merchantId },
      data: { logo: logoUrl }
    });

    return NextResponse.json({
      success: true,
      logoUrl,
      message: 'Logo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
