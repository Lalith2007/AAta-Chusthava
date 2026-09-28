import { prisma } from '../src/infrastructure/db/client';
import { posterReviewService } from '../src/modules/enrichment/poster-review-service';

export interface Batch3Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_3_APPROVALS: Batch3Candidate[] = [
  {
    id: '73cce4e8-de5b-4c6d-b862-9f470f9357da',
    title: 'Dalari',
    releaseYear: 2023,
    url: 'https://upload.wikimedia.org/wikipedia/en/d/df/Dalari_movie_poster.png',
    notes: 'Official release poster; Dir: Gopal Reddy Kachidi; Cast: Rajeev Kanakala',
  },
  {
    id: '61dbd8cf-f9f0-4886-a1b2-fd6ade5ca3db',
    title: 'Guthlee Ladoo',
    releaseYear: 2023,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Guthlee_Ladoo_poster.jpeg',
    notes: 'Official theatrical poster; Dir: Ishrat R. Khan; Cast: Sanjay Mishra',
  },
  {
    id: '6e8a1b46-e265-40aa-90d8-cc9d5dc927d2',
    title: 'IB71',
    releaseYear: 2023,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/a3/IB71_film_poster.jpg',
    notes: 'Official theatrical poster; Dir: Sankalp Reddy; Cast: Vidyut Jammwal',
  },
  {
    id: '0297ada3-e203-4be8-910b-1b98bba4d685',
    title: 'Kacchey Limbu',
    releaseYear: 2023,
    url: 'https://upload.wikimedia.org/wikipedia/en/9/93/Kacchey_Limbu_film_poster.jpg',
    notes: 'Official release poster; Dir: Shubham Yogi; Cast: Radhika Madan',
  },
  {
    id: '9e5df1f7-603a-4a45-99d9-95b71618c3ef',
    title: 'Mother Teresa & Me',
    releaseYear: 2023,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/30/Mother_Teresa_%26_Me.jpg',
    notes: 'Official release poster; Dir: Kamal Musale; Cast: Banita Sandhu, Deepti Naval',
  },
  {
    id: '5548ad0e-5c97-4356-a76a-7bfc7ddc5043',
    title: 'Ranga Maarthaanda',
    releaseYear: 2023,
    url: 'https://upload.wikimedia.org/wikipedia/en/d/d8/Rangamarthanda.jpg',
    notes: 'Official theatrical release poster; Dir: Krishna Vamsi; Cast: Prakash Raj, Brahmanandam',
  },
  {
    id: '6931f23f-9855-418b-8b17-c9f71df111e6',
    title: 'The Lady Killer',
    releaseYear: 2023,
    url: 'https://upload.wikimedia.org/wikipedia/en/9/95/The_Lady_Killer.jpeg',
    notes: 'Official theatrical release poster; Dir: Ajay Bahl; Cast: Arjun Kapoor, Bhumi Pednekar',
  },
  {
    id: '09d2aef9-5d91-4ddd-8834-03ce5d180a5b',
    title: 'Attack: Part 1',
    releaseYear: 2022,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Attack_film_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Lakshya Raj Anand; Cast: John Abraham',
  },
  {
    id: '7ee7a326-0af5-490a-8886-2fa2d8aeedf8',
    title: 'Chup: Revenge of the Artist',
    releaseYear: 2022,
    url: 'https://upload.wikimedia.org/wikipedia/en/7/74/Chup-Revenge_of_The_Artist.jpeg',
    notes: 'Official theatrical release poster; Dir: R Balki; Cast: Sunny Deol, Dulquer Salmaan',
  },
  {
    id: '5d457cb0-dfcf-44ef-9513-fb397880b2ef',
    title: 'Dehati Disco',
    releaseYear: 2022,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/39/Dehati_disco.jpg',
    notes: 'Official theatrical release poster; Dir: Manoj Sharma; Cast: Ganesh Acharya, Ravi Kishan',
  },
  {
    id: 'ba9a2d21-4f26-4823-b36a-a5789f63b0b0',
    title: 'Konda',
    releaseYear: 2022,
    url: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Konda_film_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Ram Gopal Varma; Cast: Thrigun, Irra Mor',
  },
  {
    id: 'cb619d09-f4da-4c0e-b647-bcc01fbae45c',
    title: 'RK/RKay',
    releaseYear: 2022,
    url: 'https://upload.wikimedia.org/wikipedia/en/2/21/RK-Rkay_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Rajat Kapoor; Cast: Rajat Kapoor, Mallika Sherawat',
  },
  {
    id: '4f7336c6-60b8-484b-9cb1-7e7f5cd8a0d7',
    title: 'Sherdil',
    releaseYear: 2022,
    url: 'https://upload.wikimedia.org/wikipedia/en/5/56/Sherdil-The_Pilibhit_Saga_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Srijit Mukherji; Cast: Pankaj Tripathi',
  },
  {
    id: '06f2d076-5fbd-47e4-bf39-9934f4391feb',
    title: '99 Songs',
    releaseYear: 2021,
    url: 'https://upload.wikimedia.org/wikipedia/en/1/18/99_Songs_%28film_poster%29.jpg',
    notes: 'Official theatrical release poster; Dir: Vishwesh Krishnamoorthy; Writer & Prod: A. R. Rahman',
  },
  {
    id: 'e7bc0f69-96fd-47c3-b41f-6430ae44cb82',
    title: 'Bansuri: The Flute',
    releaseYear: 2021,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/89/BansuriTheFlute.jpeg',
    notes: 'Official theatrical release poster; Dir: Hari Viswanath; Cast: Anurag Kashyap',
  },
  {
    id: '1b722841-8bea-4032-8809-7acfaa2e80ad',
    title: 'Bombay Rose',
    releaseYear: 2021,
    url: 'https://upload.wikimedia.org/wikipedia/en/c/c0/Bombay_Rose_poster.jpg',
    notes: 'Official release poster; Dir: Gitanjali Rao; Venice / Netflix release',
  },
  {
    id: '40213e9d-9d44-4e3e-9a1e-2c9ba423a12b',
    title: 'Hum Bhi Akele Tum Bhi Akele',
    releaseYear: 2021,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/3f/Hum_Bhi_Akele_Tum_Bhi_Akele.jpg',
    notes: 'Official release poster; Dir: Harish Vyas; Cast: Zareen Khan, Anshuman Jha',
  },
  {
    id: '08df3009-0a21-448d-9f2d-2f48631e7502',
    title: 'Mera Fauji Calling',
    releaseYear: 2021,
    url: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Mera_Fauji_Calling.jpg',
    notes: 'Official theatrical release poster; Dir: Aaryaan Saxena; Cast: Sharman Joshi',
  },
  {
    id: 'b312b8e7-a79a-4ba0-b0aa-ea7500203493',
    title: 'State of Siege: Temple Attack',
    releaseYear: 2021,
    url: 'https://upload.wikimedia.org/wikipedia/en/2/20/State_of_Siege-_Temple_Attack_Poster.jpg',
    notes: 'Official release poster; Dir: Ken Ghosh; Cast: Akshaye Khanna',
  },
  {
    id: 'a8a2ca98-30d6-47df-aed6-6cc3aa357dab',
    title: 'Anukunnadi Okkati Ayyandhi Okati',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/a/ac/Anukunnadi_Okkati_Ayyandhi_Okati_poster.jpeg',
    notes: 'Official theatrical release poster; Dir: Baalu Adusumilli; Cast: Dhanya Balakrishna',
  },
  {
    id: '15c4e97c-d626-4556-a9bc-4254d9dea8e4',
    title: 'Axone',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/d/db/Axone_%28film%29_poster.jpg',
    notes: 'Official release poster; Dir: Nicholas Kharkongor; Cast: Sayani Gupta, Lin Laishram',
  },
  {
    id: '090cae43-d849-442c-9e73-2604675ccc20',
    title: 'Bahut Hua Samman',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/9/96/Bahut_Hua_Samman_film_Poster.jpg',
    notes: 'Official release poster; Dir: Ashish R Shukla; Cast: Raghav Juyal, Sanjay Mishra',
  },
  {
    id: '684a620e-3417-43f2-8bf5-4fa025923d12',
    title: 'Bhonsle',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/4/46/Bhonsle_%28film%29_poster.jpg',
    notes: 'Official release poster; Dir: Devashish Makhija; Cast: Manoj Bajpayee',
  },
  {
    id: '5b994290-fdb8-442c-90fb-e855d25654d8',
    title: 'Cargo',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/2/27/Cargo_2019_poster.jpg',
    notes: 'Official release poster; Dir: Arati Kadav; Cast: Vikrant Massey, Shweta Tripathi',
  },
  {
    id: '5bdbe43d-c287-4cc1-a299-aa9c16409e04',
    title: 'Choked',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/84/Choked_%28film%29_poster.jpg',
    notes: 'Official release poster; Dir: Anurag Kashyap; Cast: Saiyami Kher',
  },
  {
    id: '2fc697f0-bc20-4a9b-b82d-bdad15c8a4d3',
    title: 'Dolly Kitty Aur Woh Chamakte Sitare',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/2/24/Dolly_Kitty_Aur_Woh_Chamakte_Sitare.jpeg',
    notes: 'Official release poster; Dir: Alankrita Shrivastava; Cast: Konkona Sen Sharma, Bhumi Pednekar',
  },
  {
    id: '85b5dc19-28ea-4339-adad-2287eb40209f',
    title: 'Durgamati',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/8/83/Durgamati_poster.jpg',
    notes: 'Official release poster; Dir: G. Ashok; Cast: Bhumi Pednekar',
  },
  {
    id: '67317d5b-8668-4f35-bf2c-e466f10dcf58',
    title: 'Nirvana Inn',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/d/d9/Nirvana_Inn_poster.jpg',
    notes: 'Official release poster; Dir: Vijay Jayapal; Cast: Adil Hussain, Rajshri Deshpande',
  },
  {
    id: 'fda42037-e086-4ac7-8298-53cc872d9df2',
    title: 'Tanhaji',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/3/3f/Tanaji_film_poster.jpg',
    notes: 'Official theatrical release poster; Dir: Om Raut; Cast: Ajay Devgn, Saif Ali Khan, Kajol',
  },
  {
    id: 'a94b11fa-b81b-498f-95a3-3018525bed53',
    title: 'What Are the Odds',
    releaseYear: 2020,
    url: 'https://upload.wikimedia.org/wikipedia/en/b/be/What_Are_the_Odds_poster.jpg',
    notes: 'Official release poster; Dir: Megha Ramaswamy; Cast: Yashaswini Dayama, Karanvir Malhotra, Abhay Deol',
  },
];

async function applyBatch3() {
  console.log('=== BATCH 3: APPLYING 30 APPROVED TARGET-PLAYABLE POSTERS ===');

  let approvedCount = 0;
  for (const c of BATCH_3_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      'admin-batch-3-media-completion',
      'ADMIN_MANUAL_VERIFIED'
    );
    console.log(`[APPROVED ${++approvedCount}/30] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log('\n=== VERIFYING DATABASE STATE ===');
  for (const c of BATCH_3_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log('ALL 30 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!');
}

if (require.main === module) {
  applyBatch3()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
