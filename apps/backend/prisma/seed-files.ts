/* eslint-disable */
// One-off: add demo File rows to the seeded workspace so the document table
// shows every status. Safe to re-run (clears this workspace's files first).
import { PrismaClient, FileType, FileStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: 'demo-workspace' },
  });
  const owner = await prisma.user.findUnique({
    where: { email: 'premium@knowledgehub.com' },
  });
  if (!workspace || !owner) throw new Error('Run db:seed first.');

  await prisma.file.deleteMany({ where: { workspaceId: workspace.id } });

  const base = {
    userId: owner.id,
    workspaceId: workspace.id,
    filePath: '/uploads/demo',
  };

  await prisma.file.createMany({
    data: [
      {
        ...base,
        filename: 'msa.pdf',
        originalName: 'Master_Services_Agreement.pdf',
        mimeType: 'application/pdf',
        size: 2_517_000,
        fileType: FileType.PDF,
        status: FileStatus.PROCESSED,
        processedAt: new Date(),
      },
      {
        ...base,
        filename: 'handbook.docx',
        originalName: 'Onboarding_Handbook.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 3_880_000,
        fileType: FileType.DOCX,
        status: FileStatus.PROCESSED,
        processedAt: new Date(),
      },
      {
        ...base,
        filename: 'notes.txt',
        originalName: 'meeting_notes.txt',
        mimeType: 'text/plain',
        size: 14_336,
        fileType: FileType.TXT,
        status: FileStatus.PROCESSED,
        processedAt: new Date(),
      },
      {
        ...base,
        filename: 'q3.docx',
        originalName: 'Q3_Vendor_Report.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 860_160,
        fileType: FileType.DOCX,
        status: FileStatus.PROCESSING,
      },
      {
        ...base,
        filename: 'invoice.pdf',
        originalName: 'scanned_invoice_0942.pdf',
        mimeType: 'application/pdf',
        size: 1_153_434,
        fileType: FileType.PDF,
        status: FileStatus.FAILED,
        errorMessage: 'No extractable text — needs OCR',
      },
    ],
  });

  const count = await prisma.file.count({
    where: { workspaceId: workspace.id },
  });
  console.log(`Inserted ${count} demo files into ${workspace.slug}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
