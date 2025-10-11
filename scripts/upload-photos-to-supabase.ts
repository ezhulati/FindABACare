import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'venue-photos');

async function uploadPhoto(filepath: string, filename: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filepath);

    const { data, error } = await supabase.storage
      .from('venue-photos')
      .upload(filename, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error(`  ✗ Error uploading ${filename}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('venue-photos')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error: any) {
    console.error(`  ✗ Failed to upload ${filename}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Uploading venue photos to Supabase Storage');
  console.log('='.repeat(50));

  // Create storage bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'venue-photos');

  if (!bucketExists) {
    console.log('\nCreating venue-photos bucket...');
    const { error } = await supabase.storage.createBucket('venue-photos', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }
    console.log('✓ Bucket created');
  }

  // Get all venues
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, name, slug, photo_keys')
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (venuesError) {
    console.error('Error fetching venues:', venuesError);
    return;
  }

  console.log(`\nFound ${venues.length} venues`);
  console.log(`Processing photos...\n`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const venue of venues) {
    if (!venue.photo_keys || venue.photo_keys.length === 0) {
      continue;
    }

    console.log(`📍 ${venue.name}`);

    const newPhotoKeys: string[] = [];

    for (const photoKey of venue.photo_keys) {
      const filename = path.basename(photoKey);
      const filepath = path.join(PHOTOS_DIR, filename);

      // Check if file exists locally
      if (!fs.existsSync(filepath)) {
        console.log(`  ⚠️  Local file not found: ${filename}`);
        skippedCount++;
        continue;
      }

      // Check if already uploaded
      const { data: existing } = await supabase.storage
        .from('venue-photos')
        .list('', {
          search: filename
        });

      if (existing && existing.length > 0) {
        const { data: { publicUrl } } = supabase.storage
          .from('venue-photos')
          .getPublicUrl(filename);
        newPhotoKeys.push(publicUrl);
        console.log(`  ⏭️  Already uploaded: ${filename}`);
        skippedCount++;
        continue;
      }

      // Upload file
      const publicUrl = await uploadPhoto(filepath, filename);

      if (publicUrl) {
        newPhotoKeys.push(publicUrl);
        uploadedCount++;
        console.log(`  ✅ Uploaded: ${filename}`);
      } else {
        errorCount++;
      }

      // Rate limit: wait 50ms between uploads
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Update venue with new photo URLs
    if (newPhotoKeys.length > 0) {
      const { error: updateError } = await supabase
        .from('venues')
        .update({ photo_keys: newPhotoKeys })
        .eq('id', venue.id);

      if (updateError) {
        console.log(`  ✗ Error updating database: ${updateError.message}`);
      } else {
        console.log(`  ✓ Updated database with ${newPhotoKeys.length} photos`);
      }
    }

    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`  Uploaded: ${uploadedCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log('\nDone!');
}

main();
