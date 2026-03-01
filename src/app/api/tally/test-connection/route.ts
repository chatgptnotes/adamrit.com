// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { serverUrl, companyName } = await request.json();

    if (!serverUrl) {
      return NextResponse.json(
        { error: 'Missing serverUrl' },
        { status: 400 }
      );
    }

    const xmlBody = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>List of Companies</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${companyName ? `<SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>` : ''}
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const tallyResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseText = await tallyResponse.text();

      // Parse companies from response
      const companies = [];
      const companyMatches = responseText.match(/<NAME[^>]*>([^<]+)<\/NAME>/gi) || [];
      for (const match of companyMatches) {
        const name = match.replace(/<\/?NAME[^>]*>/gi, '').trim();
        if (name && !companies.includes(name)) {
          companies.push(name);
        }
      }

      const versionMatch = responseText.match(/<VERSION[^>]*>([^<]+)<\/VERSION>/i);
      const version = versionMatch ? versionMatch[1] : 'Connected';

      return NextResponse.json({
        connected: true,
        companies,
        version,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      return NextResponse.json({
        connected: false,
        companies: [],
        version: '',
        error: fetchError.name === 'AbortError'
          ? 'Connection timed out'
          : `Cannot reach Tally at ${serverUrl}`,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request: ' + (error as Error).message },
      { status: 400 }
    );
  }
}
