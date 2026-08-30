import { PrismaClient, MovieLanguage, MovieIndustry, BoxOfficeStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedMovieData {
  slug: string;
  primaryTitle: string;
  originalTitle: string;
  alternativeTitles: string[];
  supportedLanguages: MovieLanguage[];
  industries: MovieIndustry[];
  releaseYear: number;
  releaseDate: string;
  certification: string;
  budget: number;
  boxOffice: number;
  boxOfficeStatus: BoxOfficeStatus;
  rating: number;
  ratingVoteCount: number;
  posterAsset: string;
  backdropAsset: string;
  directors: string[];
  musicDirectors: string[];
  leadActors: string[];
  leadActresses: string[];
  supportingCast: string[];
  productionHouses: string[];
  genres: string[];
}

const SEED_MOVIES: SeedMovieData[] = [
  // 1. RRR (2022) - Telugu
  {
    slug: 'rrr-2022',
    primaryTitle: 'RRR',
    originalTitle: 'రౌద్రం రణం రుధిరం',
    alternativeTitles: ['Roudram Ranam Rudhiram'],
    supportedLanguages: ['TELUGU', 'HINDI', 'TAMIL', 'MALAYALAM', 'KANNADA'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2022,
    releaseDate: '2022-03-25',
    certification: 'U/A',
    budget: 5500000000,
    boxOffice: 13870000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.0,
    ratingVoteCount: 165000,
    posterAsset: 'https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/x2O0oB1Lw96h55Z7vj2G0X7tW5o.jpg',
    directors: ['S. S. Rajamouli'],
    musicDirectors: ['M. M. Keeravaani'],
    leadActors: ['N. T. Rama Rao Jr.', 'Ram Charan'],
    leadActresses: ['Alia Bhatt', 'Olivia Morris'],
    supportingCast: ['Ajay Devgn', 'Shriya Saran', 'Samuthirakani'],
    productionHouses: ['DVV Entertainment'],
    genres: ['Action', 'Drama', 'History'],
  },
  // 2. Baahubali 2: The Conclusion (2017) - Telugu
  {
    slug: 'baahubali-2-the-conclusion-2017',
    primaryTitle: 'Baahubali 2: The Conclusion',
    originalTitle: 'బాహుబలి 2: ది కన్‌క్లూజన్',
    alternativeTitles: ['Baahubali 2', 'BB2'],
    supportedLanguages: ['TELUGU', 'TAMIL', 'HINDI', 'MALAYALAM'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2017,
    releaseDate: '2017-04-28',
    certification: 'U/A',
    budget: 2500000000,
    boxOffice: 18100000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.2,
    ratingVoteCount: 110000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/9/93/Baahubali_2_The_Conclusion_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['S. S. Rajamouli'],
    musicDirectors: ['M. M. Keeravaani'],
    leadActors: ['Prabhas', 'Rana Daggubati'],
    leadActresses: ['Anushka Shetty', 'Tamannaah Bhatia'],
    supportingCast: ['Ramya Krishnan', 'Sathyaraj', 'Nassar'],
    productionHouses: ['Arka Media Works'],
    genres: ['Action', 'Drama', 'Fantasy'],
  },
  // 3. Pushpa: The Rise (2021) - Telugu
  {
    slug: 'pushpa-the-rise-2021',
    primaryTitle: 'Pushpa: The Rise',
    originalTitle: 'పుష్ప: ది రైజ్',
    alternativeTitles: ['Pushpa 1', 'Pushpa'],
    supportedLanguages: ['TELUGU', 'HINDI', 'TAMIL', 'MALAYALAM', 'KANNADA'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2021,
    releaseDate: '2021-12-17',
    certification: 'U/A',
    budget: 2000000000,
    boxOffice: 3730000000,
    boxOfficeStatus: 'FINAL',
    rating: 7.6,
    ratingVoteCount: 52000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/7/75/Pushpa_-_The_Rise_%282021_film%29.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/x2O0oB1Lw96h55Z7vj2G0X7tW5o.jpg',
    directors: ['Sukumar'],
    musicDirectors: ['Devi Sri Prasad'],
    leadActors: ['Allu Arjun'],
    leadActresses: ['Rashmika Mandanna'],
    supportingCast: ['Fahadh Faasil', 'Sunil', 'Anasuya Bharadwaj', 'Ajay Ghosh'],
    productionHouses: ['Mythri Movie Makers', 'Muttamsetty Media'],
    genres: ['Action', 'Crime', 'Drama'],
  },
  // 4. Kalki 2898 AD (2024) - Telugu
  {
    slug: 'kalki-2898-ad-2024',
    primaryTitle: 'Kalki 2898 AD',
    originalTitle: 'కల్కి 2898 ఎడి',
    alternativeTitles: ['Project K', 'Kalki'],
    supportedLanguages: ['TELUGU', 'HINDI', 'TAMIL', 'MALAYALAM', 'KANNADA'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2024,
    releaseDate: '2024-06-27',
    certification: 'U/A',
    budget: 6000000000,
    boxOffice: 12000000000,
    boxOfficeStatus: 'FINAL',
    rating: 7.6,
    ratingVoteCount: 45000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kalki_2898_AD.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/stKGOm8wwhLEjxap05QKGxwTiwb.jpg',
    directors: ['Nag Ashwin'],
    musicDirectors: ['Santhosh Narayanan'],
    leadActors: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan'],
    leadActresses: ['Deepika Padukone', 'Disha Patani'],
    supportingCast: ['Saswata Chatterjee', 'Brahmanandam', 'Shobana'],
    productionHouses: ['Vyjayanthi Movies'],
    genres: ['Action', 'Sci-Fi', 'Fantasy'],
  },
  // 5. Ala Vaikunthapurramuloo (2020) - Telugu
  {
    slug: 'ala-vaikunthapurramuloo-2020',
    primaryTitle: 'Ala Vaikunthapurramuloo',
    originalTitle: 'అల వైకుంఠపురములో',
    alternativeTitles: ['AVPL'],
    supportedLanguages: ['TELUGU'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2020,
    releaseDate: '2020-01-12',
    certification: 'U/A',
    budget: 1000000000,
    boxOffice: 2800000000,
    boxOfficeStatus: 'FINAL',
    rating: 7.4,
    ratingVoteCount: 38000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/2/28/Ala_Vaikunthapurramuloo.jpeg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Trivikram Srinivas'],
    musicDirectors: ['S. Thaman'],
    leadActors: ['Allu Arjun'],
    leadActresses: ['Pooja Hegde'],
    supportingCast: ['Tabu', 'Jayaram', 'Sushanth', 'Murali Sharma', 'Samuthirakani'],
    productionHouses: ['Geetha Arts', 'Haarika & Hassine Creations'],
    genres: ['Action', 'Comedy', 'Drama'],
  },
  // 6. Rangasthalam (2018) - Telugu
  {
    slug: 'rangasthalam-2018',
    primaryTitle: 'Rangasthalam',
    originalTitle: 'రంగస్థలం',
    alternativeTitles: ['Rangasthalam 1985'],
    supportedLanguages: ['TELUGU'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2018,
    releaseDate: '2018-03-30',
    certification: 'U/A',
    budget: 600000000,
    boxOffice: 2160000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.2,
    ratingVoteCount: 32000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/5/5d/Rangasthalam.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Sukumar'],
    musicDirectors: ['Devi Sri Prasad'],
    leadActors: ['Ram Charan'],
    leadActresses: ['Samantha Ruth Prabhu'],
    supportingCast: ['Aadhi Pinisetty', 'Jagapathi Babu', 'Prakash Raj', 'Anasuya Bharadwaj'],
    productionHouses: ['Mythri Movie Makers'],
    genres: ['Action', 'Drama', 'Period'],
  },
  // 7. Pokiri (2006) - Telugu
  {
    slug: 'pokiri-2006',
    primaryTitle: 'Pokiri',
    originalTitle: 'పోకిరి',
    alternativeTitles: ['Pokiri 2006'],
    supportedLanguages: ['TELUGU'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2006,
    releaseDate: '2006-04-28',
    certification: 'U/A',
    budget: 120000000,
    boxOffice: 660000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.0,
    ratingVoteCount: 22000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/e/e4/Pokiri_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Puri Jagannadh'],
    musicDirectors: ['Mani Sharma'],
    leadActors: ['Mahesh Babu'],
    leadActresses: ['Ileana D\'Cruz'],
    supportingCast: ['Prakash Raj', 'Sayaji Shinde', 'Ashish Vidyarthi', 'Brahmanandam'],
    productionHouses: ['Vaishno Academy', 'Indira Productions'],
    genres: ['Action', 'Crime', 'Thriller'],
  },
  // 8. Magadheera (2009) - Telugu
  {
    slug: 'magadheera-2009',
    primaryTitle: 'Magadheera',
    originalTitle: 'మగధీర',
    alternativeTitles: [],
    supportedLanguages: ['TELUGU'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2009,
    releaseDate: '2009-07-31',
    certification: 'U/A',
    budget: 350000000,
    boxOffice: 1500000000,
    boxOfficeStatus: 'FINAL',
    rating: 7.7,
    ratingVoteCount: 24000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/7/70/Magadheera_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['S. S. Rajamouli'],
    musicDirectors: ['M. M. Keeravaani'],
    leadActors: ['Ram Charan'],
    leadActresses: ['Kajal Aggarwal'],
    supportingCast: ['Dev Gill', 'Srihari', 'Sarath Babu', 'Brahmanandam'],
    productionHouses: ['Geetha Arts'],
    genres: ['Action', 'Fantasy', 'Romance'],
  },
  // 9. Athadu (2005) - Telugu
  {
    slug: 'athadu-2005',
    primaryTitle: 'Athadu',
    originalTitle: 'అతడు',
    alternativeTitles: [],
    supportedLanguages: ['TELUGU'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2005,
    releaseDate: '2005-08-10',
    certification: 'U/A',
    budget: 160000000,
    boxOffice: 300000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.2,
    ratingVoteCount: 26000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Athadu_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Trivikram Srinivas'],
    musicDirectors: ['Mani Sharma'],
    leadActors: ['Mahesh Babu'],
    leadActresses: ['Trisha Krishnan'],
    supportingCast: ['Sonu Sood', 'Prakash Raj', 'Sayaji Shinde', 'Brahmanandam', 'Kota Srinivasa Rao'],
    productionHouses: ['Jayabheri Automotives'],
    genres: ['Action', 'Crime', 'Drama'],
  },
  // 10. Devara: Part 1 (2024) - Telugu
  {
    slug: 'devara-part-1-2024',
    primaryTitle: 'Devara: Part 1',
    originalTitle: 'దేవర: పార్ట్ 1',
    alternativeTitles: ['Devara'],
    supportedLanguages: ['TELUGU', 'HINDI', 'TAMIL', 'MALAYALAM', 'KANNADA'],
    industries: ['TOLLYWOOD'],
    releaseYear: 2024,
    releaseDate: '2024-09-27',
    certification: 'U/A',
    budget: 3000000000,
    boxOffice: 5100000000,
    boxOfficeStatus: 'FINAL',
    rating: 6.9,
    ratingVoteCount: 28000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/e/ec/Devara_Part_1.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/stKGOm8wwhLEjxap05QKGxwTiwb.jpg',
    directors: ['Koratala Siva'],
    musicDirectors: ['Anirudh Ravichander'],
    leadActors: ['N. T. Rama Rao Jr.', 'Saif Ali Khan'],
    leadActresses: ['Janhvi Kapoor'],
    supportingCast: ['Prakash Raj', 'Srikanth', 'Shine Tom Chacko'],
    productionHouses: ['Yuvasudha Arts', 'NTR Arts'],
    genres: ['Action', 'Drama', 'Thriller'],
  },

  // 11. Dangal (2016) - Hindi
  {
    slug: 'dangal-2016',
    primaryTitle: 'Dangal',
    originalTitle: 'दंगल',
    alternativeTitles: [],
    supportedLanguages: ['HINDI', 'TELUGU', 'TAMIL'],
    industries: ['BOLLYWOOD'],
    releaseYear: 2016,
    releaseDate: '2016-12-23',
    certification: 'U',
    budget: 700000000,
    boxOffice: 20240000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.4,
    ratingVoteCount: 198000,
    posterAsset: 'https://image.tmdb.org/t/p/w500/p2lVAcPuRPSO8Al6hDDGw0OgMi8.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Nitesh Tiwari'],
    musicDirectors: ['Pritam'],
    leadActors: ['Aamir Khan'],
    leadActresses: ['Fatima Sana Shaikh', 'Sanya Malhotra'],
    supportingCast: ['Sakshi Tanwar', 'Zaira Wasim', 'Aparshakti Khurana'],
    productionHouses: ['Aamir Khan Productions', 'Walt Disney Pictures India'],
    genres: ['Biography', 'Drama', 'Sports'],
  },
  // 12. 3 Idiots (2009) - Hindi
  {
    slug: '3-idiots-2009',
    primaryTitle: '3 Idiots',
    originalTitle: '3 इडियट्स',
    alternativeTitles: [],
    supportedLanguages: ['HINDI'],
    industries: ['BOLLYWOOD'],
    releaseYear: 2009,
    releaseDate: '2009-12-25',
    certification: 'U/A',
    budget: 550000000,
    boxOffice: 4600000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.4,
    ratingVoteCount: 220000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/d/df/3_idiots_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Rajkumar Hirani'],
    musicDirectors: ['Shantanu Moitra'],
    leadActors: ['Aamir Khan', 'R. Madhavan', 'Sharman Joshi'],
    leadActresses: ['Kareena Kapoor Khan'],
    supportingCast: ['Boman Irani', 'Omi Vaidya', 'Mona Singh'],
    productionHouses: ['Vinod Chopra Films'],
    genres: ['Comedy', 'Drama'],
  },
  // 13. Jawan (2023) - Hindi
  {
    slug: 'jawan-2023',
    primaryTitle: 'Jawan',
    originalTitle: 'जवान',
    alternativeTitles: [],
    supportedLanguages: ['HINDI', 'TELUGU', 'TAMIL'],
    industries: ['BOLLYWOOD'],
    releaseYear: 2023,
    releaseDate: '2023-09-07',
    certification: 'U/A',
    budget: 3000000000,
    boxOffice: 11480000000,
    boxOfficeStatus: 'FINAL',
    rating: 7.0,
    ratingVoteCount: 55000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/3/39/Jawan_film_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Atlee'],
    musicDirectors: ['Anirudh Ravichander'],
    leadActors: ['Shah Rukh Khan', 'Vijay Sethupathi'],
    leadActresses: ['Nayanthara', 'Deepika Padukone'],
    supportingCast: ['Priyamani', 'Sanya Malhotra', 'Sunil Grover'],
    productionHouses: ['Red Chillies Entertainment'],
    genres: ['Action', 'Thriller'],
  },
  // 14. Pathaan (2023) - Hindi
  {
    slug: 'pathaan-2023',
    primaryTitle: 'Pathaan',
    originalTitle: 'पठान',
    alternativeTitles: [],
    supportedLanguages: ['HINDI', 'TELUGU', 'TAMIL'],
    industries: ['BOLLYWOOD'],
    releaseYear: 2023,
    releaseDate: '2023-01-25',
    certification: 'U/A',
    budget: 2250000000,
    boxOffice: 10500000000,
    boxOfficeStatus: 'FINAL',
    rating: 6.6,
    ratingVoteCount: 60000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/c/c3/Pathaan_film_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Siddharth Anand'],
    musicDirectors: ['Vishal-Shekhar'],
    leadActors: ['Shah Rukh Khan', 'John Abraham'],
    leadActresses: ['Deepika Padukone'],
    supportingCast: ['Dimple Kapadia', 'Ashutosh Rana', 'Salman Khan'],
    productionHouses: ['Yash Raj Films'],
    genres: ['Action', 'Adventure', 'Thriller'],
  },
  // 15. Stree 2 (2024) - Hindi
  {
    slug: 'stree-2-2024',
    primaryTitle: 'Stree 2',
    originalTitle: 'स्त्री 2',
    alternativeTitles: ['Stree 2: Sarkate Ka Aatank'],
    supportedLanguages: ['HINDI'],
    industries: ['BOLLYWOOD'],
    releaseYear: 2024,
    releaseDate: '2024-08-15',
    certification: 'U/A',
    budget: 600000000,
    boxOffice: 8740000000,
    boxOfficeStatus: 'FINAL',
    rating: 7.4,
    ratingVoteCount: 35000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/4/4f/Stree_2_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/stKGOm8wwhLEjxap05QKGxwTiwb.jpg',
    directors: ['Amar Kaushik'],
    musicDirectors: ['Sachin-Jigar'],
    leadActors: ['Rajkummar Rao'],
    leadActresses: ['Shraddha Kapoor'],
    supportingCast: ['Pankaj Tripathi', 'Abhishek Banerjee', 'Aparshakti Khurana', 'Varun Dhawan'],
    productionHouses: ['Maddock Films', 'Jio Studios'],
    genres: ['Comedy', 'Horror'],
  },
  // 16. Swades (2004) - Hindi
  {
    slug: 'swades-2004',
    primaryTitle: 'Swades',
    originalTitle: 'स्वदेश',
    alternativeTitles: ['Swades: We, the People'],
    supportedLanguages: ['HINDI'],
    industries: ['BOLLYWOOD'],
    releaseYear: 2004,
    releaseDate: '2004-12-17',
    certification: 'U',
    budget: 220000000,
    boxOffice: 350000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.2,
    ratingVoteCount: 95000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/8/85/Swades_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Ashutosh Gowariker'],
    musicDirectors: ['A. R. Rahman'],
    leadActors: ['Shah Rukh Khan'],
    leadActresses: ['Gayatri Joshi'],
    supportingCast: ['Kishori Ballal', 'Rajesh Vivek', 'Daya Shankar Pandey'],
    productionHouses: ['Ashutosh Gowariker Productions', 'UTV Motion Pictures'],
    genres: ['Drama'],
  },
  // 17. Zindagi Na Milegi Dobara (2011) - Hindi
  {
    slug: 'zindagi-na-milegi-dobara-2011',
    primaryTitle: 'Zindagi Na Milegi Dobara',
    originalTitle: 'जिंदगी ना मिलेगी दोबारा',
    alternativeTitles: ['ZNMD'],
    supportedLanguages: ['HINDI'],
    industries: ['BOLLYWOOD'],
    releaseYear: 2011,
    releaseDate: '2011-07-15',
    certification: 'U/A',
    budget: 550000000,
    boxOffice: 1530000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.2,
    ratingVoteCount: 82000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/3/3d/Zindagi_Na_Milegi_Dobara.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Zoya Akhtar'],
    musicDirectors: ['Shankar-Ehsaan-Loy'],
    leadActors: ['Hrithik Roshan', 'Farhan Akhtar', 'Abhay Deol'],
    leadActresses: ['Katrina Kaif', 'Kalki Koechlin'],
    supportingCast: ['Naseeruddin Shah', 'Ariadna Cabrol'],
    productionHouses: ['Excel Entertainment'],
    genres: ['Adventure', 'Comedy', 'Drama'],
  },
  // 18. Andhadhun (2018) - Hindi
  {
    slug: 'andhadhun-2018',
    primaryTitle: 'Andhadhun',
    originalTitle: 'अंधाधुन',
    alternativeTitles: ['The Piano Player'],
    supportedLanguages: ['HINDI'],
    industries: ['BOLLYWOOD'],
    releaseYear: 2018,
    releaseDate: '2018-10-05',
    certification: 'U/A',
    budget: 320000000,
    boxOffice: 4560000000,
    boxOfficeStatus: 'FINAL',
    rating: 8.2,
    ratingVoteCount: 110000,
    posterAsset: 'https://upload.wikimedia.org/wikipedia/en/4/47/Andhadhun_poster.jpg',
    backdropAsset: 'https://image.tmdb.org/t/p/w1280/tVj7u9aG5g7x8d3s0YxP7K3m1.jpg',
    directors: ['Sriram Raghavan'],
    musicDirectors: ['Amit Trivedi'],
    leadActors: ['Ayushmann Khurrana'],
    leadActresses: ['Tabu', 'Radhika Apte'],
    supportingCast: ['Anil Dhawan', 'Zakir Hussain', 'Ashwini Kalsekar', 'Manav Vij'],
    productionHouses: ['Viacom18 Motion Pictures', 'Matchbox Pictures'],
    genres: ['Crime', 'Thriller', 'Black Comedy'],
  },
];

async function seed() {
  console.log('🌱 Starting AAta Chusthava Database Seed...');

  // 1. Create Default Ruleset
  const defaultRuleset = await prisma.gameRuleset.upsert({
    where: { name: 'DEFAULT_V1' },
    create: {
      name: 'DEFAULT_V1',
      maxAttempts: 10,
      enabledClues: [
        'LANGUAGE',
        'DIRECTOR',
        'PRODUCTION_HOUSE',
        'RELEASE_YEAR',
        'BOX_OFFICE',
        'RATING',
        'LEAD_ACTOR',
        'LEAD_ACTRESS',
        'SUPPORTING_CAST',
        'MUSIC_DIRECTOR',
        'GENRES',
      ],
      clueConfiguration: {
        yearCloseThreshold: 3,
        ratingCloseThreshold: 0.5,
        boxOfficeCloseThresholdAbsolute: 1000000000, // 100 Cr
      },
      hintConfiguration: {
        firstHintUnlockAttempt: 5,
        secondHintUnlockAttempt: 8,
      },
      duplicateGuessPolicy: 'REJECT_NO_PENALTY',
      targetEligibilityPolicy: 'PLAYABLE_AS_TARGET',
    },
    update: {},
  });
  console.log('✔ Ruleset DEFAULT_V1 configured.');

  // 2. Ingest Movies & People
  for (const m of SEED_MOVIES) {
    const movie = await prisma.movie.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        primaryTitle: m.primaryTitle,
        originalTitle: m.originalTitle,
        alternativeTitles: m.alternativeTitles,
        supportedLanguages: m.supportedLanguages,
        industries: m.industries,
        countries: ['IN'],
        releaseDate: new Date(m.releaseDate),
        releaseYear: m.releaseYear,
        canonicalIndiaReleaseDate: new Date(m.releaseDate),
        certification: m.certification,
        budget: m.budget,
        boxOffice: m.boxOffice,
        boxOfficeCurrency: 'INR',
        boxOfficeStatus: m.boxOfficeStatus,
        rating: m.rating,
        ratingVoteCount: m.ratingVoteCount,
        posterAsset: m.posterAsset,
        backdropAsset: m.backdropAsset,
        lifecycleStatus: 'ACTIVE',
      },
      update: {
        primaryTitle: m.primaryTitle,
        releaseYear: m.releaseYear,
        boxOffice: m.boxOffice,
        rating: m.rating,
      },
    });

    // Eligibility
    await prisma.gameEligibility.upsert({
      where: { movieId: movie.id },
      create: {
        movieId: movie.id,
        playableAsGuess: true,
        playableAsTarget: true,
        minimumMetadataComplete: true,
        reviewStatus: 'APPROVED',
        updatedAt: new Date(),
      },
      update: {
        playableAsGuess: true,
        playableAsTarget: true,
      },
    });

    // Genres
    for (const gName of m.genres) {
      const slug = gName.toLowerCase().replace(/[^\w]/g, '-');
      const genre = await prisma.genre.upsert({
        where: { slug },
        create: { canonicalName: gName, slug },
        update: {},
      });

      await prisma.movieGenre.upsert({
        where: { movieId_genreId: { movieId: movie.id, genreId: genre.id } },
        create: { movieId: movie.id, genreId: genre.id },
        update: {},
      });
    }

    // Production Houses
    for (const phName of m.productionHouses) {
      const ph = await prisma.productionHouse.upsert({
        where: { id: `ph-${phName.toLowerCase().replace(/[^\w]/g, '-')}` },
        create: {
          id: `ph-${phName.toLowerCase().replace(/[^\w]/g, '-')}`,
          canonicalName: phName,
        },
        update: {},
      });

      await prisma.movieProductionHouse.upsert({
        where: {
          movieId_productionHouseId_relationshipType: {
            movieId: movie.id,
            productionHouseId: ph.id,
            relationshipType: 'PRODUCTION',
          },
        },
        create: {
          movieId: movie.id,
          productionHouseId: ph.id,
          relationshipType: 'PRODUCTION',
        },
        update: {},
      });
    }

    // Directors
    for (const dName of m.directors) {
      const pId = `person-${dName.toLowerCase().replace(/[^\w]/g, '-')}`;
      const person = await prisma.person.upsert({
        where: { id: pId },
        create: { id: pId, canonicalName: dName },
        update: {},
      });

      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'DIRECTOR',
            relationType: 'CREW',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType: 'DIRECTOR',
          relationType: 'CREW',
          job: 'Director',
          department: 'Directing',
        },
        update: {},
      });
    }

    // Music Directors
    for (const mdName of m.musicDirectors) {
      const pId = `person-${mdName.toLowerCase().replace(/[^\w]/g, '-')}`;
      const person = await prisma.person.upsert({
        where: { id: pId },
        create: { id: pId, canonicalName: mdName },
        update: {},
      });

      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'MUSIC_DIRECTOR',
            relationType: 'CREW',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType: 'MUSIC_DIRECTOR',
          relationType: 'CREW',
          job: 'Music Director',
          department: 'Sound',
        },
        update: {},
      });
    }

    // Lead Actors
    for (const aName of m.leadActors) {
      const pId = `person-${aName.toLowerCase().replace(/[^\w]/g, '-')}`;
      const person = await prisma.person.upsert({
        where: { id: pId },
        create: { id: pId, canonicalName: aName },
        update: {},
      });

      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'LEAD',
            relationType: 'CAST',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType: 'LEAD',
          relationType: 'CAST',
        },
        update: {},
      });
    }

    // Lead Actresses
    for (const aName of m.leadActresses) {
      const pId = `person-${aName.toLowerCase().replace(/[^\w]/g, '-')}`;
      const person = await prisma.person.upsert({
        where: { id: pId },
        create: { id: pId, canonicalName: aName },
        update: {},
      });

      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'LEAD',
            relationType: 'CAST',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType: 'LEAD',
          relationType: 'CAST',
        },
        update: {},
      });
    }

    // Supporting Cast
    for (const sName of m.supportingCast) {
      const pId = `person-${sName.toLowerCase().replace(/[^\w]/g, '-')}`;
      const person = await prisma.person.upsert({
        where: { id: pId },
        create: { id: pId, canonicalName: sName },
        update: {},
      });

      await prisma.moviePerson.upsert({
        where: {
          movieId_personId_roleType_relationType: {
            movieId: movie.id,
            personId: person.id,
            roleType: 'SUPPORTING',
            relationType: 'CAST',
          },
        },
        create: {
          movieId: movie.id,
          personId: person.id,
          roleType: 'SUPPORTING',
          relationType: 'CAST',
        },
        update: {},
      });
    }
  }
  console.log(`✔ Ingested ${SEED_MOVIES.length} blockbuster movies across Tollywood & Bollywood.`);

  // 3. Create Admin User
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      email: 'admin@aatachusthava.com',
      passwordHash: 'argon2_hashed_placeholder_or_secret',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    },
    update: {},
  });
  console.log('✔ Admin user initialized.');

  // 4. Pre-schedule today's Daily Puzzle with RRR as first target
  const rrr = await prisma.movie.findUnique({ where: { slug: 'rrr-2022' } });
  if (rrr) {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingPuzzle = await prisma.dailyPuzzle.findUnique({
      where: { puzzleDate: todayStr },
    });

    if (!existingPuzzle) {
      const dailyGame = await prisma.game.create({
        data: {
          mode: 'DAILY',
          targetMovieId: rrr.id,
          rulesetId: defaultRuleset.id,
          maxAttempts: defaultRuleset.maxAttempts,
          status: 'ACTIVE',
        },
      });

      await prisma.dailyPuzzle.create({
        data: {
          puzzleDate: todayStr,
          gameId: dailyGame.id,
          targetMovieId: rrr.id,
          rulesetId: defaultRuleset.id,
          selectionMethod: 'CURATED',
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      });
      console.log(`✔ Scheduled today's Daily Puzzle (${todayStr}) with target: RRR (2022).`);
    }
  }

  console.log('🚀 Database Seed Complete!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
