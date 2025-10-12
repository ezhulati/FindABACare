#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAllPhotos() {
  console.log('Uploading remaining venue photos to Supabase Storage');
  console.log('==================================================\n');

  // Get all venues with photo_keys (local paths)
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, slug, photo_keys')
    .not('photo_keys', 'is', null);

  if (error) {
    console.error('Error fetching venues:', error);
    return;
  }

  console.log(`Found ${venues?.length} venues with photos\n`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const venue of venues || []) {
    console.log(`\n📍 ${venue.name}`);

    const photoKeys = venue.photo_keys as string[];
    if (!photoKeys || !Array.isArray(photoKeys)) {
      console.log('  ⚠️  No valid photo keys');
      continue;
    }

    const supabasePhotoUrls: string[] = [];
    let hasChanges = false;

    for (const photoKey of photoKeys) {
      // Check if this is already a Supabase URL
      if (photoKey.startsWith('http') || photoKey.includes('supabase')) {
        supabasePhotoUrls.push(photoKey);
        continue;
      }

      // It's a local path - upload it
      const localPath = join(process.cwd(), 'public', photoKey);

      if (!existsSync(localPath)) {
        console.log(`  ⚠️  File not found: ${photoKey}`);
        errorCount++;
        continue;
      }

      const fileName = photoKey.split('/').pop()!;
      const supabasePath = `${venue.slug}/${fileName}`;

      try {
        // Check if already uploaded
        const { data: existingFile } = await supabase
          .storage
          .from('venue-photos')
          .list(venue.slug, {
            search: fileName
          });

        if (existingFile && existingFile.length > 0) {
          const publicUrl = supabase.storage
            .from('venue-photos')
            .getPublicUrl(supabasePath).data.publicUrl;

          supabasePhotoUrls.push(publicUrl);
          skippedCount++;
          continue;
        }

        // Upload the file
        const fileBuffer = readFileSync(localPath);
        const { error: uploadError } = await supabase.storage
          .from('venue-photos')
          .upload(supabasePath, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.log(`  ❌ Error uploading ${fileName}:`, uploadError.message);
          errorCount++;
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('venue-photos')
          .getPublicUrl(supabasePath);

        supabasePhotoUrls.push(publicUrlData.publicUrl);
        console.log(`  ✅ Uploaded: ${fileName}`);
        uploadedCount++;
        hasChanges = true;

      } catch (err) {
        console.log(`  ❌ Error processing ${fileName}:`, err);
        errorCount++;
      }
    }

    // Update database if we have new Supabase URLs
    if (hasChanges && supabasePhotoUrls.length > 0) {
      const { error: updateError } = await supabase
        .from('venues')
        .update({ photo_keys: supabasePhotoUrls })
        .eq('id', venue.id);

      if (updateError) {
        console.log(`  ❌ Error updating database:`, updateError.message);
      } else {
        console.log(`  ✓ Updated database with ${supabasePhotoUrls.length} photos`);
      }
    }
  }

  console.log('\n\n==================================================');
  console.log('Upload Summary:');
  console.log(`  ✅ Uploaded: ${uploadedCount} photos`);
  console.log(`  ⏭️  Skipped: ${skippedCount} photos (already uploaded)`);
  console.log(`  ❌ Errors: ${errorCount} photos`);
  console.log('==================================================\n');
}

uploadAllPhotos().catch(console.error);
