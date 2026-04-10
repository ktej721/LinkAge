import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { awardPoints } from '@/lib/award-points';

// POST: Senior accepts a specific response as the solution
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSession();
  if (!user || user.role !== 'senior') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { response_id } = await req.json();
  if (!response_id) {
    return NextResponse.json({ error: 'response_id is required.' }, { status: 400 });
  }

  const requestId = params.id;

  // Verify the request belongs to this senior and is still open
  let request;
  try {
    request = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, senior_id: true, status: true, expires_at: true }
    });
  } catch (reqErr) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }

  if (!request) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }
  if (request.senior_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  if (request.status === 'closed') {
    return NextResponse.json({ error: 'Request is already closed.' }, { status: 409 });
  }

  // Verify the response belongs to this request — also fetch helper_id for points
  let response;
  try {
    response = await prisma.response.findFirst({
      where: { id: response_id, request_id: requestId },
      select: { id: true, request_id: true, helper_id: true, is_approved: true }
    });
  } catch (respErr) {
    return NextResponse.json({ error: 'Response not found for this request.' }, { status: 404 });
  }

  if (!response) {
    return NextResponse.json({ error: 'Response not found for this request.' }, { status: 404 });
  }
  if (!response.is_approved) {
    return NextResponse.json({ error: 'This response is still under review and cannot be accepted yet.' }, { status: 422 });
  }

  // Clear any previous accepted_by_senior flags for this request (safety)
  await prisma.response.updateMany({
    where: { request_id: requestId },
    data: { accepted_by_senior: false }
  });

  try {
    // Mark the chosen response as accepted
    await prisma.response.update({
      where: { id: response_id },
      data: { accepted_by_senior: true }
    });

    // Close the request
    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'closed' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Award 50 points to the helper whose response was accepted
  await awardPoints(response.helper_id, 50, 'accepted_by_senior', response_id);

  return NextResponse.json({ success: true, message: 'Solution accepted! Request is now closed.' });
}
