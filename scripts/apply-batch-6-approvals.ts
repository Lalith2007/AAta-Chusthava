import { prisma } from '../src/infrastructure/db/client';
import { posterReviewService } from '../src/modules/enrichment/poster-review-service';

export interface Batch6Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_6_APPROVALS: Batch6Candidate[] = [
  {
    id: '7fb2a218-75f8-4f22-9543-4a3335b43b00',
    title: 'Duvvada Jagannadham',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/72/DJ_film_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Harish Shankar; Cast: Allu Arjun, Pooja Hegde',
  },
  {
    id: '8132a760-5ded-4092-aa86-13f8a2126f39',
    title: 'Ek Thi Rani Aisi Bhi',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/6/6d/Ek_Thi_Rani_Aisi_Bhi.jpg',
    notes: 'Official theatrical release poster; Dir: Gul Bahar Singh; Cast: Hema Malini, Vinod Khanna',
  },
  {
    id: '08cbaec5-12d9-4e43-af56-2cd65c683628',
    title: 'Ghazi',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e7/The_Ghazi_Attack_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Sankalp Reddy; Cast: Rana Daggubati, Taapsee Pannu',
  },
  {
    id: '5c9af202-7e8f-4c78-82b1-8ad62732c9e0',
    title: 'Haraamkhor',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/c/c7/Haraamkhor.jpg',
    notes: 'Official theatrical release poster; Dir: Shlok Sharma; Cast: Nawazuddin Siddiqui, Shweta Tripathi',
  },
  {
    id: 'b755a21e-a402-414c-a349-6a843a7f5427',
    title: 'JD',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/52/JD_%28film%29_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Shailendra Pandey; Cast: Govind Namdev, Aman Verma',
  },
  {
    id: '9f82eef6-f582-4fab-8ce6-ab271110bf3d',
    title: 'Kadvi Hawa',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Kadvi_Hawa_-_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Nila Madhab Panda; Cast: Sanjay Mishra, Ranvir Shorey',
  },
  {
    id: 'dba11ec3-3560-4c99-b725-55d5c395511a',
    title: 'Middle Class Abbayi',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/0/0f/Middle_Class_Abbayi_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Venu Sree Raam; Cast: Nani, Sai Pallavi',
  },
  {
    id: '0eb75dde-3b9d-4d54-869d-650e0d845025',
    title: 'Mukti Bhawan',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/d/d0/Mukti_Bhawan_-_Poster.jpg',
    notes: 'Official theatrical release poster (Hotel Salvation); Dir: Shubhashish Bhutiani; Cast: Adil Hussain, Lalit Behl',
  },
  {
    id: '9cbc358c-fb42-48a8-bfb9-a0e0b8e75985',
    title: 'Poorna: Courage Has No Limit',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/84/Poorna_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Rahul Bose; Cast: Aditi Inamdar, Rahul Bose',
  },
];

async function applyBatch6() {
  console.log('=== BATCH 6: APPLYING 9 APPROVED TARGET-PLAYABLE POSTERS ===');

  let approvedCount = 0;
  for (const c of BATCH_6_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      'admin-batch-6-media-completion',
      'ADMIN_MANUAL_VERIFIED'
    );
    console.log(`[APPROVED ${++approvedCount}/9] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log('\n=== VERIFYING DATABASE STATE ===');
  for (const c of BATCH_6_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log('ALL 9 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!');
}

if (require.main === module) {
  applyBatch6()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
