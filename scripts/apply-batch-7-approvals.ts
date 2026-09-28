import { prisma } from '../src/infrastructure/db/client';
import { posterReviewService } from '../src/modules/enrichment/poster-review-service';

export interface Batch7Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_7_APPROVALS: Batch7Candidate[] = [
  {
    id: '3368453b-f8e6-4fe7-942f-b644d3a66db6',
    title: 'Saankal',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/1/18/Release_poster_of_movie_Saankal.jpg',
    notes: 'Official release poster; Dir: Dedipya Joshii; Cast: Tanima Bhattacharya, Chetan Sharma',
  },
  {
    id: '884fa02e-64e8-4cf1-b967-449954a722c8',
    title: 'Shab',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/33/Shab_-_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Onir; Cast: Raveena Tandon, Sanjay Suri',
  },
  {
    id: 'cef51be1-98cd-4bbd-ac7e-90b4f04b5697',
    title: 'Shamanthakamani',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Shamanthakamani.jpg',
    notes: 'Official theatrical release poster; Dir: Sriram Adittya; Cast: Nara Rohit, Sudheer Babu',
  },
  {
    id: '05154647-516a-4cd9-97db-2d7a6be7f5f4',
    title: 'The House Next Door',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/6/68/The_House_Next_Door_-_Poster.jpg',
    notes: 'Official theatrical release poster (Hindi version of Aval); Dir: Milind Rau; Cast: Siddharth, Andrea Jeremiah',
  },
  {
    id: 'd9a7efc0-5f75-4ad5-9efe-84abe72323c4',
    title: 'Toilet: Ek Prem Katha',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/1/12/Toilet_Ek_Prem_Katha.jpg',
    notes: 'Official theatrical release poster; Dir: Shree Narayan Singh; Cast: Akshay Kumar, Bhumi Pednekar',
  },
  {
    id: '09cf640f-a34b-4e56-af7e-3dea3629de86',
    title: 'Banthi Poola Janaki',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/58/Banthi_Poola_Janaki.jpg',
    notes: 'Official theatrical release poster; Dir: Nellutla Praveen Chander; Cast: Dhanraj, Diksha Panth',
  },
  {
    id: '6b869a04-6766-4547-bb79-35f62c46a3a2',
    title: 'Dandakaranyam',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/74/Dandakaranyam.jpg',
    notes: 'Official theatrical release poster; Dir: R. Narayana Murthy; Cast: R. Narayana Murthy, Gaddar',
  },
  {
    id: '1a89cb4d-5073-4b84-821c-f8e41f66ef02',
    title: 'Dhanak',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/89/Dhanak_theatrical_release_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Nagesh Kukunoor; Cast: Hetal Gadda, Krrish Chabbria',
  },
  {
    id: 'f0db1926-47b9-427a-b56e-12e709d0e681',
    title: 'Eedu Gold Ehe',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Eedu_Gold_Ehe_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Veeru Potla; Cast: Sunil, Richa Panai',
  },
  {
    id: '8caed9c4-4363-4421-a10a-731f28c4392c',
    title: 'Ghatana',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/5f/Ghatana_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Sripriya; Cast: Nithya Menen, Krish J. Sathaar',
  },
  {
    id: '8901d492-4396-47f1-9165-508d514fc7a7',
    title: 'Hora Hori',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Hora_Hori.jpg',
    notes: 'Official theatrical release poster; Dir: Teja; Cast: Dileep Reddy, Daksha Nagarkar',
  },
  {
    id: 'a71c5423-bc63-4db3-ab67-bd1721f19e98',
    title: 'Jayammu Nischayammu Raa',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Jayammu_Nischayammu_Raa_2016_Official_Poster.jpeg',
    notes: 'Official theatrical release poster; Dir: Shiva Raj Kanumuri; Cast: Srinivasa Reddy, Shamna Kasim',
  },
  {
    id: '04482fc3-d10e-4598-9379-d4d1a139f537',
    title: 'Kahaani 2: Durga Rani Singh',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/34/Kahaani_2_film_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Sujoy Ghosh; Cast: Vidya Balan, Arjun Rampal',
  },
  {
    id: '3b9c0d6d-18b4-482a-98c2-1ec25cf0c23b',
    title: 'Lacchimdeviki O Lekkundi',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/59/LOL_Movie_Poster.png',
    notes: 'Official theatrical release poster; Dir: Jagadish Talasila; Cast: Lavanya Tripathi, Naveen Chandra',
  },
  {
    id: '159d1247-344d-45d6-9e78-19db8aee9a81',
    title: 'Manalo Okkadu',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/c/c3/Manalo_Okkadu.jpg',
    notes: 'Official theatrical release poster; Dir: R. P. Patnaik; Cast: R. P. Patnaik, Anita Hassanandani Reddy',
  },
];

async function applyBatch7() {
  console.log('=== BATCH 7: APPLYING 15 APPROVED TARGET-PLAYABLE POSTERS ===');

  let approvedCount = 0;
  for (const c of BATCH_7_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      'admin-batch-7-media-completion',
      'ADMIN_MANUAL_VERIFIED'
    );
    console.log(`[APPROVED ${++approvedCount}/15] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log('\n=== VERIFYING DATABASE STATE ===');
  for (const c of BATCH_7_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log('ALL 15 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!');
}

if (require.main === module) {
  applyBatch7()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
