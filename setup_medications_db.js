require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function setupMedicationsTable() {
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
    
    console.log('🔍 Setting up medications table in Supabase...\n');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create_medications_table.sql');
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
    
    console.log('\n🎉 Medications table setup complete!');
    
    // Verify the table exists and has data
    const { data: medications, error: fetchError } = await supabase
      .from('medications')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error verifying medications table:', fetchError.message);
    } else {
      console.log(`✅ Medications table verified - contains ${medications?.length || 0} records`);
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupMedicationsTable(); 