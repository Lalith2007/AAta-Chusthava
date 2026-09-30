import { prisma } from '../src/infrastructure/db/client';
import { posterReviewService } from '../src/modules/enrichment/poster-review-service';

export interface Batch9Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_9_APPROVALS: Batch9Candidate[] = [
  {
    id: '42007943-8b42-418e-991f-b13ca3c53385',
    title: 'Kaki: Sound of Warning',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Kaki_%28film%29.png',
    notes: 'Official Telugu theatrical release poster; Dir: Manon M; Cast: Ashok, Meghashree',
  },
  {
    id: '413ef4d5-f627-4883-b732-fac53f364cb6',
    title: 'Ladies & Gentleman',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/a4/Ladies_and_Gentlemen_Movie_Poster.jpg',
    notes: 'Official Telugu theatrical release poster; Dir: P B Manjunath; Cast: Adivi Sesh, Chaitanya Krishna',
  },
  {
    id: 'a017a63c-3821-45fb-94fc-6a2d17df691b',
    title: 'Lion of Gujarat',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/a8/Lion_of_Gujarat_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Dinesh Lamba; Cast: Dinesh Lamba, Akruti Agrawal',
  },
  {
    id: '401cf2b4-22e7-493f-8fe3-9efa4a8c87b8',
    title: 'Malli Malli Idi Rani Roju',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/2/2e/Malli_Malli_Idi_Rani_Roju_Movie_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Kranthi Madhav; Cast: Sharwanand, Nithya Menen',
  },
  {
    id: '20b54685-6a44-466f-ac7b-0956847c5a71',
    title: 'Meeruthiya Gangster',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Meeruthiya_Gangsters.jpg',
    notes: 'Official theatrical release poster; Dir: Zeishan Quadri; Cast: Jaideep Ahlawat, Aakash Dahiya',
  },
  {
    id: '0a29fbb8-a8b5-4efd-9894-a79474143bd8',
    title: 'Mere Genie Uncle',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Mere_Genie_Uncle_%28movie_poster%29.png',
    notes: 'Official theatrical release poster; Dir: Ashish Bhavsar; Cast: Tiku Talsania, Swati Kapoor',
  },
  {
    id: '83fa9e95-f4f4-43fb-bb7f-f6a261d26349',
    title: 'Mirchi Lanti Kurradu',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e3/Mirch_Lanti_Kurradu_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Jayanag; Cast: Abijeet, Pragya Jaiswal',
  },
  {
    id: '139143a0-a36d-45fe-b786-3e0ef1659735',
    title: 'MSG: The Messenger',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/4/45/MSG_The_Messenger_of_God_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Gurmeet Ram Rahim Singh, Jeetu Arora; Cast: Gurmeet Ram Rahim Singh, Daniel Kaleb',
  },
  {
    id: '61765eb6-363c-4c0a-b187-ba92c7b7b4a2',
    title: 'Mumbai Can Dance Saala',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/1/1e/Mumbai_Can_Dance_Saala.Jpg',
    notes: 'Official theatrical release poster; Dir: Sachindra Sharma; Cast: Ashima Sharma, Prashant Narayanan',
  },
  {
    id: '0e1245d4-d77b-49ec-a4f3-074ba508efc7',
    title: 'Noothi Lo Kappalu',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e7/Noothi_Lo_Kappalu.jpeg',
    notes: 'Official theatrical release poster; Dir: Chanti Gnamami; Cast: Rajendra Prasad, Pari Singh',
  },
  {
    id: '6b5d2faf-7792-4198-b586-b20a3b62a40d',
    title: 'Qissa',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/4/40/Qissa_Vertical_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Anup Singh; Cast: Irrfan Khan, Tillotama Shome',
  },
  {
    id: 'b3cbfa40-42d4-4e9c-8334-720e9500bc3d',
    title: 'S/O Satyamurthy',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/81/Son_of_Satyamurthy_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Trivikram Srinivas; Cast: Allu Arjun, Upendra',
  },
  {
    id: '566e7248-c37c-48eb-8c6c-52f2c86ec30f',
    title: 'Sabki Bajegi Band',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Sabki_Bajegi_Band_Official_First_Look.jpg',
    notes: 'Official theatrical release poster; Dir: Anirudh Chawla; Cast: Sumeet Vyas, Swara Bhaskar',
  },
  {
    id: 'c59c4701-4b46-4b23-84b2-c96079e60601',
    title: 'Size Zero',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/1/1a/Size_Zero_Telugu_Poster.jpg',
    notes: 'Official Telugu theatrical release poster; Dir: Prakash Kovelamudi; Cast: Arya, Anushka Shetty',
  },
  {
    id: 'c3ac74dc-cef8-454d-ab09-7d1b6ea3705b',
    title: 'Sorry Daddy',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Sorry_Daddy_Movie_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Vijay Pal and Shakur; Cast: Shamim Khan, Mukesh Tiwari',
  },
  {
    id: '9e34fa3c-281f-4d67-9af6-a9330915fe0e',
    title: 'Superstar Kidnap',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/59/Superstar_Kidnap_poster.jpg',
    notes: 'Official theatrical release poster; Dir: A.Sushanth Reddy; Cast: Nandu, Aadarsh Balakrishna',
  },
  {
    id: 'aac119e9-8088-41e2-97b2-2406e6376108',
    title: 'Take It Easy',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/1/11/Take_It_Easy.jpg',
    notes: 'Official theatrical release poster; Dir: Sunil Prem Vyas; Cast: Vikram Gokhale, Dipannita Sharma',
  },
  {
    id: 'b7e39708-879f-44e3-94fb-8ce125d80ee0',
    title: 'Thanu Nenu',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/2/24/Thanu_Nenu.jpg',
    notes: 'Official theatrical release poster; Dir: Ram Mohan P.; Cast: Santosh Sobhan, Avika Gor',
  },
  {
    id: '7c946c3b-e245-4f2b-9532-1d45150f5c9f',
    title: 'Waiting',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/33/Waiting_%282015%29.jpg',
    notes: 'Official theatrical release poster; Dir: Anu Menon; Cast: Naseeruddin Shah, Kalki Koechlin',
  },
  {
    id: '058b3acd-0688-40a7-a7d6-4e6613595aaf',
    title: 'Yevade Subramanyam',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/6/68/Yevade_Subramanyam.jpg',
    notes: 'Official theatrical release poster; Dir: Nag Ashwin; Cast: Nani, Vijay Deverakonda',
  },
  {
    id: 'dc3b226f-6a29-4a67-ae3d-bb165087daee',
    title: '3 A.M.',
    releaseYear: 2014,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/7e/3am_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Vishal Mahadkar; Cast: Rannvijay Singh, Anindita Nayar',
  },
  {
    id: 'd54642c3-30d7-484d-ace1-622d53678713',
    title: 'Aa Aiduguru',
    releaseYear: 2014,
    url: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aa_Aiduguru.jpg',
    notes: 'Official theatrical release poster; Dir: Anil Gurudu; Cast: Kranthi Kumar, Tanishq Reddy',
  },
  {
    id: 'c135fdc6-47df-4042-b7de-1d298a7093ae',
    title: 'Ala Ela',
    releaseYear: 2014,
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Ala_Ela.jpeg',
    notes: 'Official theatrical release poster; Dir: Aneesh Krishna; Cast: Rahul Ravindran, Bhanu Sri Mehra',
  },
  {
    id: '531c3c24-2ed8-4d3b-b06d-033f5cc580aa',
    title: 'Amrutham Chandamamalo',
    releaseYear: 2014,
    url: 'https://upload.wikimedia.org/wikipedia/en/1/1b/Amrutham_Chandamamalo_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Gunnam Gangaraju; Cast: Srinivas Avasarala, Harish',
  },
  {
    id: '70405483-8536-40b2-9493-ebe0f832e197',
    title: 'Anuradha',
    releaseYear: 2014,
    url: 'https://upload.wikimedia.org/wikipedia/en/6/69/Anuradha_Hindi_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Raju Mavani; Cast: Sachin Khedekar, Smita Jaykar',
  },
  {
    id: '8fd1f24c-31e3-48c2-84c6-0e45ff650b01',
    title: 'April Fool',
    releaseYear: 2014,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/3b/April_Fool_2014_film_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Krishnaswamy Srikanth Iyengar; Cast: Jagapati Babu, Bhoomika Chawla',
  },
  {
    id: 'a457f50f-10d0-4c9e-8ad6-b5c0c9fb0438',
    title: 'Bangaru Kodipetta',
    releaseYear: 2014,
    url: 'https://upload.wikimedia.org/wikipedia/en/0/03/Firstlook-bangarukodipetta.jpg',
    notes: 'Official theatrical release poster; Dir: Raj Pippalla; Cast: Navdeep, Swati Reddy',
  },
];

async function applyBatch9() {
  console.log('=== BATCH 9: APPLYING 27 APPROVED TARGET-PLAYABLE POSTERS ===');

  let approvedCount = 0;
  for (const c of BATCH_9_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      'admin-batch-9-media-completion',
      'ADMIN_MANUAL_VERIFIED'
    );
    console.log(`[APPROVED ${++approvedCount}/27] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log('\n=== VERIFYING DATABASE STATE ===');
  for (const c of BATCH_9_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log('ALL 27 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!');
}

if (require.main === module) {
  applyBatch9()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
