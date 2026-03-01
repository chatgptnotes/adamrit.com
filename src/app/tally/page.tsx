// @ts-nocheck
import { supabase } from '@/lib/supabase'
import TallyPage from '@/components/tally/TallyPage'

export const dynamic = "force-dynamic";

export default async function Tally() {
  // Minimal server-side data fetch to match working page pattern
  const { data: config } = await supabase
    .from('tally_config')
    .select('*')
    .limit(1)
    .single()

  return <TallyPage initialConfig={config} />
}
