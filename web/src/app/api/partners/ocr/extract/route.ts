import { NextResponse } from "next/server";
import { extractDocument, type OcrDocumentType } from "@/lib/partners/ocr";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    documentType?: OcrDocumentType;
    fileName?: string;
    textSample?: string;
  };

  const result = await extractDocument({
    documentType: body.documentType,
    fileName: body.fileName,
    textSample: body.textSample,
  });

  return NextResponse.json(result);
}
