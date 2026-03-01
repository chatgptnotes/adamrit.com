// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { serverUrl, xmlBody } = await request.json();

    if (!serverUrl || !xmlBody) {
      return NextResponse.json(
        { error: 'Missing serverUrl or xmlBody' },
        { status: 400 }
      );
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
      return NextResponse.json({ response: responseText });
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Connection to Tally server timed out (30s)' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: `Cannot connect to Tally server at ${serverUrl}: ${fetchError.message}` },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request: ' + (error as Error).message },
      { status: 400 }
    );
  }
}
