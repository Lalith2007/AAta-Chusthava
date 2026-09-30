import { prisma } from '../src/infrastructure/db/client';
import { posterReviewService } from '../src/modules/enrichment/poster-review-service';

export interface Batch8Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_8_APPROVALS: Batch8Candidate[] = [
  {
    id: 'cb9a39f9-aef4-4a50-934c-c0fb29c8e386',
    title: 'Meeku Meere Maaku Meme',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/4/45/Meeku_Meere_Maaku_Meme_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Hussain Sha Kiran; Cast: Tarun Shetty, Avantika Mishra',
  },
  {
    id: 'd2193edf-dc94-4d85-acda-3afd8117f29e',
    title: 'MSG: The Warrior Lion Heart',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/b/bb/MSG_the_warrior_lion_heart_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Gurmeet Ram Rahim Singh, Honeypreet Insan; Cast: Gurmeet Ram Rahim Singh',
  },
  {
    id: '7ed20d7a-de46-4664-8d78-822fa97ff8da',
    title: 'Nayaki',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/74/Nayaki_poster.jpg',
    notes: 'Official Telugu theatrical release poster; Dir: Goverdhan Reddy; Cast: Trisha, Ganesh Venkatraman',
  },
  {
    id: 'd28ed5d6-163b-4ff0-86cf-e5285a3722bf',
    title: 'Nee Jathaleka',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Nee_Jathaleka.jpg',
    notes: 'Official theatrical release poster; Dir: Lawerence Dasari; Cast: Naga Shourya, Parul Gulati',
  },
  {
    id: 'aacf5275-0ab3-4e85-9aaa-c993c53bce8c',
    title: 'OK Mein Dhokhe',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/33/OK_Mein_Dhokhe.jpg',
    notes: 'Official theatrical release poster; Dir: Utpal S. Chaudhary; Cast: Zoya Rathore, Sapan Krishna',
  },
  {
    id: 'd5f49c66-36e0-49f3-a67e-6a17649f5fde',
    title: 'Oka Manasu',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/f/f0/Niharika_Konidela%27s_Oka_Manasu.jpg',
    notes: 'Official theatrical release poster; Dir: Rama Raju Gottimukkala; Cast: Naga Shourya, Niharika Konidela',
  },
  {
    id: 'fb924b1e-79ab-4901-82b5-a71d41e97df3',
    title: 'Parched',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e4/Parched_film_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Leena Yadav; Cast: Tannishtha Chatterjee, Radhika Apte',
  },
  {
    id: 'f2975c7d-d60c-42e4-ac77-7a0125790565',
    title: 'Rojulu Marayi',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Rojulu_Marayi_%282016_film%29.jpg',
    notes: 'Official theatrical release poster; Dir: Murali Krishna Mudidani; Story: Maruthi; Cast: Chethan, Parwatheesham',
  },
  {
    id: 'b3755ec9-2a8f-4cfd-ba2b-201d6638a3f5',
    title: 'Saansein',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/e/e9/Saansein_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Rajiv S. Ruia; Cast: Rajneesh Duggal, Sonarika Bhadoria',
  },
  {
    id: '82201466-f66b-47ac-a9db-2705d768dfe6',
    title: 'Sahasam Swasaga Sagipo',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/ab/Sahasam_Swasaga_Sagipo.jpg',
    notes: 'Official Telugu theatrical release poster; Dir: Gautham Vasudev Menon; Cast: Naga Chaitanya, Manjima Mohan',
  },
  {
    id: '4261663f-8a4a-4aed-a4ea-fe676d9441e4',
    title: 'Sri Sri',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/85/Srisritelugufilm.jpg',
    notes: 'Official theatrical release poster; Dir: Muppalaneni Siva; Cast: Krishna, Vijaya Nirmala',
  },
  {
    id: 'e2edda74-ebb9-432c-b74a-f84c41c87cca',
    title: 'Tulasi Dalam',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Tulasi_Dalam.jpg',
    notes: 'Official theatrical release poster; Dir: R. P. Patnaik; Cast: Nischal, Vandana Gupta',
  },
  {
    id: '92f71ab1-d1a2-41cc-bd32-e379e1492123',
    title: 'Tum Bin II',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/e/ed/Tum_Bin_2_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Anubhav Sinha; Cast: Neha Sharma, Aditya Seal',
  },
  {
    id: 'a379d0ab-1bd9-4fdc-a648-94cb4cc445ff',
    title: 'Umrika',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/77/Umrika_-_Movie_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Prashant Nair; Cast: Prateik Babbar, Suraj Sharma',
  },
  {
    id: '387de0f7-bba7-4c77-b4ac-aa386f061d8a',
    title: 'Waarrior Savitri',
    releaseYear: 2016,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/7f/Poster_Of_Waarior_Savitri.jpg',
    notes: 'Official theatrical release poster; Dir: Param Gill; Cast: Niharica Raizada, Lucy Pinder',
  },
  {
    id: '5708c010-804d-46b8-a3fb-297329715f86',
    title: 'Andhra Pori',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/9/98/Andhra_Pori_poster.jpeg',
    notes: 'Official theatrical release poster; Dir: Raj Mudiraju; Cast: Akash Puri, Ulka Gupta',
  },
  {
    id: '04858055-f8a2-41a4-a7d0-de3fd3cc0daf',
    title: 'Bham Bolenath',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/f/fe/Bham_Bolenath_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Karthik Varma Dandu; Cast: Navdeep, Naveen Chandra',
  },
  {
    id: 'a82cd226-e431-4cb7-8e6a-a9ad8f946cad',
    title: 'Bruce Lee',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Bruce_Lee_The_Fighter.jpg',
    notes: 'Official theatrical release poster (Bruce Lee: The Fighter); Dir: Srinu Vaitla; Cast: Ram Charan, Rakul Preet Singh',
  },
  {
    id: '9f3fb820-c08d-4a48-b033-368ff1291dfc',
    title: 'Cinema Choopistha Mava',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Cinema_Choopistha_Mava.jpg',
    notes: 'Official theatrical release poster; Dir: Trinadha Rao Nakkina; Cast: Raj Tarun, Avika Gor',
  },
  {
    id: '69537e13-a053-47cb-b6ff-943e9f12fc96',
    title: 'Dilliwali Zaalim Girlfriend',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/ad/Dilliwali_Zaalim_Girlfriend.jpeg',
    notes: 'Official theatrical release poster; Dir: Japinder Kaur; Cast: Divyendu Sharma, Jackie Shroff',
  },
  {
    id: '06c06f53-1106-4247-9d16-6994351947e3',
    title: 'Dongaata',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Manchu_Lakshmi_Dongaata_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Vamsi Krishna; Cast: Lakshmi Manchu, Adivi Sesh',
  },
  {
    id: 'e4bf00fb-6b4b-4826-b7b6-bf6c9ef95376',
    title: 'Four Pillars of Basement',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/6/66/Four_Pillars_of_Basement_-_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Giresh Naik K; Cast: Dillzan Wadia, Bruna Abdullah',
  },
  {
    id: '80d7716d-ef3d-4f39-ba0f-22e95634fd41',
    title: 'Gaddam Gang',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Gaddam_Gang.jpg',
    notes: 'Official theatrical release poster; Dir: Santhosh P. Jayakumar; Cast: Rajasekhar, Sheena Shahabadi',
  },
  {
    id: '534a734e-1eb6-4761-b1b4-a05da076a14b',
    title: 'Gayakudu',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/0/0d/Gayakudu_movie_poster.jpeg',
    notes: 'Official theatrical release poster; Dir: Kamal. G; Cast: Ali Reza, Shriya Sharma',
  },
  {
    id: '04620c6d-d667-432c-84ce-a0bb29a348dc',
    title: 'Hitudu',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Hitudu_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Viplav; Cast: Jagapathi Babu, Meera Nandan',
  },
  {
    id: 'a87ad129-7403-404e-a7d9-010f44fe7718',
    title: 'I Love Desi',
    releaseYear: 2015,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/a0/I_Love_Desi_Theatrical_Poster.jpg',
    notes: 'Official theatrical release poster; Dir: Pankaj Batra; Cast: Vedant Bali, Priyanka Shah',
  },
];

async function applyBatch8() {
  console.log('=== BATCH 8: APPLYING 26 APPROVED TARGET-PLAYABLE POSTERS ===');

  let approvedCount = 0;
  for (const c of BATCH_8_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      'admin-batch-8-media-completion',
      'ADMIN_MANUAL_VERIFIED'
    );
    console.log(`[APPROVED ${++approvedCount}/26] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log('\n=== VERIFYING DATABASE STATE ===');
  for (const c of BATCH_8_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log('ALL 26 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!');
}

if (require.main === module) {
  applyBatch8()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
