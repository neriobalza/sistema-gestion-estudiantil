import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _req: Request,
  { params }: RouteParams,
) {
  const { id } = await params;

  return NextResponse.json({ id, name: "User" });
}

export async function PUT(
  req: Request,
  { params }: RouteParams,
) {
  const { id } = await params;
  const body = await req.json();

  return NextResponse.json({
    message: "User updated",
    id,
    data: body,
  });
}

export async function DELETE(
  _req: Request,
  { params }: RouteParams,
) {
  const { id } = await params;

  return NextResponse.json({
    message: "User deleted",
    id,
  });
}
