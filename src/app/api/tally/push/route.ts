// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

function escapeXml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  return (dateStr || '').replace(/-/g, '');
}

function getVal(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

function parseResponse(xml) {
  const created = parseInt(getVal(xml, 'CREATED') || '0', 10);
  const altered = parseInt(getVal(xml, 'ALTERED') || '0', 10);
  const errors = [];
  const errorMatches = xml.match(/<LINEERROR[^>]*>[^<]*<\/LINEERROR>/gi) || [];
  for (const m of errorMatches) {
    errors.push(m.replace(/<\/?LINEERROR[^>]*>/gi, '').trim());
  }
  const lastMsg = getVal(xml, 'LASTMSG');
  if (lastMsg && lastMsg.toLowerCase().includes('error')) errors.push(lastMsg);

  return {
    success: errors.length === 0 && (created > 0 || altered > 0),
    message: errors.length > 0 ? errors.join('; ') : `Created: ${created}, Altered: ${altered}`,
    created,
    altered,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { action, serverUrl, companyName, data } = await request.json();

    if (!serverUrl || !companyName || !action || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let xmlBody = '';

    switch (action) {
      case 'create-ledger': {
        const addressXml = data.address ? `<ADDRESS.LIST><ADDRESS>${escapeXml(data.address)}</ADDRESS></ADDRESS.LIST>` : '';
        const phoneXml = data.phone ? `<LEDGERPHONE>${escapeXml(data.phone)}</LEDGERPHONE>` : '';
        const emailXml = data.email ? `<LEDGEREMAIL>${escapeXml(data.email)}</LEDGEREMAIL>` : '';
        const gstXml = data.gstNumber ? `<PARTYGSTIN>${escapeXml(data.gstNumber)}</PARTYGSTIN>` : '';
        const obXml = data.openingBalance ? `<OPENINGBALANCE>${data.openingBalance}</OPENINGBALANCE>` : '';

        xmlBody = `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Import</TALLYREQUEST><TYPE>Data</TYPE><ID>All Masters</ID></HEADER>
  <BODY>
    <DESC><STATICVARIABLES><SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY></STATICVARIABLES></DESC>
    <DATA><TALLYMESSAGE xmlns:UDF="TallyUDF">
      <LEDGER NAME="${escapeXml(data.name)}" ACTION="Create">
        <NAME>${escapeXml(data.name)}</NAME>
        <PARENT>${escapeXml(data.parent)}</PARENT>
        ${obXml}${addressXml}${phoneXml}${emailXml}${gstXml}
      </LEDGER>
    </TALLYMESSAGE></DATA>
  </BODY>
</ENVELOPE>`;
        break;
      }

      case 'create-voucher': {
        let entriesXml = '';
        for (const entry of (data.ledgerEntries || [])) {
          const amount = entry.isDeemedPositive ? -Math.abs(entry.amount) : Math.abs(entry.amount);
          entriesXml += `
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>${escapeXml(entry.ledgerName)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>${entry.isDeemedPositive ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
            <AMOUNT>${amount}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>`;
        }

        xmlBody = `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Import</TALLYREQUEST><TYPE>Data</TYPE><ID>Vouchers</ID></HEADER>
  <BODY>
    <DESC><STATICVARIABLES><SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY></STATICVARIABLES></DESC>
    <DATA><TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="${escapeXml(data.voucherType)}" ACTION="Create">
        <DATE>${formatDate(data.date)}</DATE>
        <NARRATION>${escapeXml(data.narration)}</NARRATION>
        <VOUCHERTYPENAME>${escapeXml(data.voucherType)}</VOUCHERTYPENAME>
        <PARTYLEDGERNAME>${escapeXml(data.partyLedger)}</PARTYLEDGERNAME>${entriesXml}
      </VOUCHER>
    </TALLYMESSAGE></DATA>
  </BODY>
</ENVELOPE>`;
        break;
      }

      case 'create-sales-voucher': {
        let entriesXml = `
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>${escapeXml(data.patientName)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-${data.totalAmount}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>`;

        for (const item of (data.items || [])) {
          entriesXml += `
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>${escapeXml(item.ledgerName || 'Hospital Income')}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>${item.amount}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>`;
        }

        xmlBody = `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Import</TALLYREQUEST><TYPE>Data</TYPE><ID>Vouchers</ID></HEADER>
  <BODY>
    <DESC><STATICVARIABLES><SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY></STATICVARIABLES></DESC>
    <DATA><TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Sales" ACTION="Create">
        <DATE>${formatDate(data.date)}</DATE>
        <NARRATION>IPD Bill #${escapeXml(data.billNumber)}</NARRATION>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <PARTYLEDGERNAME>${escapeXml(data.patientName)}</PARTYLEDGERNAME>${entriesXml}
      </VOUCHER>
    </TALLYMESSAGE></DATA>
  </BODY>
</ENVELOPE>`;
        break;
      }

      case 'create-receipt-voucher': {
        const bankLedger = data.bankLedger || (data.paymentMode === 'Cash' ? 'Cash' : 'Bank Account');
        xmlBody = `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Import</TALLYREQUEST><TYPE>Data</TYPE><ID>Vouchers</ID></HEADER>
  <BODY>
    <DESC><STATICVARIABLES><SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY></STATICVARIABLES></DESC>
    <DATA><TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Receipt" ACTION="Create">
        <DATE>${formatDate(data.date)}</DATE>
        <NARRATION>Receipt #${escapeXml(data.receiptNumber)} from ${escapeXml(data.patientName)}</NARRATION>
        <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
        <PARTYLEDGERNAME>${escapeXml(data.patientName)}</PARTYLEDGERNAME>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(bankLedger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${data.amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(data.patientName)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${data.amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      </VOUCHER>
    </TALLYMESSAGE></DATA>
  </BODY>
</ENVELOPE>`;
        break;
      }

      case 'create-cost-centre': {
        xmlBody = `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Import</TALLYREQUEST><TYPE>Data</TYPE><ID>All Masters</ID></HEADER>
  <BODY>
    <DESC><STATICVARIABLES><SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY></STATICVARIABLES></DESC>
    <DATA><TALLYMESSAGE xmlns:UDF="TallyUDF">
      <COSTCENTRE NAME="${escapeXml(data.name)}" ACTION="Create">
        <NAME>${escapeXml(data.name)}</NAME>
        ${data.parent ? `<PARENT>${escapeXml(data.parent)}</PARENT>` : ''}
      </COSTCENTRE>
    </TALLYMESSAGE></DATA>
  </BODY>
</ENVELOPE>`;
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const tallyResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const responseText = await tallyResponse.text();
      const result = parseResponse(responseText);

      return NextResponse.json(result);
    } catch (fetchError) {
      clearTimeout(timeout);
      return NextResponse.json({
        success: false,
        message: fetchError.name === 'AbortError'
          ? 'Connection to Tally timed out'
          : `Cannot connect to Tally: ${fetchError.message}`,
      }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request: ' + (error as Error).message },
      { status: 400 }
    );
  }
}
