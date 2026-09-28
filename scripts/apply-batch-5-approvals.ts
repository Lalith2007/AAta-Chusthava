import { prisma } from '../src/infrastructure/db/client';
import { posterReviewService } from '../src/modules/enrichment/poster-review-service';

export interface Batch5Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_5_APPROVALS: Batch5Candidate[] = [
  {
    id: 'ac399287-8954-49f0-befc-58400d9300d8',
    title: 'Brij Mohan Amar Rahe!',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/1/15/Brij_Mohan_Amar_Rahe.jpg',
    notes: 'Official Netflix/Yoodlee theatrical poster; Dir: Nikhil Bhat; Cast: Manav Vij',
  },
  {
    id: '1cc4c24c-2950-4105-913d-cf41c8cdcb07',
    title: 'Ee Nagariniki Emaindi',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/d/d2/Ee_Nagaraniki_Emaindi.jpg',
    notes: 'Official theatrical release poster; Dir: Tharun Bhascker Dhaassyam; Cast: Vishwak Sen, Sai Sushanth',
  },
  {
    id: 'e242050d-85be-4a7f-bb5d-1c12248afc0e',
    title: 'Husharu',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/30/Husharu.jpg',
    notes: 'Official theatrical release poster; Dir: Sree Harsha Konuganti; Cast: Tejus Kancherla, Tej Kurapati',
  },
  {
    id: '440e8348-c6c8-4edd-935f-65a58ec4e4d6',
    title: 'Krishnarjuna Yuddham',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/e/ea/Krishnarjuna_Yudham_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Merlapaka Gandhi; Cast: Nani, Anupama Parameswaran',
  },
  {
    id: 'f15b47ef-5409-4603-8cad-436852e3a8d7',
    title: 'MLA',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/9/9c/MLA_Telugu_Movie_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Upendra Madhav; Cast: Nandamuri Kalyan Ram, Kajal Aggarwal',
  },
  {
    id: 'c6820268-dd0b-44c1-bb7d-4c52aaf897b9',
    title: 'Premaku Raincheck',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/7d/Premaku_Raincheck.jpg',
    notes: 'Official theatrical release poster; Dir: Akella Peri Srinivas; Cast: Abhilash Vadada, Priya Vadlamani',
  },
  {
    id: '2c86b441-21da-446b-870c-3671fe034c17',
    title: 'Subrahmanyapuram',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/73/Subrahmanyapuram_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Santhosh Jagarlapudi; Cast: Sumanth, Eesha Rebba',
  },
  {
    id: '2a7cc562-1566-4eea-b764-f5bc3d35cd91',
    title: 'Taxiwaala',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/ad/Taxiwaala_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Rahul Sankrityayan; Cast: Vijay Devarakonda, Priyanka Jawlankar',
  },
  {
    id: '5c81ec93-fdc8-4ab9-8cd1-624df0f13eaf',
    title: 'Tigers',
    releaseYear: 2018,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/79/Tigers_Film.jpg',
    notes: 'Official release poster; Dir: Danis Tanović; Cast: Emraan Hashmi, Geetanjali Thapa',
  },
  {
    id: 'df825d09-8704-4376-a2c0-f00aeec4fa38',
    title: 'A Death in the Gunj',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/86/ADeathintheGunj.jpg',
    notes: 'Official theatrical release poster; Dir: Konkona Sen Sharma; Cast: Vikrant Massey, Ranvir Shorey',
  },
  {
    id: '9c48bda6-c67c-4bc6-971c-0d7c169e86e0',
    title: 'Baahubali: The Conclusion',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/9/93/Baahubali_2_The_Conclusion_poster.jpg',
    notes: 'Official theatrical release poster; Dir: S. S. Rajamouli; Cast: Prabhas, Anushka Shetty, Rana Daggubati',
  },
  {
    id: 'ef3aebf2-9995-4d04-873e-aae3f044e512',
    title: 'Commando 2',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/6/60/Commando-2_Poster.jpg',
    notes: 'Official theatrical release poster (Commando 2: The Black Money Trail); Dir: Deven Bhojani; Cast: Vidyut Jammwal, Adah Sharma',
  },
  {
    id: 'bf937cea-3a1e-4250-9f52-dd92eee72709',
    title: 'Darsakudu',
    releaseYear: 2017,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/33/Darsakudu_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Jakka Hari Prasad; Prod: Sukumar; Cast: Ashok Bandreddi, Eesha Rebba',
  },
];

async function applyBatch5() {
  console.log('=== BATCH 5: APPLYING 13 APPROVED TARGET-PLAYABLE POSTERS ===');

  let approvedCount = 0;
  for (const c of BATCH_5_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      'admin-batch-5-media-completion',
      'ADMIN_MANUAL_VERIFIED'
    );
    console.log(`[APPROVED ${++approvedCount}/13] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log('\n=== VERIFYING DATABASE STATE ===');
  for (const c of BATCH_5_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log('ALL 13 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!');
}

if (require.main === module) {
  applyBatch5()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
