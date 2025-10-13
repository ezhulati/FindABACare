import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPhotoColumn() {
  console.log('🔍 Investigating photo column...\n');

  // Get a sample venue to see all columns
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No venues found');
    return;
  }

  console.log('📊 Available columns in venues table:');
  const columns = Object.keys(data[0]);
  columns.forEach(col => {
    console.log(`   - ${col}`);
  });

  console.log('\n📸 Photo-related data in sample venue:');
  const photoColumns = columns.filter(col =>
    col.toLowerCase().includes('photo') ||
    col.toLowerCase().includes('image') ||
    col.toLowerCase().includes('picture')
  );

  if (photoColumns.length > 0) {
    photoColumns.forEach(col => {
      console.log(`   ${col}: ${data[0][col]}`);
    });
  } else {
    console.log('   ⚠️  No photo/image columns found');
  }

  // Now check 10 venues with their photo data
  console.log('\n📸 Checking photo URLs in 10 venues:');
  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .select('id, name, image, photo')
    .limit(10);

  if (venuesError) {
    console.log('   Error checking venues:', venuesError.message);

    // Try alternative column names
    const alternativeCheck = await supabase
      .from('venues')
      .select('id, name, image_url, photo_url, thumbnail')
      .limit(10);

    if (alternativeCheck.error) {
      console.log('   Error with alternative names:', alternativeCheck.error.message);
    }
  } else {
    venues?.forEach(v => {
      console.log(`   ${v.name}:`);
      console.log(`      image: ${v.image || 'null'}`);
      console.log(`      photo: ${v.photo || 'null'}`);
    });
  }
}

checkPhotoColumn();
