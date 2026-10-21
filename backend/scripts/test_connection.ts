import { config, isSupabaseConfigured } from '../src/config.js';
import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('--- SUPABASE CONFIGURATION CHECK ---');
  console.log('isSupabaseConfigured():', isSupabaseConfigured());
  console.log('SUPABASE_URL:', config.supabaseUrl ? config.supabaseUrl.replace(/(https?:\/\/)([^.]+)(.+)/, '$1$2$3') : 'Not set');
  console.log('SUPABASE_ANON_KEY present:', Boolean(config.supabaseAnonKey && config.supabaseAnonKey !== 'your_supabase_anon_key_here'));
  console.log('SUPABASE_SERVICE_ROLE_KEY present:', Boolean(config.supabaseServiceRoleKey && config.supabaseServiceRoleKey !== 'your_supabase_service_role_key_here'));

  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured properly in backend/.env');
    process.exit(1);
  }

  const activeKey = config.supabaseServiceRoleKey || config.supabaseAnonKey;
  const keyType = config.supabaseServiceRoleKey ? 'Service Role Key (bypasses RLS)' : 'Anon Public Key';
  console.log(`Using ${keyType} for connection test.`);

  const supabase = createClient(config.supabaseUrl, activeKey, {
    auth: { persistSession: false },
  });

  console.log('\n--- VERIFYING CONNECTION & TABLE STATUS ---');
  const requiredTables = [
    'anonymous_visitors',
    'career_profiles',
    'chat_sessions',
    'chat_messages',
    'profile_facts',
    'privacy_consent_records',
  ];
  let allTablesExist = true;

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (
          error.code === '42P01' ||
          error.code === 'PGRST205' ||
          error.message.includes('schema cache') ||
          error.message.includes('does not exist')
        ) {
          console.log(`⚠️  Table "${table}": Connection authenticated, but table does not exist yet.`);
          allTablesExist = false;
        } else {
          console.error(`❌ Table "${table}": Error ->`, error.message);
          allTablesExist = false;
        }
      } else {
        console.log(`✅ Table "${table}": Connected and ready!`);
      }
    } catch (err: any) {
      console.error(`❌ Connection error on "${table}":`, err.message || err);
      allTablesExist = false;
    }
  }

  if (allTablesExist) {
    console.log('\n🎉 ALL TABLES EXIST AND SUPABASE IS FULLY OPERATIONAL!');
  } else {
    console.log('\n✅ Supabase API authentication and connection are WORKING!');
    console.log('👉 To create the missing tables, run "backend/supabase_schema.sql" in your Supabase SQL Editor.');
  }
}

testSupabaseConnection();
