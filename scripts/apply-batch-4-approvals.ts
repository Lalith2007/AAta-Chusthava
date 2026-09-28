import { prisma } from '../src/infrastructure/db/client';
import { posterReviewService } from '../src/modules/enrichment/poster-review-service';

export interface Batch4Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_4_APPROVALS: Batch4Candidate[] = [
  {
    id: 'f4820650-7e2c-4c43-9872-ff8b891ce53a',
    title: 'Abhinetri 2',
    releaseYear: 2019,
    url: 'https://assets-in.bmscdn.com/iedb/movies/images/mobile/thumbnail/xlarge/abhinetri-2-et00101298-22-04-2019-08-13-20.jpg',
    notes: 'Official Telugu theatrical release poster; Dir: A. L. Vijay; Cast: Prabhu Deva, Tamannaah',
  },
  {
    id: 'e2d12768-cbd9-45b1-b8aa-0aa23901b8b4',
    title: 'Bhagyanagara Veedullo Gamattu',
    releaseYear: 2019,
    url: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Bhagyanagara_Veedullo_Gamattu.jpg',
    notes: 'Official theatrical release poster; Dir: Srinivasa Reddy; Cast: Srinivasa Reddy, Dollysha',
  },
  {
    id: '20bf42c3-ad0f-48dc-901a-f65bb293de0e',
    title: 'Burrakatha',
    releaseYear: 2019,
    url: 'https://upload.wikimedia.org/wikipedia/en/c/c2/Burra_Katha_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Diamond Ratna Babu; Cast: Aadi Saikumar, Mishti',
  },
  {
    id: '232b58b2-b258-4d69-af65-1b867c013f38',
    title: 'Chappad Phaad Ke',
    releaseYear: 2019,
    url: 'https://upload.wikimedia.org/wikipedia/en/4/46/Chappad_Phaad_Ke.jpeg',
    notes: 'Official release poster; Dir: Sameer Hemant Joshi; Cast: Vinay Pathak, Ayesha Raza Mishra',
  },
  {
    id: '85213698-ac70-491f-b6c5-924d07e1a938',
    title: 'Diksoochi',
    releaseYear: 2019,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/83/Diksoochi.jpg',
    notes: 'Official theatrical release poster; Dir: Dilip Kumar Salvadi; Cast: Dilip Kumar Salvadi, Chandni Bhagwanani',
  },
  {
    id: '8601ba16-02b4-416d-a62f-73d07a8d8064',
    title: 'Okate Life',
    releaseYear: 2019,
    url: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Okate_Life.jpg',
    notes: 'Official theatrical release poster; Dir: M. Venkat; Cast: Ramesh Choudary, Shruti Yugal',
  },
  {
    id: 'a0f514e2-40c9-4831-8b30-01907bb2c806',
    title: 'Prati Roju Pandage',
    releaseYear: 2019,
    url: 'https://upload.wikimedia.org/wikipedia/en/4/40/Prathi_Roju_Pandage.jpeg',
    notes: 'Official theatrical release poster; Dir: Maruthi; Cast: Sai Dharam Tej, Raashi Khanna, Sathyaraj',
  },
  {
    id: 'da027c95-00de-4bf5-ae5f-d7e16a2c8463',
    title: 'Raagala 24 Gantallo',
    releaseYear: 2019,
    url: 'https://upload.wikimedia.org/wikipedia/en/9/90/Raagala_24_Gantallo_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Srinivasa Reddy; Cast: Eesha Rebba, Satyadev',
  },
  {
    id: '1ff68cb4-d77e-4db4-aa1b-3618a1bca134',
    title: 'Viswamitra',
    releaseYear: 2019,
    url: 'https://upload.wikimedia.org/wikipedia/en/c/c2/Viswamitra_film_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Raajkiran; Cast: Prasanna, Nanditha Raj',
  },
  {
    id: '60b785c1-c8b8-4c91-91c2-b645a305e04c',
    title: 'Ascharyachakit!',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/52/Ascharya_Fuck_It_Poster.jpg',
    notes: 'Official release poster (Ascharya Fuck It); Dir: Samit Kakkad; Prod: Yoodlee Films',
  },
];

async function applyBatch4() {
  console.log('=== BATCH 4: APPLYING 10 APPROVED TARGET-PLAYABLE POSTERS ===');

  let approvedCount = 0;
  for (const c of BATCH_4_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      'admin-batch-4-media-completion',
      'ADMIN_MANUAL_VERIFIED'
    );
    console.log(`[APPROVED ${++approvedCount}/10] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log('\n=== VERIFYING DATABASE STATE ===');
  for (const c of BATCH_4_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log('ALL 10 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!');
}

if (require.main === module) {
  applyBatch4()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
