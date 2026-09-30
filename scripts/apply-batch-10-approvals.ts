import { prisma } from "../src/infrastructure/db/client";
import { posterReviewService } from "../src/modules/enrichment/poster-review-service";

export interface Batch10Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_10_APPROVALS: Batch10Candidate[] = [
  {
    "id": "cdaa7da9-6c8d-40d1-9ac5-5efc3c6873e3",
    "title": "Bhopal: A Prayer for Rain",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3d/Bhopal_a_prayer_for_rain_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Ravi Kumar; Cast: Martin Sheen, Mischa Barton"
  },
  {
    "id": "6c94cdc2-cd42-4b46-9e0e-2011acc4fe71",
    "title": "Boy Meets Girl Tholiprema Katha",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/9/9e/Boy_Meets_Girl_%28Tholiprema_Katha%29.jpg",
    "notes": "Official theatrical release poster; Dir: Vasanth Dayakar; Cast: Siddharth, Nikkitha"
  },
  {
    "id": "25fb40ff-e9fb-446e-8371-534d76a0e333",
    "title": "CityLights",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/2c/CityLights.jpg",
    "notes": "Official theatrical release poster; Dir: Hansal Mehta; Cast: Rajkummar Rao, Patralekha"
  },
  {
    "id": "ca5c3d98-ad2e-4dc4-8c83-fa7204a4e20c",
    "title": "Creature",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a4/Creature_3d.jpg",
    "notes": "Official theatrical release poster for Creature 3D; Dir: Vikram Bhatt; Cast: Bipasha Basu, Imran Abbas"
  },
  {
    "id": "70a39d59-052c-4ec7-9e68-da92c974053f",
    "title": "Dee Saturday Night",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/02/Dee-saturday-night-01.jpg",
    "notes": "Official theatrical release poster; Dir: Jay Prakash; Cast: Prashant Narayanan, Arif Zakaria"
  },
  {
    "id": "ba013d90-1024-4ba2-aa6d-9029900433eb",
    "title": "Eduru Leni Alexander",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/4f/Eduruleni_Alexander.jpg",
    "notes": "Official theatrical release poster; Dir: Raja Reddy; Cast: Taraka Ratna, Komal Jha"
  },
  {
    "id": "19262b56-af3f-4b9d-8b12-f7090cfb867e",
    "title": "Erra Bus",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/47/Erra_Bus_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Dasari Narayana Rao; Cast: Manchu Vishnu, Catherine Tresa"
  },
  {
    "id": "8607ee39-1938-41f0-9428-037f02d90bc3",
    "title": "Galata",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/8f/Galata_film_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Krishna; Cast: Srinivas, Haripriya"
  },
  {
    "id": "ec623221-079b-4068-8db7-31b1c04617df",
    "title": "Govindudu Andarivadele",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a8/Govindudu_Andarivadele_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Krishna Vamsi; Cast: Ram Charan, Kajal Agarwal"
  },
  {
    "id": "8a380f83-45eb-45a8-ba88-fa8988b6615b",
    "title": "Holiday: A Soldier Is Never Off Duty",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/b/b7/Holiday_-_A_Soldier_Is_Never_Off_Duty_%28poster%29.jpg",
    "notes": "Official theatrical release poster; Dir: A.R. Murugadoss; Cast: Akshay Kumar, Sonakshi Sinha"
  },
  {
    "id": "10d26d63-8101-4148-9f6a-e84aa16cce45",
    "title": "Honour Killing",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/f5/Honour_Killing_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Avtar Bhogal; Cast: Zara Sheikh, Sandeep Singh"
  },
  {
    "id": "a8033c8c-747d-4d98-ad94-5103426e4a2e",
    "title": "Hrudayam Ekkadunnadi",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/7e/Hrudayam_Ekkadunnadi.jpg",
    "notes": "Official theatrical release poster; Dir: Vi Anand; Cast: Krishna Madhav, Anusha"
  },
  {
    "id": "ccd782bf-f8b1-4f07-accd-04fb76dbde08",
    "title": "Jal",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/fe/Jal_Movie_Official_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Girish Malik; Cast: Purab Kohli, Tannishtha Chatterjee"
  },
  {
    "id": "7b4e5038-d368-435a-a426-e02a20ca25d8",
    "title": "Kaanchi: The Unbreakable",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/cb/Kaanchi..._poster.jpg",
    "notes": "Official theatrical release poster; Dir: Subhash Ghai; Cast: Mishti, Kartik Aaryan"
  },
  {
    "id": "7a39c0e3-58bb-4b4f-92e3-a7e8a5b7d8cc",
    "title": "Kamalatho Naa Prayanam",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/27/Kamalatho_Naa_Prayanam_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Narasimha Nandi; Cast: Sivaji, Archana Veda Sastry"
  },
  {
    "id": "31fd6843-7ccb-4bb7-ad79-31f707587db2",
    "title": "Kiraak",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/13/Kiraak.jpg",
    "notes": "Official theatrical release poster; Dir: Harik Devabhakthuni; Cast: Aniruddh, Chandini Tamilarasan"
  },
  {
    "id": "1406dc79-8edb-43bd-8b04-dc6ae922876a",
    "title": "Laddu Babu",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/58/Laddu_babu.jpg",
    "notes": "Official theatrical release poster; Dir: Ravi Babu; Cast: Allari Naresh, Poorna"
  },
  {
    "id": "2532f71e-dd6f-4294-bfe8-834f5a84c166",
    "title": "Maine Pyar Kiya",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/62/Maine_Pyar_Kiya_%282014_film%29_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Pradeep Madugula; Cast: Pradeep Ryan, Isha Talwar"
  },
  {
    "id": "d81e77e7-be55-4b3b-a6a7-995513128b0d",
    "title": "Manasunu Maaya Seyake",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/34/Manasunu_maaya_seyake.jpg",
    "notes": "Official theatrical release poster; Dir: Suresh P Kumar; Cast: Prince, Sethu"
  },
  {
    "id": "d7bff75e-01df-4717-899f-7d5cf62f7918",
    "title": "Mumbhai Connection",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/8d/Mumbhai_Connection_Poster_1.jpg",
    "notes": "Official theatrical release poster; Dir: Atlanta Nagendra; Cast: Rafiq Batcha, Srinivas"
  },
  {
    "id": "775c2053-354d-4943-ac16-cddb87f91e81",
    "title": "Naa Rakumarudu",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/6a/Naa_Rakumarudu.jpg",
    "notes": "Official theatrical release poster; Dir: T. Satya; Cast: Naveen Chandra, Ritu Varma"
  },
  {
    "id": "40c8adcc-46b5-4a7e-bcca-08b8bb3efd59",
    "title": "O Manishi Katha",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/4e/O_Manishi_Katha.jpg",
    "notes": "Official theatrical release poster; Dir: Radha Swamy Avula; Cast: Jagapati Babu, Kalyani"
  },
  {
    "id": "e0dee37d-77df-4cd9-8d3e-133c0290e996",
    "title": "Om-Dar-B-Dar",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/b/b5/Avant_Garde_Omdarbadar_Kamal_Swaroop_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Kamal Swaroop; Cast: Aditya Lakhia, Manish Gupta"
  },
  {
    "id": "8fb29a5d-c4a2-489b-ae2a-7bdc0e646efa",
    "title": "Paathasala",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/e0/PaatshalaTelugu.jpg",
    "notes": "Official theatrical release poster; Dir: Mahi V. Raghav; Cast: Nandu, Anu"
  },
  {
    "id": "f86a8f41-6fcd-4d41-ac11-98751d563461",
    "title": "Paisa",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/f3/Paisa_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Krishna Vamsi; Cast: Nani, Catherine Tresa"
  },
  {
    "id": "e1677094-283f-4d11-959a-2df45e372175",
    "title": "Pandavulu Pandavulu Tummeda",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/6e/Pandavulu_Pandavulu_Tummeda_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Sriwass; Cast: Mohan Babu, Manchu Vishnu"
  },
  {
    "id": "ebc9e8a2-720b-45a7-a728-9a15c6652511",
    "title": "Roar: Tigers of the Sundarbans",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/9/93/Poster_2-_Roar.jpg",
    "notes": "Official theatrical release poster; Dir: Kamal Sadanah; Cast: Abhinav Shukla, Varinder Singh Ghuman"
  },
  {
    "id": "aefded82-3095-4999-bf42-6226741a66f7",
    "title": "Room – The Mystery",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/37/Room-_The_Mystery_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Faizal Khan; Cast: Atif Jamil, Ibra Khan"
  },
  {
    "id": "66a9fc39-041b-4b8a-b936-e35e3abc85ba",
    "title": "Ugly",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/61/Movie_Poster_Ugly.jpg",
    "notes": "Official theatrical release poster; Dir: Anurag Kashyap; Cast: Abir Goswami, Girish Kulkarni"
  },
  {
    "id": "48ee6fa2-4a84-47b8-a790-65430368bc08",
    "title": "Ya Rab",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/87/Ya_Rab.jpg",
    "notes": "Official theatrical release poster; Dir: Hasnain Hyderabadwala; Cast: Manzar Sehbai, Ajaz Khan"
  },
  {
    "id": "abb973e6-90fe-4c77-8ad3-a484aef9a27a",
    "title": "Yamaleela 2",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3c/Yamaleela_2.jpg",
    "notes": "Official theatrical release poster; Dir: S. V. Krishna Reddy; Cast: Dr. K. V. Satish, Diah Nicolas"
  },
  {
    "id": "8dbf0a1d-4cea-46f5-91d2-6b06c8d2f267",
    "title": "Yuddham",
    "releaseYear": 2014,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a4/Yuddham_2014_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Bharathi Ganesh; Cast: Tarun Kumar, Yami Gautam"
  },
  {
    "id": "d30dc741-b39d-4bd1-921a-ee8b066578fc",
    "title": "3G - A Killer Connection",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/25/3G_Bollywood_film_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Shantanu, Sheershak Anand; Cast: Neil Nitin Mukesh, Sonal Chauhan"
  },
  {
    "id": "229deb27-72d9-490c-bdcd-c9aadb435510",
    "title": "Abbai Class Ammai Mass",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/73/Abbai_Class_Ammai_Mass_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Koneti Srinu; Cast: Varun Sandesh, Hariprriya"
  },
  {
    "id": "edf3087b-480f-4729-a6bc-94bc1c8697c3",
    "title": "ABCD: Any Body Can Dance",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/5b/Anybody-can-dance.jpg",
    "notes": "Official theatrical release poster; Dir: Remo D'Souza; Cast: Prabhu Deva, Ganesh Acharya"
  },
  {
    "id": "a912656e-43ac-4ffb-bb52-041ca1def444",
    "title": "B.A. Pass",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/ef/B_A_Pass_Theatrical_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Ajay Bahl; Cast: Shilpa Shukla, Shadab Kamal"
  },
  {
    "id": "8fb22e28-b76a-422d-be77-31086e77a57b",
    "title": "Backbench Student",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/cb/Back_Bench_Student_-_Movie_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Madhura Sreedhar Reddy; Cast: Mahat Raghavendra, Piaa Bajpai"
  },
  {
    "id": "6de69bd7-9d18-44a0-9133-eaf951636ab4",
    "title": "Chandee",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/9/97/Chandi_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: V. Samudra; Cast: Priyamani, R. Sarathkumar"
  },
  {
    "id": "f4c8b890-6d38-41b5-b727-ee0e52f79e1f",
    "title": "Dalam",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/78/Dalam_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Jeevan Reddy; Cast: Naveen Chandra, Piaa Bajpai"
  },
  {
    "id": "44bc4ada-54fa-48e5-b4f7-68fa6c324652",
    "title": "Jaffa",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/82/Jaffa_Telugu_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Vennela Kishore; Cast: Brahmanandam, Ali"
  },
  {
    "id": "19211e88-0edb-4558-b9cc-118aaceb5beb",
    "title": "Kaalicharan",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/e8/Kalicharan-poster.jpg",
    "notes": "Official theatrical release poster; Dir: Praveen Sri; Cast: Chaitanya Krishna, Chandini"
  },
  {
    "id": "cc87ae17-a24d-4134-b105-48ae42f822f1",
    "title": "Nenem...Chinna Pillana?",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/8f/Nenem%E2%80%A6Chinna_Pillana%3F.jpg",
    "notes": "Official theatrical release poster; Dir: P. Sunil Kumar Reddy; Cast: Rahul Ravindran, Tanvi Vyas"
  },
  {
    "id": "40de975e-7f17-4828-8241-6c45549aba43",
    "title": "Once Upon ay Time in Mumbai Dobaara!",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/b/b6/Once_Upon_ay_Time_in_Mumbai_Dobaara%21.jpg",
    "notes": "Official theatrical release poster; Dir: Milan Luthria; Cast: Akshay Kumar, Imran Khan"
  },
  {
    "id": "3465917d-5fca-4f92-9c92-1f4a1c20bdeb",
    "title": "Pelli Pustakam",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/03/Pelli_Pustakam_%282013_film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Ramakrishna Machakanti; Cast: Rahul, Neethi Taylor"
  },
  {
    "id": "280721da-b6de-4644-9e87-cbbed3321764",
    "title": "Ship of Theseus",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/9/98/Ship_of_Theseus_domestic_release_poster.jpg",
    "notes": "Official domestic theatrical release poster; Dir: Anand Gandhi; Cast: Aida Al-Khashef, Niraj Kabi"
  },
  {
    "id": "982da584-fa9d-43c5-8268-533cd24749cb",
    "title": "War Chhod Na Yaar",
    "releaseYear": 2013,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a5/War_Chhod_Na_Yaar_Theatrical_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Faraz Haider; Cast: Sharman Joshi, Jaaved Jaaferi"
  },
  {
    "id": "4c147384-1822-4678-94af-d82836bc1777",
    "title": "1920: The Evil Returns",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/e7/1920_Evil_Returns_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Bhushan Patel; Cast: Aftab Shivdasani, Tia Bajpai"
  },
  {
    "id": "72d90527-bfd0-4338-aede-069d591e191a",
    "title": "Ab Hoga Dharna Unlimited",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/c2/Ab_Hoga_Dharna_Unlimited.jpg",
    "notes": "Official theatrical release poster; Dir: Deepak Tanwar; Cast: Saurabh Malik, Rekha Rana"
  },
  {
    "id": "30ffc3bc-7829-4e30-be76-7ade4604d3cc",
    "title": "Ata Pata Laapata",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/0a/Ata_Pata_Laapata.jpg",
    "notes": "Official theatrical release poster; Dir: Rajpal Yadav; Cast: Rajpal Yadav, Ashutosh Rana"
  },
  {
    "id": "e125f295-8192-4a58-869e-ca7deb053707",
    "title": "Cameraman Gangatho Rambabu",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/72/Cameraman_gangatho_rambabu_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Puri Jagannadh; Cast: Pawan Kalyan, Tamannaah"
  },
  {
    "id": "721bea4a-d8d9-4dc4-a6cd-b196a68a0a75",
    "title": "Dammu",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/8e/Dammu_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Boyapati Srinu; Cast: Jr. NTR, Trisha Krishnan"
  },
  {
    "id": "7484c3e2-73db-4793-8a51-54ef598085d7",
    "title": "Dangerous Ishq",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/77/Dangerous_Ishhq_Poster.jpg",
    "notes": "Official theatrical release poster for Dangerous Ishhq; Dir: Vikram Bhatt; Cast: Karisma Kapoor, Rajneesh Duggal"
  },
  {
    "id": "8dcbd50b-c4b1-40d9-84d8-1294d67d217b",
    "title": "Denikaina Ready",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/b/b9/Denikaina_Ready_poster.jpg",
    "notes": "Official theatrical release poster; Dir: G.Nageswara Reddy; Cast: Vishnu Manchu, Hansika Motwani"
  },
  {
    "id": "d851a518-21a7-4ad4-9ab6-f1b94baf8438",
    "title": "Devasthanam",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/43/Devasthanam_%28film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Janardhana Maharshi; Cast: K. Viswanath, S. P. Balasubrahmanyam"
  },
  {
    "id": "9d707668-2438-4f1c-98ae-8ef74d71d298",
    "title": "Dream",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/26/Dream_2012TeluguMoviePoster.jpg",
    "notes": "Official theatrical release poster; Dir: Bhavani Shankar K; Cast: Rajendra Prasad, Pavani Reddy"
  },
  {
    "id": "5315910f-a102-4c1d-af7d-9120f0272c70",
    "title": "Ee Rojullo",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/70/Ee_Rojullo.jpg",
    "notes": "Official theatrical release poster; Dir: Maruthi; Cast: Srinivas, Reshma"
  },
  {
    "id": "ee040bb4-c0ab-4b71-a400-8193c3640964",
    "title": "Friends Book",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/29/Friends_Book.jpeg",
    "notes": "Official theatrical release poster; Dir: R. P. Patnaik; Cast: Nischal, Uday"
  },
  {
    "id": "f7733ccf-af9c-4c1a-b1db-677215cf80af",
    "title": "Gattu",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/52/Gattu_-_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Rajan Khosa; Cast: Sarvasva, Mohammad Samad"
  },
  {
    "id": "0fc59c19-8c97-4f8e-969b-3e9d828c468b",
    "title": "Jalpari: The Desert Mermaid",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3c/Jalpari_film_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Nila Madhab Panda; Cast: Rahul Singh, Suhasini Mulay"
  },
  {
    "id": "d8618a0b-766b-44f6-81ab-a50106a9b8ee",
    "title": "Ko Antey Koti",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/0a/Film_poster_of_Ko_Ante_Koti.jpg",
    "notes": "Official theatrical release poster; Dir: Anish Yohan Kuruvilla; Cast: Sharwanand, Priya Anand"
  },
  {
    "id": "55060f10-fe9a-47a3-b1f1-76dcd24222f2",
    "title": "Krishna Aur Kans",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/b/b8/KRISHNA_AUR_KANS.gif",
    "notes": "Official theatrical release poster; Dir: Vikram Veturi; Cast: Voice-over by Om Puri, Juhi Chawla"
  },
  {
    "id": "ac150864-6e99-4c8a-96ef-e60e7e923375",
    "title": "Love You To Death",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/d/df/Love_You_To_Death.jpg",
    "notes": "Official theatrical release poster; Dir: Rafeeg Ellias; Cast: Yuki Ellias, Chandan Roy Sanyal"
  },
  {
    "id": "490b5650-31a6-49d1-ac65-79d58e23a8a3",
    "title": "Love, Lies & Seeta",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/36/Love_Lies_and_Seeta_-_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Chandra Pemmaraju; Cast: Melanie Kannokada, Arjun Gupta"
  },
  {
    "id": "09cdeeec-876b-40d9-a747-6d96f3ebbdc1",
    "title": "Mem Vayasuku Vacham",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/34/Mem_Vayasuku_Vacham.jpg",
    "notes": "Official theatrical release poster; Dir: Trinadha Rao Nakkina; Cast: Tanish, Neeti Taylor"
  },
  {
    "id": "78050f92-3510-4813-a35f-4c4693f20a91",
    "title": "Midhunam",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/b/bd/Midhunam_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Tanikella Bharani; Cast: S. P. Balasubrahmanyam, Lakshmi"
  },
  {
    "id": "ae674fd2-390a-46cb-a9e5-fe0ad7786414",
    "title": "Nandeeswarudu",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/68/Nandeeswarudu_poster.JPG",
    "notes": "Official theatrical release poster; Dir: Srinu Yajarala; Cast: Taraka Ratna, Sheena Shahabadi"
  },
  {
    "id": "beaa1ebf-fd43-44f6-b7de-8ea8091b4456",
    "title": "Nuvvekkadunte Nenakkadunta",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/fb/Nuvvekkadunte_Nenakkadunta_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Subha Selvam; Cast: Uday Kiran, Shweta Basu Prasad"
  },
  {
    "id": "8ed18d12-be14-49d1-8ae8-db7711e67dcd",
    "title": "Onamalu",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/15/Onamalu_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Kranthi Madhav; Cast: Rajendra Prasad, Kalyani"
  },
  {
    "id": "d851b0d0-8f43-483d-8adb-ffd9a51d3eb9",
    "title": "Paanch Ghantey Mien Paanch Crore",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/74/Paanch_Ghantey_Mien_Paanch_Crore_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Faisal Saif; Cast: Meera, Abhishek Kumar"
  },
  {
    "id": "05d5e21b-8d8e-49aa-940b-95adc9b1a9cc",
    "title": "Raaz 3: The Third Dimension",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/9/95/Raaz_3d_movie_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Vikram Bhatt; Cast: Emraan Hashmi, Bipasha Basu"
  },
  {
    "id": "0b809e46-bff3-4b1b-ab0c-53d432b32aa7",
    "title": "Rushi",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/fc/Rushi_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Raj Madiraju; Cast: Arvind Krishna, Supriya"
  },
  {
    "id": "3a92b649-733f-4e9b-a555-ed2876e35219",
    "title": "Siva Manasulo Sruthi",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/88/SMS_Telugu_Film.jpg",
    "notes": "Official theatrical release poster; Dir: Thathineni Satya; Cast: Sudheer Babu, Regina Cassandra"
  },
  {
    "id": "8876f820-a900-4e6d-9829-05c247a4a497",
    "title": "Sri Vasavi Vaibhavam",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/9/90/Sri_Vasavi_Vaibhavam.jpg",
    "notes": "Official theatrical release poster; Dir: Udaya Bhaskar; Cast: Meena, Suhasini"
  },
  {
    "id": "17dcd895-c046-4cfa-8f64-0cf5d6ffcfc7",
    "title": "Sudigadu",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/e7/Sudigadu_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Bhimaneni Srinivasa Rao; Cast: Allari Naresh, Monal Gajjar"
  },
  {
    "id": "e6da733b-0cae-4336-8411-1c1d67d556ae",
    "title": "Tuneega Tuneega",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/1a/Tuneega_Tuneega_film_poster.jpg",
    "notes": "Official theatrical release poster; Dir: M. S. Raju; Cast: Sumanth Ashwin, Rhea Chakraborty"
  },
  {
    "id": "e2bd9b6d-39d1-4f80-9b1a-694a4717f1b5",
    "title": "Valentine's Night",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/29/Valentine%27s_Night.jpg",
    "notes": "Official theatrical release poster; Dir: Krishan Kumar; Cast: Payal Rohatgi, Sangram Singh"
  },
  {
    "id": "5a90d810-bb02-4e9a-9e84-e1c7a0b5e77a",
    "title": "Yamaho Yama: In America",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/ea/Yamaho_Yama.jpg",
    "notes": "Official theatrical release poster; Dir: Y. Jitender; Cast: Sairam Shankar, Parvati Melton"
  },
  {
    "id": "5041fa53-9915-4797-9318-a24ccb101734",
    "title": "Yamudiki Mogudu",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/7b/Yamudiki_Mogudu_2012_poster.jpg",
    "notes": "Official theatrical release poster; Dir: E. Satti Babu; Cast: Allari Naresh, Richa Panai"
  },
  {
    "id": "fde0b8a0-2137-4f4a-ad2e-70d1638a8be8",
    "title": "Yeh Khula Aasmaan",
    "releaseYear": 2012,
    "url": "https://upload.wikimedia.org/wikipedia/en/b/b4/Yeh_Khula_Aasmaan.jpg",
    "notes": "Official theatrical release poster; Dir: Gitanjali Sinha; Cast: Raghubir Yadav, Yashpal Sharma"
  },
  {
    "id": "fce72b88-c585-445f-af08-c17f127d98d6",
    "title": "404",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/e7/404_Movie_Poster.jpg",
    "notes": "Official theatrical release poster for 404: Error Not Found; Dir: Prawaal Raman; Cast: Rajvvir Aroraa, Imaad Shah"
  },
  {
    "id": "9d8b2f61-5882-4d95-9fcb-511a1916a111",
    "title": "Aakasame Haddu",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/30/Aakasame_Haddu.jpg",
    "notes": "Official theatrical release poster; Dir: Raavicharan; Cast: Navdeep, Rajeev Saluri"
  },
  {
    "id": "41e422f4-3908-432b-a4f8-2bdf5016faab",
    "title": "Brahmi Gadi Katha",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/2c/Brahmi_Gadi_Katha.jpg",
    "notes": "Official theatrical release poster; Dir: Eeshwar Reddy; Cast: Varun Sandesh, Asmita Sood"
  },
  {
    "id": "71eea08c-7c23-42d8-9fbe-ebbf1f9a30e0",
    "title": "Chattam",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/4e/Chattam_poster.JPG",
    "notes": "Official theatrical release poster; Dir: Arun Prasad P. A.; Cast: Jagapathi Babu, Vimala Raman"
  },
  {
    "id": "21875379-68c4-4a4e-b280-3b5aaf870a3c",
    "title": "Crackers",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/2a/Crackers3.jpg",
    "notes": "Official theatrical release poster; Dir: Anil Goyal; Cast: Nikhil Dwivedi, Smilie Suri"
  }
];

async function applyBatch10() {
  console.log("=== BATCH 10: APPLYING 84 APPROVED TARGET-PLAYABLE POSTERS ===");

  let approvedCount = 0;
  for (const c of BATCH_10_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      "admin-batch-10-media-completion",
      "ADMIN_MANUAL_VERIFIED"
    );
    console.log(`[APPROVED ${++approvedCount}/84] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log("\n=== VERIFYING DATABASE STATE ===");
  for (const c of BATCH_10_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log("ALL 84 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!");
}

if (require.main === module) {
  applyBatch10()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
