import { prisma } from "../src/infrastructure/db/client";
import { posterReviewService } from "../src/modules/enrichment/poster-review-service";

export interface Batch11Candidate {
  id: string;
  title: string;
  releaseYear: number;
  url: string;
  notes: string;
}

export const BATCH_11_APPROVALS: Batch11Candidate[] = [
  {
    "id": "0d0829e2-e957-4fba-a1a5-f9bf82d755a9",
    "title": "Cricket Girls & Beer",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/58/Cricket_Girls_and_Beer_film.jpg",
    "notes": "Official theatrical release poster; Dir: S. Umesh Kumar; Cast: Adarsh Balakrishna, Surya Tej"
  },
  {
    "id": "278fcac4-ca6e-4e58-9c7d-ab32d1f432d7",
    "title": "Daggaraga Dooranga",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/38/Daggaraga_Dooranga.jpg",
    "notes": "Official theatrical release poster; Dir: Ravi Chavali; Cast: Sumanth, Vedhika"
  },
  {
    "id": "1a86f3be-ae9c-4b1c-b8dd-31ffe5dd9f0d",
    "title": "Dhobi Ghat",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/09/Dhobi_Ghat_Movie.jpg",
    "notes": "Official theatrical release poster; Dir: Kiran Rao; Cast: Prateik Babbar, Aamir Khan"
  },
  {
    "id": "dcae0f6d-b575-404f-8c23-98763414dd43",
    "title": "Dushasana",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/2d/Dushasana_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Posani Krishna Murali; Cast: Srikanth, Sanjana"
  },
  {
    "id": "2343f3bf-2557-43d4-9362-52dde836bebd",
    "title": "Haunted – 3D",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/4a/Haunted3D-filmposter.jpg",
    "notes": "Official theatrical release poster; Dir: Vikram Bhatt; Cast: Mahakshay Chakraborty, Twinkle Bajpai"
  },
  {
    "id": "2f2b0d22-71e9-46c4-a4cc-a64b4b247ff4",
    "title": "I Am Kalam",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/0e/I-am-kalam-2.jpg",
    "notes": "Official theatrical release poster; Dir: Nila Madhab Panda; Cast: Harsh Mayar, Gulshan Grover"
  },
  {
    "id": "d438962e-b7ae-41b4-a062-9a99eae91931",
    "title": "I Am Singh",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/fb/I_am_Singh.jpg",
    "notes": "Official theatrical release poster; Dir: Puneet Issar; Cast: Gulzar Inder Chahal, Rizwan Haider"
  },
  {
    "id": "20e105f2-6ee4-4a32-bd9f-6008b10d26ef",
    "title": "Keratam",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/0f/Keratam_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Gautam Patnaik; Cast: Siddharth Rajkumar, Rakul Preet Singh"
  },
  {
    "id": "00133dca-3fcb-4972-bd2f-114121bdc4f7",
    "title": "Khap",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/5f/Khap_film.jpg",
    "notes": "Official theatrical release poster; Dir: Ajai Sinha; Cast: Om Puri, Govind Namdev"
  },
  {
    "id": "50f91baf-3734-4172-a24b-3e9a290fc2a2",
    "title": "Koffi Bar",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/43/Koffi_Bar_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Geetha Krishna; Cast: Shashank, Bianca Desai"
  },
  {
    "id": "bf0a4d42-3a40-49a6-9149-c28f2a5373e2",
    "title": "Madatha Kaja",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/6c/Madatha_Kaja.jpg",
    "notes": "Official theatrical release poster; Dir: Seetarama Raju; Cast: Allari Naresh, Sneha Ullal"
  },
  {
    "id": "0ee23f7f-4ce1-4c17-ab9f-81255e20fbd9",
    "title": "Mod",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a2/Mod_-_2011_Indian_Movie_Poster.png",
    "notes": "Official theatrical release poster; Dir: Nagesh Kukunoor; Cast: Ayesha Takia, Rannvijay Singh"
  },
  {
    "id": "fbcdea8b-8c52-4bef-996e-1e04b78027cf",
    "title": "Money Money, More Money",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/70/Money_Money_More_Money.jpg",
    "notes": "Official theatrical release poster; Dir: J. D. Chakravarthy; Cast: J. D. Chakravarthy, Gajala"
  },
  {
    "id": "beb71c43-2f5c-4af5-82a3-863556ebf8fc",
    "title": "Mugguru",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a1/Mugguru_2011.jpg",
    "notes": "Official theatrical release poster; Dir: V. N. Aditya; Cast: Navdeep, Sivaji"
  },
  {
    "id": "07dc0c7f-fcd6-40a7-816e-3f7499bd7e69",
    "title": "Nagaram Nidrapotunna Vela",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/17/Nagaram_Nidrapotunna_Vela.jpg",
    "notes": "Official theatrical release poster; Dir: Premraj; Cast: Jagapathi Babu, Charmee Kaur"
  },
  {
    "id": "3564bc66-1920-416d-8dbe-e68b756618d4",
    "title": "Pappu Can't Dance Saala",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/5c/Pappu_Can%27t_Dance_Saala.jpg",
    "notes": "Official theatrical release poster; Dir: Saurabh Shukla; Cast: Vinay Pathak, Neha Dhupia"
  },
  {
    "id": "1121495a-2470-48c7-988e-a9bd04a38b48",
    "title": "Parama Veera Chakra",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/cf/Parama_Veera_Chakra.jpg",
    "notes": "Official theatrical release poster; Dir: Dasari Narayana Rao; Cast: Nandamuri Balakrishna, Sheela"
  },
  {
    "id": "8f4e7d3f-732d-42b2-866a-b3781ffda5a9",
    "title": "Sakthi",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/88/Shakti_Movie_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Meher Ramesh; Cast: Jr. NTR, Ileana D'Cruz"
  },
  {
    "id": "74e0e9c4-780b-4af9-ab7e-8aa97b7772f6",
    "title": "Veedu Theda",
    "releaseYear": 2011,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a6/Veedu_Theda_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Chinni Krishna; Cast: Nikhil Siddharth, Pooja Bose"
  },
  {
    "id": "54f85942-7810-4b92-a9f4-ee52fbb7f564",
    "title": "...And Once Again",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/ca/Andonceagain.jpg",
    "notes": "Official theatrical release poster; Dir: Amol Palekar; Cast: Antara Mali, Rajat Kapoor"
  },
  {
    "id": "be33664d-0d4c-4f55-bb49-c2c9da6d48d1",
    "title": "Diwangi Ne Had Kar Di",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3a/Diwangi_Ne_Had_Kar_Di.jpg",
    "notes": "Official theatrical release poster; Dir: Jiten Purohit; Cast: Aditya Raj Kapoor, Deep"
  },
  {
    "id": "6aa937ed-681b-4d99-a611-46bd5846916d",
    "title": "Dunno Y... Na Jaane Kyon",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/86/Dunno_Y..._Na_Jaane_Kyon.jpg",
    "notes": "Official theatrical release poster; Dir: Sanjay Sharma; Cast: Aryan Vaid, Kapil Sharma"
  },
  {
    "id": "69649d5d-0331-43a1-b949-564675472ca9",
    "title": "Inkosaari",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/ea/Inkosaari.jpg",
    "notes": "Official theatrical release poster; Dir: Suman Pathuri; Cast: Raja, Manjari Phadnis"
  },
  {
    "id": "a582833f-f51e-469d-aafc-8c99fb485b8c",
    "title": "Kathi Kantha Rao",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3f/Kathi_kanta_rao.jpg",
    "notes": "Official theatrical release poster; Dir: E. V. V. Satyanarayana; Cast: Allari Naresh, Kamna Jethmalani"
  },
  {
    "id": "5bcf16b0-2ac4-4e30-86f6-6767dfef8a8c",
    "title": "Love Sex Aur Dhokha",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/00/Love_Sex_Aur_Dhokha_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Dibakar Banerjee; Cast: Amit Sial, Anshuman Jha"
  },
  {
    "id": "8c859b7e-9b1a-420d-9586-43e37a022fb7",
    "title": "Maalik Ek",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/86/Malik_Ek_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Deepak Balraj Vij; Cast: Jackie Shroff, Divya Dutta"
  },
  {
    "id": "9ff7fdae-cf99-411c-a17e-73a01a5c0fa1",
    "title": "Maro Charitra",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/68/Maro_Charitra_2010.jpg",
    "notes": "Official theatrical release poster; Dir: Ravi Yadav; Cast: Varun Sandesh, Anita Galler"
  },
  {
    "id": "699cf15c-a4d2-4f18-b8a8-1dee34c3e695",
    "title": "Payback",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/f0/Payback2010Film.jpg",
    "notes": "Official theatrical release poster; Dir: Sachin P. Karande; Cast: Munish Khan, Sara Khan"
  },
  {
    "id": "a4d9c038-b461-4184-9cdf-279a261a73e5",
    "title": "Puli",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/1b/Puliposter.jpg",
    "notes": "Official theatrical release poster; Dir: S. J. Surya; Cast: Pawan Kalyan, Nikesha Patel"
  },
  {
    "id": "caec69b5-1029-43f6-b2f2-76f0ab6095c7",
    "title": "Rakta Charitra",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/2b/Rakta_Charitra_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Ram Gopal Varma; Cast: Vivek Oberoi, Sudeep"
  },
  {
    "id": "7a2cdb86-f618-4c45-9983-8d2b2ba02ac5",
    "title": "Rakta Charitra 2",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/e7/Rakta_Charitra_2.jpg",
    "notes": "Official theatrical release poster; Dir: Ram Gopal Varma; Cast: Vivek Oberoi, Suriya"
  },
  {
    "id": "4a7e5dad-de09-46b4-abb7-3b5ef575adda",
    "title": "Ranga The Donga",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/6c/Ranga-The-Donga-Movie-Poster.jpg",
    "notes": "Official theatrical release poster; Dir: G. V. Sudhakar Naidu; Cast: Srikanth, Vimala Raman"
  },
  {
    "id": "95a43964-4802-4bdb-9e3e-58ba2e1dcdb5",
    "title": "Sadiyaan",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/87/Sadiyaan2010Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Raj Kanwar; Cast: Luv Sinha, Ferena Wazeir"
  },
  {
    "id": "ce21b961-9ef8-414e-8b19-24f81aba50ee",
    "title": "Saradagaa Kasepu",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a8/Saradaga_Kasepu.jpg",
    "notes": "Official theatrical release poster; Dir: Vamsi; Cast: Allari Naresh, Madhurima"
  },
  {
    "id": "20f86c50-3b58-4cd1-a44b-8cbcb81d0d1c",
    "title": "Shubhapradham",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/0c/Shubhapradam.jpg",
    "notes": "Official theatrical release poster; Dir: K. Viswanath; Cast: Allari Naresh, Manjari Phadnis"
  },
  {
    "id": "9d133149-e61b-45fb-bc5b-03859465e920",
    "title": "Srimathi Kalyanam",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/54/Srimathi_Kalyanam.jpg",
    "notes": "Official theatrical release poster; Dir: Sival; Cast: Vadde Naveen, Sangeetha"
  },
  {
    "id": "a9b3173d-b4db-4100-84dd-b004c3d65b93",
    "title": "Sukhmani: Hope for Life",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/77/Sukhmani_%E2%80%93_Hope_for_Life.jpg",
    "notes": "Official theatrical release poster; Dir: Manjeet Mann; Cast: Gurdas Maan, Juhi Chawla"
  },
  {
    "id": "0b8a7625-52b9-43af-99df-d3eded50aac7",
    "title": "Veera Telangana",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3b/Veera_Telangana.jpg",
    "notes": "Official theatrical release poster; Dir: R.Narayana Murthy; Cast: R. Narayana Murthy, Vijayaranga Raju"
  },
  {
    "id": "e83c73dc-05e8-4ada-920d-e5fc736c247b",
    "title": "Young India",
    "releaseYear": 2010,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/5f/Young_India_%28film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Dasari Narayana Rao; Cast: Pradyumna, Arvind Krishna"
  },
  {
    "id": "8f010501-372b-49a2-a448-1bbfba2e0d59",
    "title": "13B",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/cf/13B%2C_Fear_Has_a_New_Address.jpeg",
    "notes": "Official theatrical release poster; Dir: Vikram K. Kumar; Cast: R. Madhavan, Neetu Chandra"
  },
  {
    "id": "fca0ad47-6843-461f-8559-0279565226ee",
    "title": "8 x 10 Tasveer",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/d/d3/8_X_10_Tasveer_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Nagesh Kukunoor; Cast: Akshay Kumar, Ayesha Takia"
  },
  {
    "id": "3b9396a6-9425-46ea-ab5f-8749bd9fa9e7",
    "title": "Aasma: The Sky Is the Limit",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/d/d6/Aasma%2C_The_Sky_Is_the_Limit.jpeg",
    "notes": "Official theatrical release poster; Dir: Rohit Nayyar; Cast: Hrishitaa Bhatt, Seema Biswas"
  },
  {
    "id": "4a3c830f-3857-4ba5-a3e5-ba753acb8b2f",
    "title": "Arya 2",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/82/Arya_2_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Sukumar; Cast: Allu Arjun, Kajal Agarwal"
  },
  {
    "id": "278dabf9-6a81-4277-8733-ad94ca5bcab3",
    "title": "Bumper Offer",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3d/Bumper_Offer_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Jaya Ravindra; Cast: Sairam Shankar, Bindu Madhavi"
  },
  {
    "id": "d2e1cbb2-0a59-4337-a3d3-561fdf7c8126",
    "title": "Current",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/50/Current_2009_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Surya Pratap; Cast: Sushanth, Sneha Ullal"
  },
  {
    "id": "9eb58e50-ceb5-43cf-8ad2-c362a37fbc99",
    "title": "Ek Se Bure Do",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/09/Ek_Se_Bure_Do.jpg",
    "notes": "Official theatrical release poster; Dir: Tarique; Cast: Arshad Warsi, Anita Hassanandani"
  },
  {
    "id": "4635813e-beb5-4a83-aa33-c25a95a3b400",
    "title": "Evaraina Epudaina",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/9/9a/Evaraina_Epudaina_Poster.JPG",
    "notes": "Official theatrical release poster; Dir: Marthand K. Shankar; Cast: Varun Sandesh, Vimala Raman"
  },
  {
    "id": "426d2d00-7f1d-4ce8-9b53-a37a06ab4369",
    "title": "Fruit and Nut",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/17/Fruit_and_nut_movie_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Kunal Vijaykar; Cast: Boman Irani, Cyrus Broacha"
  },
  {
    "id": "cb67fc0a-5f82-468a-987f-aedc0dc4e5c4",
    "title": "Horn 'Ok' Pleassss",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/28/Horn_%27OK%27_Pleassss_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Rakesh Sarang; Cast: Nana Patekar, Rimi Sen"
  },
  {
    "id": "74471ac6-c17e-4c1c-a146-b845891cae34",
    "title": "Indumathi",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/6f/Indumathi_film_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Harsha P Reddy; Cast: Shweta Bhardwaj, Sivaji"
  },
  {
    "id": "5a9019d3-aea8-40ff-848f-97cf21e2e8db",
    "title": "Jashnn",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/14/Jashnn_Movie_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Raksha Mistry & Hasnain S Hyderabadwala; Cast: Adhyayan Suman, Anjana Sukhani"
  },
  {
    "id": "a7f50072-f41e-4858-8f86-434ac24a5fe0",
    "title": "Karma Aur Holi",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/06/Karma_Aur_Holi.jpg",
    "notes": "Official theatrical release poster; Dir: Manish Gupta; Cast: Sushmita Sen, Randeep Hooda"
  },
  {
    "id": "46805a0f-9765-43ac-9876-325265cfedd0",
    "title": "Kasko",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/30/Kasko_poster.jpg",
    "notes": "Official theatrical release poster; Dir: G. Nageswara Reddy; Cast: Vaibhav, Swetha Basu Prasad"
  },
  {
    "id": "7f7d6f40-830b-4e57-a96a-0af1f90e5064",
    "title": "Let's Dance",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/7c/Lets_Dance_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Aarif Sheikh; Cast: Ajay Chaudhary, Gayatri Patel"
  },
  {
    "id": "f1b59847-e9b3-4178-82c4-ac31b15c78ae",
    "title": "Little Zizou",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/c7/Little_Zizou_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Sooni Taraporevala; Cast: Boman Irani, John Abraham"
  },
  {
    "id": "da2b47ef-99c3-4180-8e66-e1f93a6ceb12",
    "title": "Lottery",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/e1/Lottery_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Hemant Prabhu; Cast: Abhijeet Sawant, Sanjay Narvekar"
  },
  {
    "id": "a85a4c75-d5d5-4eac-85ea-7d746d99898a",
    "title": "Mesthri",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/9/96/Mestri_%28film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Suresh Krishna; Cast: Dasari Narayana Rao, Mohan Babu"
  },
  {
    "id": "80c9e5c5-462e-41db-bdca-195a05ab46fe",
    "title": "Naa Girlfriend Baga Rich",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/52/Naa_Girlfriend_Baga_Rich.jpg",
    "notes": "Official theatrical release poster; Dir: M. Nagendra Kumar; Cast: Sivaji, Kaveri Jha"
  },
  {
    "id": "d3f3e093-be33-495f-a64f-8f6fb8433738",
    "title": "Naa Style Veru",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/67/Naa_Style_Veru.jpg",
    "notes": "Official theatrical release poster; Dir: G. Ram Prasad; Cast: Rajasekhar, Bhumika Chawla"
  },
  {
    "id": "50a0f210-337a-4840-b2a5-3e5f1b7dbaf2",
    "title": "Neramu Siksha",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/11/Neramu_Siksha_%282009%29_Release_Date_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Vijaya Nirmala; Cast: Krishna, Vijaya Nirmala"
  },
  {
    "id": "c20bf5b6-7ceb-4b30-b2a3-cf7ac440ea6c",
    "title": "Pal Pal Dil Ke Ssaat",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/47/Pal_Pal_Dil_Ke_Ssaat.jpg",
    "notes": "Official theatrical release poster; Dir: V Krishna Kumar; Cast: Ajay Jadeja, Mahie Gill"
  },
  {
    "id": "10a7dfd5-f0f3-4c19-ae29-b024b46e1e13",
    "title": "Pravarakhyudu",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/d/d9/Pravarakyudu_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Madan; Cast: Jagapati Babu, Priyamani"
  },
  {
    "id": "ec8a9751-7332-4f70-850f-2ea2cd6277eb",
    "title": "Punnami Naagu",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/aa/Punnami_Naagu_%282009_film%29.jpg",
    "notes": "Official theatrical release poster; Dir: A. Kodandarami Reddy; Cast: Mumaith Khan, Rajiv Kanakala"
  },
  {
    "id": "e8d06e12-5a29-448f-b5e0-b09ff8ba1b9a",
    "title": "Quick Gun Murugun",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/08/Quick_Gun_Murugun_2009_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Shashanka Ghosh; Cast: Rajendra Prasad, Nassar"
  },
  {
    "id": "1401ac89-6c0a-4901-800b-67ac9e58c6ba",
    "title": "Raat Gayi, Baat Gayi?",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/27/Raat_Gayi_Baat_Gayi_-_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Saurabh Shukla; Cast: Rajat Kapoor, Vinay Pathak"
  },
  {
    "id": "ba94ee47-88fb-4cc6-8a03-3cc7d24c82ea",
    "title": "Sankham",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/1c/Sankham_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Siva; Cast: Gopichand, Trisha Krishnan"
  },
  {
    "id": "78942981-5d14-4373-beea-aee8012e759a",
    "title": "Shh...",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/14/Shh..._poster.jpg",
    "notes": "Official theatrical release poster; Dir: Hari Charan Prasad; Cast: Shafi, Mithuna"
  },
  {
    "id": "8cc9e2ec-1cf7-47b6-bce3-c81cfa14f2c9",
    "title": "Shortkut",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/cd/Shortkut.jpg",
    "notes": "Official theatrical release poster; Dir: Neeraj Vora; Cast: Akshaye Khanna, Arshad Warsi"
  },
  {
    "id": "e4424c1b-0bc7-4f6b-a89f-ec1c23e1a8a9",
    "title": "Siddham",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/84/Siddham_%28film%29.jpg",
    "notes": "Official theatrical release poster; Dir: J. D. Chakravarthy; Cast: Jagapati Babu, Sindhu Menon"
  },
  {
    "id": "05828f00-c586-4080-81ae-ac51edc049a3",
    "title": "Teree Sang",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/6d/Teree_Sang_Movie_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Satish Kaushik; Cast: Ruslaan Mumtaz, Sheena Shahabadi"
  },
  {
    "id": "ea3a3e9c-36b9-49f5-ac05-b8df3fe279c9",
    "title": "Three: Love, Lies, Betrayal",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3e/Three-2009-1b-1_1248180358.jpg",
    "notes": "Official theatrical release poster; Dir: Vishal Pandya; Cast: Aashish Chaudhary, Akshay Kapoor"
  },
  {
    "id": "7a18a4eb-8b41-4ce3-aeba-e8fc8a06166e",
    "title": "Vaada Raha",
    "releaseYear": 2009,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/58/Vaadaraha-2009-2b-1_1241776041.jpg",
    "notes": "Official theatrical release poster; Dir: Samir Karnik; Cast: Bobby Deol, Kangana Ranaut"
  },
  {
    "id": "fc13e0bc-fcb6-44d5-9ec1-a058f94baeea",
    "title": "Adivishnu",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/06/Aadivishnu.jpg",
    "notes": "Official theatrical release poster; Dir: Bharat Parepalli; Cast: Dasari Arunkumar, Sneha"
  },
  {
    "id": "a97d844d-adfa-44b5-abd0-345b6f8741da",
    "title": "Ankit, Pallavi & Friends",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/7a/Ankit%2C_Pallavi_%26_Friends.jpg",
    "notes": "Official theatrical release poster; Dir: Hari Yelleti; Cast: Nikhil Siddharth, Naresh"
  },
  {
    "id": "0fbbebd2-2a28-47b8-ab3a-8f250dcbf587",
    "title": "Bhram",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/69/Bhram_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Pavan Kaul; Cast: Dino Morea, Deepshikha Nagpal"
  },
  {
    "id": "b3e46306-27a8-4754-950f-cc5f1404dcd9",
    "title": "Bujjigadu",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/00/Bujjigaadu_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Puri Jagannadh; Cast: Prabhas, Sanjana"
  },
  {
    "id": "1b0dc01a-0d9c-4d74-bb24-9b607bd8103f",
    "title": "Ekaloveyudu",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/3a/Ekaloveyudu.jpg",
    "notes": "Official theatrical release poster; Dir: RK; Cast: Uday Kiran, Kriti Ahuja"
  },
  {
    "id": "471e9361-3358-4e93-ac78-1d4742e2efbe",
    "title": "EMI - Liya Hai Toh Chukana Parega",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/d/de/Themovie22.jpg",
    "notes": "Official theatrical release poster; Dir: Saurabh Kabra; Cast: Sanjay Dutt, Arjun Rampal"
  },
  {
    "id": "ffb3f377-09a7-45d6-96c6-c905835f7e00",
    "title": "Gajibiji",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/fe/Gajibiji.jpg",
    "notes": "Official theatrical release poster; Dir: K. Vasu; Cast: Ali, Farjana"
  },
  {
    "id": "3284be52-96f5-41d8-bb76-088110edd73b",
    "title": "Gunde Jhallumandi",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/55/Gunde_Jhallumandi.jpg",
    "notes": "Official theatrical release poster; Dir: Madan; Cast: Uday Kiran, Aditi Sharma"
  },
  {
    "id": "33eb25a8-8b0c-4944-939d-ba457ff0115d",
    "title": "Hari Puttar: A Comedy of Terrors",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/8/8e/Hari_Puttar%2C_A_Comedy_of_Terrors.jpeg",
    "notes": "Official theatrical release poster; Dir: Lucky Kohli & Rajesh Bajaj; Cast: Sarika, Zain Khan"
  },
  {
    "id": "a4be2627-f234-4710-bf2f-235390d357af",
    "title": "Humne Jeena Seekh Liya",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/fa/Humne_Jeena_Seekh_Liya_Poster.jpg",
    "notes": "Official theatrical release poster; Dir: Milind Ukey; Cast: Siddharth Chandekar, Mrunmayi Deshpande"
  },
  {
    "id": "6f21ac0f-1aea-4ac8-8146-f41947e192ae",
    "title": "Idi Sangathi",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a9/Idi_Sangathi.jpg",
    "notes": "Official theatrical release poster; Dir: Chandra Siddhartha; Cast: Tabu, Abbas"
  },
  {
    "id": "49e02199-c0b6-449b-8ea0-f711d8e0b5b2",
    "title": "John Appa Rao 40 Plus",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/f7/John_Appa_Rao_40_Plus.jpg",
    "notes": "Official theatrical release poster; Dir: Kuchipudi Venkat; Cast: Krishna Bhagawan, Simran"
  },
  {
    "id": "42c49d71-0351-4051-a1ac-15ada26674b8",
    "title": "Kousalya Supraja Rama",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/27/Kousalya_Supraja_Rama_%28film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Surya Prasad; Cast: Meka Srikanth, Sivaji"
  },
  {
    "id": "aaba61da-430d-4c35-985b-567b0637adc7",
    "title": "Maa Ayana Chanti Pilladu",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/d/dc/Maa_Ayana_Chanti_Pilladu.jpg",
    "notes": "Official theatrical release poster; Dir: Raja Vannem Reddy; Cast: Sivaji, Meera Jasmine"
  },
  {
    "id": "a8455552-3458-49dc-9d27-711c252255e8",
    "title": "Mallepuvvu",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/6d/Mallepuvvu_poster.jpg",
    "notes": "Official theatrical release poster; Dir: V. Samudra; Cast: Bhumika Chawla, Murali Krishna"
  },
  {
    "id": "b38f5b3a-28f3-4194-a573-424e7c15bb45",
    "title": "Michael Madana Kamaraju",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/7/73/Michael_Madana_Kamaraju.jpg",
    "notes": "Official theatrical release poster; Dir: Nidhi Prasad; Cast: Prabhu Deva, Charmy Kaur"
  },
  {
    "id": "fb68dba4-1025-4dfa-a132-3164aefde938",
    "title": "Okka Magadu",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/29/Okka_Magaadu_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Y. V. S. Chowdary; Cast: Balakrishna Nandamuri, Nisha Kothari"
  },
  {
    "id": "45f3c145-9f6a-4dd5-9669-d5710cb466e8",
    "title": "Premabhishekam",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/31/Premabhishekam_%282008_film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Vikram Gandhi; Cast: Venu Madhav, Ruthika"
  },
  {
    "id": "461b51da-a8b3-42ac-acf3-a815432b5db2",
    "title": "Rama Rama Kya Hai Dramaa?",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/e/ed/Rama_Rama_Kya_Hai_Dramaa%3F_poster.jpg",
    "notes": "Official theatrical release poster; Dir: S. Chandrakaant; Cast: Rajpal Yadav, Neha Dhupia"
  },
  {
    "id": "56b0aa40-27f7-4629-9321-b826ead0eb2e",
    "title": "Saas Bahu Aur Sensex",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/00/Saas_Bahu_Aur_Sensex%2C_2008_film.jpg",
    "notes": "Official theatrical release poster; Dir: Shona Urvashi; Cast: Tanushree Dutta, Ankur Khanna"
  },
  {
    "id": "3c529bad-c6f3-48e2-ae24-35e3c0dcffcc",
    "title": "Sangamam",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/6e/Sangamam_%282008_film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Rasool Ellore; Cast: Sindhura Gadde, Rohit Khurana"
  },
  {
    "id": "227d0945-2f33-4909-90a8-e76fabc6d7cc",
    "title": "Siddu from Sikakulam",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/41/Siddu_From_Srikakulam.jpg",
    "notes": "Official theatrical release poster; Dir: Eashwar; Cast: Allari Naresh, Manjari Phadnis"
  },
  {
    "id": "52a78f18-6333-49a5-9cff-6117938e486b",
    "title": "Superstar",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/1c/Superstar1kl0.jpg",
    "notes": "Official theatrical release poster; Dir: Rohit Jugraj; Cast: Kunal Khemu, Tulip Joshi"
  },
  {
    "id": "f242fbcd-6394-4d00-a2d3-2a0290033869",
    "title": "Tulsi",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/3/32/Tulsi-2008-218x300.jpg",
    "notes": "Official theatrical release poster; Dir: K. Ajay Kumar; Cast: Irrfan Khan, Manisha Koirala"
  },
  {
    "id": "4cea6211-e423-42ac-9c64-16122f5855d3",
    "title": "Ullasamga Utsahamga",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/29/ULLASAMGA_UTHASAMGA.jpg",
    "notes": "Official theatrical release poster; Dir: A. Karunakaran; Cast: Yasho Sagar, Sneha Ullal"
  },
  {
    "id": "7827c3d0-2cdf-454b-ac9f-46442e3b2ae2",
    "title": "Veedu Mamoolodu Kadu",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/56/Veedu_Mamoolodu_Kadu.jpg",
    "notes": "Official theatrical release poster; Dir: Ravi Sarma; Cast: Rishi, Gopika"
  },
  {
    "id": "d502e23e-6659-4aa5-b544-7b140c1d8c22",
    "title": "Wafaa",
    "releaseYear": 2008,
    "url": "https://upload.wikimedia.org/wikipedia/en/6/63/Wafa%2C_A_Deadly_Love_Story.jpg",
    "notes": "Official theatrical release poster; Dir: Rakesh Sawant; Cast: Rajesh Khanna, Laila Khan"
  },
  {
    "id": "c9fd18c0-2509-49cb-90e3-e3d076e544ce",
    "title": "Aadavari Matalaku Arthale Verule",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/a/ab/Aadavari_Matalaku_Arthale_Verule.jpg",
    "notes": "Official theatrical release poster; Dir: Selvaraghavan; Cast: Venkatesh, Trisha"
  },
  {
    "id": "c820f630-f118-41d0-800c-b7ffc11a078b",
    "title": "Aag",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/2/2b/RGVkiAaGPoster.jpg",
    "notes": "Official theatrical release poster; Dir: Ram Gopal Varma; Cast: Amitabh Bachchan, Urmila Matondkar"
  },
  {
    "id": "2a7c64fb-e581-48a4-b10e-bf0f2c468bf3",
    "title": "Apna Asmaan",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/c/cc/Apna_Asmaan.jpg",
    "notes": "Official theatrical release poster; Dir: Kaushik Roy; Cast: Irrfan Khan, Shobana"
  },
  {
    "id": "84ee1d6c-8afe-4340-8ae1-2a2cdf3fa4b5",
    "title": "Athidi",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/f/f9/Athidhi_poster.jpg",
    "notes": "Official theatrical release poster; Dir: Surender Reddy; Cast: Mahesh Babu, Amrita Rao"
  },
  {
    "id": "171a2eb0-1122-49ac-9522-b3d8bc8ab5a3",
    "title": "Aur Pappu Paas Ho Gaya",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/4/46/Aur_Pappu_Pass_Ho_Gaya.jpg",
    "notes": "Official theatrical release poster; Dir: S. Soni; Cast: Krishna Abhishek, Kashmera Shah"
  },
  {
    "id": "a0082854-a4a4-47ee-9858-cc523ca92588",
    "title": "Bhookailas",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/1/10/Bhookailas_%282007_film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Siva Nageswara Rao; Cast: Venu Madhav, Mumaith Khan"
  },
  {
    "id": "e2dc1748-84ad-4589-94f4-cde26c166ed0",
    "title": "Black Friday",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/58/Black_Friday_%282007%29.jpg",
    "notes": "Official theatrical release poster; Dir: Anurag Kashyap; Cast: Kay Kay Menon, Pavan Malhotra"
  },
  {
    "id": "422a5b46-8f65-4548-b99c-8db33fbcc3a6",
    "title": "Chandrahas",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/0/0b/Chandrahas_%28film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Siva Shakthi Datta; Cast: Harinath Policharla, Krishna"
  },
  {
    "id": "17105e70-68b2-4f0e-b079-6b24307f89d2",
    "title": "Dharm",
    "releaseYear": 2007,
    "url": "https://upload.wikimedia.org/wikipedia/en/5/52/Dharm_%28film%29.jpg",
    "notes": "Official theatrical release poster; Dir: Bhavna Talwar; Cast: Pankaj Kapur, Hrishitaa Bhatt"
  }
];

async function applyBatch11() {
  console.log("=== BATCH 11: APPLYING 108 APPROVED TARGET-PLAYABLE POSTERS ===");

  let approvedCount = 0;
  for (const c of BATCH_11_APPROVALS) {
    const res = await posterReviewService.approvePosterCandidate(
      c.id,
      c.url,
      "admin-batch-11-media-completion",
      "ADMIN_MANUAL_VERIFIED"
    );
    console.log(`[APPROVED ${++approvedCount}/108] ${c.title} (${c.releaseYear}) -> ${res.normalizedUrl}`);
  }

  console.log("\n=== VERIFYING DATABASE STATE ===");
  for (const c of BATCH_11_APPROVALS) {
    const m = await prisma.movie.findUnique({
      where: { id: c.id },
      select: { primaryTitle: true, releaseYear: true, posterAsset: true },
    });
    if (m?.posterAsset !== c.url) {
      throw new Error(`Verification mismatch for ${c.title}: expected ${c.url}, got ${m?.posterAsset}`);
    }
  }
  console.log("ALL 108 MOVIES HAVE CORRECT VERIFIED POSTER ASSETS IN DATABASE!");
}

if (require.main === module) {
  applyBatch11()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
