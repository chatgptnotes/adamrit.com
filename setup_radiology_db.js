const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
});

async function setupRadiologyTable() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase URL or API key not found in .env.local');
      console.log('Please check your .env.local file has:');
      console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Setting up radiology table in Supabase...\n');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create_radiology_table.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute...\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} error:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log('\n🎉 Radiology table setup complete!');
    
    // Verify the table exists and has data
    const { data: radiologyTests, error: fetchError } = await supabase
      .from('radiology')
      .select('*');
      
    if (fetchError) {
      console.error('❌ Error verifying radiology data:', fetchError.message);
    } else {
      console.log(`✅ Found ${radiologyTests.length} radiology tests in the database`);
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run the setup
setupRadiologyTable(); 