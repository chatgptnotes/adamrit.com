// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function fetchFromTally(serverUrl, xmlBody) {
  const response = await fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xmlBody,
  });
  return await response.text();
}

function buildExportXml(reportId, companyName, extraVars = '') {
  return `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>${reportId}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        ${extraVars}
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

function getVal(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

function getAll(xml, tag) {
  return xml.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi')) || [];
}

function getAttr(xml, attr) {
  const m = xml.match(new RegExp(`${attr}="([^"]*)"`, 'i'));
  return m ? m[1] : '';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const supabase = getSupabase();
  let logId = null;

  try {
    const { action, serverUrl, companyName, dateRange } = await request.json();

    if (!serverUrl || !companyName || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create sync log entry
    const { data: logData } = await supabase
      .from('tally_sync_log')
      .insert({
        sync_type: action,
        direction: 'inward',
        status: 'started',
      })
      .select()
      .single();
    logId = logData?.id;

    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors = [];

    switch (action) {
      case 'ledgers': {
        const xml = buildExportXml('List of Ledgers', companyName);
        const response = await fetchFromTally(serverUrl, xml);
        const elements = getAll(response, 'LEDGER');

        for (const el of elements) {
          try {
            const name = getVal(el, 'NAME') || getAttr(el, 'NAME');
            if (!name) continue;
            const { error } = await supabase.from('tally_ledgers').upsert({
              name,
              tally_guid: getVal(el, 'GUID') || getAttr(el, 'GUID') || null,
              parent_group: getVal(el, 'PARENT'),
              opening_balance: parseFloat(getVal(el, 'OPENINGBALANCE') || '0'),
              closing_balance: parseFloat(getVal(el, 'CLOSINGBALANCE') || '0'),
              address: getVal(el, 'ADDRESS') || null,
              phone: getVal(el, 'LEDGERPHONE') || getVal(el, 'PHONE') || null,
              email: getVal(el, 'EMAIL') || getVal(el, 'LEDGEREMAIL') || null,
              gst_number: getVal(el, 'PARTYGSTIN') || null,
              pan_number: getVal(el, 'INCOMETAXNUMBER') || null,
              last_synced_at: new Date().toISOString(),
            }, { onConflict: 'tally_guid', ignoreDuplicates: false });

            if (error) {
              await supabase.from('tally_ledgers').upsert({
                name,
                parent_group: getVal(el, 'PARENT'),
                opening_balance: parseFloat(getVal(el, 'OPENINGBALANCE') || '0'),
                closing_balance: parseFloat(getVal(el, 'CLOSINGBALANCE') || '0'),
                last_synced_at: new Date().toISOString(),
              }, { onConflict: 'tally_guid' });
            }
            recordsSynced++;
          } catch (e) {
            recordsFailed++;
            errors.push(e.message);
          }
        }
        break;
      }

      case 'groups': {
        const xml = buildExportXml('List of Groups', companyName);
        const response = await fetchFromTally(serverUrl, xml);
        const elements = getAll(response, 'GROUP');

        for (const el of elements) {
          try {
            const name = getVal(el, 'NAME') || getAttr(el, 'NAME');
            if (!name) continue;
            await supabase.from('tally_groups').upsert({
              name,
              parent_group: getVal(el, 'PARENT') || null,
              nature_of_group: getVal(el, 'NATUREOFGROUP') || null,
              is_revenue: (getVal(el, 'NATUREOFGROUP') || '').toLowerCase().includes('revenue'),
              is_deemed_positive: getVal(el, 'ISDEEMEDPOSITIVE') === 'Yes',
              last_synced_at: new Date().toISOString(),
            }, { onConflict: 'name' });
            recordsSynced++;
          } catch (e) {
            recordsFailed++;
            errors.push(e.message);
          }
        }
        break;
      }

      case 'stock': {
        const xml = buildExportXml('List of Stock Items', companyName);
        const response = await fetchFromTally(serverUrl, xml);
        const elements = getAll(response, 'STOCKITEM');

        for (const el of elements) {
          try {
            const name = getVal(el, 'NAME') || getAttr(el, 'NAME');
            if (!name) continue;
            await supabase.from('tally_stock_items').upsert({
              name,
              tally_guid: getVal(el, 'GUID') || getAttr(el, 'GUID') || null,
              stock_group: getVal(el, 'PARENT') || getVal(el, 'STOCKGROUP') || null,
              unit: getVal(el, 'BASEUNITS') || getVal(el, 'UNIT') || null,
              opening_balance: parseFloat(getVal(el, 'OPENINGBALANCE') || '0'),
              closing_balance: parseFloat(getVal(el, 'CLOSINGBALANCE') || '0'),
              opening_value: parseFloat(getVal(el, 'OPENINGVALUE') || '0'),
              closing_value: parseFloat(getVal(el, 'CLOSINGVALUE') || '0'),
              rate: parseFloat(getVal(el, 'CLOSINGRATE') || getVal(el, 'RATE') || '0'),
              gst_rate: parseFloat(getVal(el, 'GSTRATE') || '0'),
              hsn_code: getVal(el, 'HSNCODE') || getVal(el, 'HSNSACCODE') || null,
              last_synced_at: new Date().toISOString(),
            }, { onConflict: 'tally_guid', ignoreDuplicates: false });
            recordsSynced++;
          } catch (e) {
            recordsFailed++;
            errors.push(e.message);
          }
        }
        break;
      }

      case 'vouchers': {
        const from = dateRange?.from || '2024-04-01';
        const to = dateRange?.to || new Date().toISOString().split('T')[0];
        const fromFormatted = from.replace(/-/g, '');
        const toFormatted = to.replace(/-/g, '');

        const xml = buildExportXml('Day Book', companyName,
          `<SVFROMDATE>${fromFormatted}</SVFROMDATE><SVTODATE>${toFormatted}</SVTODATE>`
        );
        const response = await fetchFromTally(serverUrl, xml);
        const elements = getAll(response, 'VOUCHER');

        for (const el of elements) {
          try {
            const rawDate = getVal(el, 'DATE');
            const date = rawDate ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}` : to;

            const entryElements = getAll(el, 'ALLLEDGERENTRIES.LIST');
            const ledgerEntries = entryElements.map(entryEl => {
              const amt = parseFloat(getVal(entryEl, 'AMOUNT') || '0');
              return {
                ledger: getVal(entryEl, 'LEDGERNAME'),
                amount: Math.abs(amt),
                is_debit: amt < 0,
              };
            });

            const totalAmount = ledgerEntries.reduce((s, e) => e.is_debit ? s + e.amount : s, 0);

            await supabase.from('tally_vouchers').upsert({
              tally_guid: getVal(el, 'GUID') || getAttr(el, 'REMOTEID') || null,
              voucher_number: getVal(el, 'VOUCHERNUMBER'),
              voucher_type: getVal(el, 'VOUCHERTYPENAME') || getAttr(el, 'VCHTYPE'),
              date,
              party_ledger: getVal(el, 'PARTYLEDGERNAME'),
              amount: totalAmount,
              narration: getVal(el, 'NARRATION') || null,
              is_cancelled: getVal(el, 'ISCANCELLED') === 'Yes',
              sync_direction: 'from_tally',
              sync_status: 'synced',
              ledger_entries: ledgerEntries,
              synced_at: new Date().toISOString(),
            }, { onConflict: 'tally_guid', ignoreDuplicates: false });
            recordsSynced++;
          } catch (e) {
            recordsFailed++;
            errors.push(e.message);
          }
        }
        break;
      }

      case 'reports': {
        const today = new Date().toISOString().split('T')[0];
        const todayFormatted = today.replace(/-/g, '');
        const fyStart = `${new Date().getFullYear()}-04-01`;
        const fyStartFormatted = fyStart.replace(/-/g, '');

        const reportIds = [
          { id: 'Trial Balance', type: 'trial_balance', extra: `<SVTODATE>${todayFormatted}</SVTODATE>` },
          { id: 'Balance Sheet', type: 'balance_sheet', extra: `<SVTODATE>${todayFormatted}</SVTODATE>` },
          { id: 'Profit and Loss A/c', type: 'pnl', extra: `<SVFROMDATE>${fyStartFormatted}</SVFROMDATE><SVTODATE>${todayFormatted}</SVTODATE>` },
          { id: 'Outstanding Receivables', type: 'outstanding_receivables', extra: '' },
          { id: 'Outstanding Payables', type: 'outstanding_payables', extra: '' },
        ];

        for (const report of reportIds) {
          try {
            const xml = buildExportXml(report.id, companyName, report.extra);
            const response = await fetchFromTally(serverUrl, xml);

            await supabase.from('tally_reports').insert({
              report_type: report.type,
              report_date: today,
              period_from: fyStart,
              period_to: today,
              data: { raw: response },
              fetched_at: new Date().toISOString(),
            });
            recordsSynced++;
          } catch (e) {
            recordsFailed++;
            errors.push(`${report.type}: ${e.message}`);
          }
        }
        break;
      }

      case 'full': {
        const syncActions = ['groups', 'ledgers', 'stock', 'vouchers', 'reports'];
        for (const subAction of syncActions) {
          try {
            const subResponse = await fetch(request.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: subAction, serverUrl, companyName, dateRange }),
            });
            const subResult = await subResponse.json();
            recordsSynced += subResult.recordsSynced || 0;
            recordsFailed += subResult.recordsFailed || 0;
          } catch (e) {
            errors.push(`${subAction}: ${e.message}`);
          }
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const durationMs = Date.now() - startTime;

    if (logId) {
      await supabase.from('tally_sync_log').update({
        status: recordsFailed > 0 && recordsSynced > 0 ? 'partial' : recordsFailed > 0 ? 'failed' : 'completed',
        records_synced: recordsSynced,
        records_failed: recordsFailed,
        error_details: errors.length > 0 ? { errors } : null,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      }).eq('id', logId);
    }

    await supabase.from('tally_config')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      action,
      recordsSynced,
      recordsFailed,
      errors: errors.length > 0 ? errors : undefined,
      durationMs,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;

    if (logId) {
      await supabase.from('tally_sync_log').update({
        status: 'failed',
        error_details: { error: error.message },
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      }).eq('id', logId);
    }

    return NextResponse.json(
      { error: 'Sync failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
