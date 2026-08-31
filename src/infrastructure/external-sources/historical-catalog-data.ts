import { TmdbMovieDetails, TmdbCredits } from './tmdb-adapter';

export interface HistoricalMovieRecord {
  details: TmdbMovieDetails;
  credits: TmdbCredits;
  alternativeTitles: string[];
}

export const HISTORICAL_CATALOG: HistoricalMovieRecord[] = [
  {
    "details": {
      "id": 200207,
      "title": "Company",
      "original_title": "कंपनी",
      "original_language": "hi",
      "overview": "A gripping exposé of Mumbai’s organized crime underworld tracking the rise and violent fallout between two syndicate leaders.",
      "release_date": "2002-04-12",
      "runtime": 155,
      "budget": 95000000,
      "revenue": 250000000,
      "vote_average": 8,
      "vote_count": 6400,
      "poster_path": "/company_poster.jpg",
      "genres": [
        {
          "id": 80,
          "name": "Crime"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 53,
          "name": "Thriller"
        }
      ],
      "production_companies": [
        {
          "id": 108,
          "name": "Varma Corp"
        }
      ]
    },
    "credits": {
      "id": 200207,
      "cast": [
        {
          "id": 1022,
          "name": "Ajay Devgn",
          "original_name": "Ajay Devgn",
          "character": "Malik",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1019,
          "name": "Vivek Oberoi",
          "original_name": "Vivek Oberoi",
          "character": "Chandu",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1023,
          "name": "Mohanlal",
          "original_name": "Mohanlal",
          "character": "Veerappally Srinivasan IPS",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1024,
          "name": "Manisha Koirala",
          "original_name": "Manisha Koirala",
          "character": "Saroja",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2013,
          "name": "Ram Gopal Varma",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2014,
          "name": "Sandeep Chowta",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Company Bollywood"
    ]
  },
  {
    "details": {
      "id": 200203,
      "title": "Devdas",
      "original_title": "देवदास",
      "original_language": "hi",
      "overview": "After his wealthy family prohibits him from marrying the woman he loves, Devdas turns to alcohol and descends into despair.",
      "release_date": "2002-07-12",
      "runtime": 185,
      "budget": 500000000,
      "revenue": 1680000000,
      "vote_average": 7.6,
      "vote_count": 14500,
      "poster_path": "/devdas_2002_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        },
        {
          "id": 10402,
          "name": "Music"
        }
      ],
      "production_companies": [
        {
          "id": 103,
          "name": "Mega Bollywood"
        }
      ]
    },
    "credits": {
      "id": 200203,
      "cast": [
        {
          "id": 1009,
          "name": "Shah Rukh Khan",
          "original_name": "Shah Rukh Khan",
          "character": "Devdas Mukherjee",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1010,
          "name": "Aishwarya Rai Bachchan",
          "original_name": "Aishwarya Rai",
          "character": "Parvati (Paro)",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1011,
          "name": "Madhuri Dixit",
          "original_name": "Madhuri Dixit",
          "character": "Chandramukhi",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1012,
          "name": "Jackie Shroff",
          "original_name": "Jackie Shroff",
          "character": "Chunnilal",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1013,
          "name": "Kirron Kher",
          "original_name": "Kirron Kher",
          "character": "Sumitra",
          "order": 4,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2005,
          "name": "Sanjay Leela Bhansali",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2006,
          "name": "Ismail Darbar",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Devdas: The Tragic Lover"
    ]
  },
  {
    "details": {
      "id": 200205,
      "title": "Devdas",
      "original_title": "देवदास",
      "original_language": "hi",
      "overview": "After his wealthy family prohibits him from marrying the woman he loves, Devdas turns to alcohol and enters a downward spiral.",
      "release_date": "2002-07-12",
      "runtime": 185,
      "budget": 500000000,
      "revenue": 1680000000,
      "vote_average": 7.6,
      "vote_count": 9800,
      "poster_path": "/devdas_2002_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 105,
          "name": "Mega Bollywood"
        }
      ]
    },
    "credits": {
      "id": 200205,
      "cast": [
        {
          "id": 1015,
          "name": "Shah Rukh Khan",
          "original_name": "Shah Rukh Khan",
          "character": "Devdas Mukherjee",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1016,
          "name": "Aishwarya Rai Bachchan",
          "original_name": "Aishwarya Rai Bachchan",
          "character": "Parvati (Paro)",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1017,
          "name": "Madhuri Dixit",
          "original_name": "Madhuri Dixit",
          "character": "Chandramukhi",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1018,
          "name": "Jackie Shroff",
          "original_name": "Jackie Shroff",
          "character": "Chunilal",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2009,
          "name": "Sanjay Leela Bhansali",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2010,
          "name": "Ismail Darbar",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Devdas Hindi"
    ]
  },
  {
    "details": {
      "id": 200201,
      "title": "Indra",
      "original_title": "ఇంద్ర",
      "original_language": "te",
      "overview": "A noble man from Rayalaseema fights factional feuds to bring peace and water to his drought-stricken homeland.",
      "release_date": "2002-07-24",
      "runtime": 174,
      "budget": 100000000,
      "revenue": 330000000,
      "vote_average": 7.7,
      "vote_count": 5800,
      "poster_path": "/indra_2002_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 101,
          "name": "Vyjayanthi Movies"
        }
      ]
    },
    "credits": {
      "id": 200201,
      "cast": [
        {
          "id": 1001,
          "name": "Chiranjeevi",
          "original_name": "Chiranjeevi",
          "character": "Indrasena Reddy",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1002,
          "name": "Sonali Bendre",
          "original_name": "Sonali Bendre",
          "character": "Pallavi",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1003,
          "name": "Aarthi Agarwal",
          "original_name": "Aarthi Agarwal",
          "character": "Snehalatha Reddy",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1004,
          "name": "Prakash Raj",
          "original_name": "Prakash Raj",
          "character": "Chenna Kesava Reddy",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1005,
          "name": "Brahmanandam",
          "original_name": "Brahmanandam",
          "character": "Pandit",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2001,
          "name": "B. Gopal",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2002,
          "name": "Mani Sharma",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Indrasena Reddy"
    ]
  },
  {
    "details": {
      "id": 200202,
      "title": "Manmadhudu",
      "original_title": "మన్మథుడు",
      "original_language": "te",
      "overview": "An ad agency manager with misogynistic views is forced to work with a spirited woman, leading to romantic revelations.",
      "release_date": "2002-12-20",
      "runtime": 142,
      "budget": 60000000,
      "revenue": 190000000,
      "vote_average": 8.2,
      "vote_count": 7200,
      "poster_path": "/manmadhudu_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 102,
          "name": "Annapurna Studios"
        }
      ]
    },
    "credits": {
      "id": 200202,
      "cast": [
        {
          "id": 1006,
          "name": "Nagarjuna Akkineni",
          "original_name": "Nagarjuna Akkineni",
          "character": "Abhiram",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1002,
          "name": "Sonali Bendre",
          "original_name": "Sonali Bendre",
          "character": "Harika",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1007,
          "name": "Anshu Ambani",
          "original_name": "Anshu Ambani",
          "character": "Maheswari",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1005,
          "name": "Brahmanandam",
          "original_name": "Brahmanandam",
          "character": "Lavangam",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1008,
          "name": "Tanikella Bharani",
          "original_name": "Tanikella Bharani",
          "character": "Prasad",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2003,
          "name": "K. Vijaya Bhaskar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2004,
          "name": "Devi Sri Prasad",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Cupid"
    ]
  },
  {
    "details": {
      "id": 200204,
      "title": "Saathiya",
      "original_title": "साथिया",
      "original_language": "hi",
      "overview": "Two young lovers elope despite family objections, but soon face the harsh realities of married life.",
      "release_date": "2002-12-20",
      "runtime": 138,
      "budget": 75000000,
      "revenue": 290000000,
      "vote_average": 6.9,
      "vote_count": 6200,
      "poster_path": "/saathiya_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 104,
          "name": "Yash Raj Films"
        },
        {
          "id": 105,
          "name": "Madras Talkies"
        }
      ]
    },
    "credits": {
      "id": 200204,
      "cast": [
        {
          "id": 1014,
          "name": "Vivek Oberoi",
          "original_name": "Vivek Oberoi",
          "character": "Aditya Sehgal",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1015,
          "name": "Rani Mukerji",
          "original_name": "Rani Mukerji",
          "character": "Suhani Sharma",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1016,
          "name": "Sandhya Mridul",
          "original_name": "Sandhya Mridul",
          "character": "Dina Sharma",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1009,
          "name": "Shah Rukh Khan",
          "original_name": "Shah Rukh Khan",
          "character": "Yeshwant Rao",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2007,
          "name": "Shaad Ali",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2008,
          "name": "A. R. Rahman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Companion"
    ]
  },
  {
    "details": {
      "id": 200206,
      "title": "Saathiya",
      "original_title": "साथिया",
      "original_language": "hi",
      "overview": "A young married couple in Mumbai realizes that romance is easy, but marriage and navigating daily reality is hard.",
      "release_date": "2002-12-20",
      "runtime": 138,
      "budget": 80000000,
      "revenue": 290000000,
      "vote_average": 7.4,
      "vote_count": 5100,
      "poster_path": "/saathiya_poster.jpg",
      "genres": [
        {
          "id": 10749,
          "name": "Romance"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 106,
          "name": "Yash Raj Films"
        },
        {
          "id": 107,
          "name": "Madras Talkies"
        }
      ]
    },
    "credits": {
      "id": 200206,
      "cast": [
        {
          "id": 1019,
          "name": "Vivek Oberoi",
          "original_name": "Vivek Oberoi",
          "character": "Aditya Sehgal",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1020,
          "name": "Rani Mukerji",
          "original_name": "Rani Mukerji",
          "character": "Suhani Sharma",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1021,
          "name": "Tanuja",
          "original_name": "Tanuja",
          "character": "Shobhana Sharma",
          "order": 2,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2011,
          "name": "Shaad Ali",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2012,
          "name": "A. R. Rahman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Companion",
      "Saathiya Hindi"
    ]
  },
  {
    "details": {
      "id": 200301,
      "title": "Okkadu",
      "original_title": "ఒక్కడు",
      "original_language": "te",
      "overview": "A state-level Kabaddi player rescues a woman from a ruthless faction leader in Kurnool and hides her in his house.",
      "release_date": "2003-01-15",
      "runtime": 170,
      "budget": 130000000,
      "revenue": 350000000,
      "vote_average": 8.1,
      "vote_count": 8500,
      "poster_path": "/okkadu_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 106,
          "name": "Sumanth Art Productions"
        }
      ]
    },
    "credits": {
      "id": 200301,
      "cast": [
        {
          "id": 1017,
          "name": "Mahesh Babu",
          "original_name": "Mahesh Babu",
          "character": "Ajay Varma",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1018,
          "name": "Bhumika Chawla",
          "original_name": "Bhumika Chawla",
          "character": "Swapna Reddy",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1004,
          "name": "Prakash Raj",
          "original_name": "Prakash Raj",
          "character": "Obul Reddy",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1019,
          "name": "Mukesh Rishi",
          "original_name": "Mukesh Rishi",
          "character": "DCP Vijay Varma",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2009,
          "name": "Gunasekhar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2002,
          "name": "Mani Sharma",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "The One"
    ]
  },
  {
    "details": {
      "id": 200302,
      "title": "Simhadri",
      "original_title": "సింహాద్రి",
      "original_language": "te",
      "overview": "An orphan raised by a feudal landlord secretly protects a traumatized girl while taking on violent underworld lords in Kerala.",
      "release_date": "2003-07-09",
      "runtime": 168,
      "budget": 85000000,
      "revenue": 300000000,
      "vote_average": 7.8,
      "vote_count": 6500,
      "poster_path": "/simhadri_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 107,
          "name": "VMC Productions"
        }
      ]
    },
    "credits": {
      "id": 200302,
      "cast": [
        {
          "id": 1020,
          "name": "N. T. Rama Rao Jr.",
          "original_name": "Jr NTR",
          "character": "Simhadri",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1018,
          "name": "Bhumika Chawla",
          "original_name": "Bhumika Chawla",
          "character": "Indu",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1021,
          "name": "Ankitha",
          "original_name": "Ankitha",
          "character": "Kasturi",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1019,
          "name": "Mukesh Rishi",
          "original_name": "Mukesh Rishi",
          "character": "Bhai Saab",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1022,
          "name": "Nassar",
          "original_name": "Nassar",
          "character": "Ram Bhupal Varma",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2010,
          "name": "S. S. Rajamouli",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2011,
          "name": "M. M. Keeravaani",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Simhadri 2003"
    ]
  },
  {
    "details": {
      "id": 200304,
      "title": "Koi... Mil Gaya",
      "original_title": "कोई... मिल गया",
      "original_language": "hi",
      "overview": "A developmentally disabled young man befriends an extraterrestrial visitor who grants him extraordinary mental and physical powers.",
      "release_date": "2003-08-08",
      "runtime": 171,
      "budget": 300000000,
      "revenue": 820000000,
      "vote_average": 7.1,
      "vote_count": 11000,
      "poster_path": "/koi_mil_gaya_poster.jpg",
      "genres": [
        {
          "id": 878,
          "name": "Science Fiction"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 14,
          "name": "Fantasy"
        }
      ],
      "production_companies": [
        {
          "id": 109,
          "name": "Filmkraft Productions"
        }
      ]
    },
    "credits": {
      "id": 200304,
      "cast": [
        {
          "id": 1026,
          "name": "Hrithik Roshan",
          "original_name": "Hrithik Roshan",
          "character": "Rohit Mehra",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1023,
          "name": "Preity Zinta",
          "original_name": "Preity Zinta",
          "character": "Nisha Malhotra",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1027,
          "name": "Rekha",
          "original_name": "Rekha",
          "character": "Sonia Mehra",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1028,
          "name": "Prem Chopra",
          "original_name": "Prem Chopra",
          "character": "Harbans Lal",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2014,
          "name": "Rakesh Roshan",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2015,
          "name": "Rajesh Roshan",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "I Found Someone"
    ]
  },
  {
    "details": {
      "id": 200303,
      "title": "Kal Ho Naa Ho",
      "original_title": "कल हो ना हो",
      "original_language": "hi",
      "overview": "An introverted girl living in New York falls for a charming man who harbors a life-altering secret.",
      "release_date": "2003-11-28",
      "runtime": 186,
      "budget": 280000000,
      "revenue": 860000000,
      "vote_average": 8,
      "vote_count": 18500,
      "poster_path": "/kal_ho_naa_ho_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 108,
          "name": "Dharma Productions"
        }
      ]
    },
    "credits": {
      "id": 200303,
      "cast": [
        {
          "id": 1009,
          "name": "Shah Rukh Khan",
          "original_name": "Shah Rukh Khan",
          "character": "Aman Mathur",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1023,
          "name": "Preity Zinta",
          "original_name": "Preity Zinta",
          "character": "Naina Catherine Kapur",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1024,
          "name": "Saif Ali Khan",
          "original_name": "Saif Ali Khan",
          "character": "Rohit Patel",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1025,
          "name": "Jaya Bachchan",
          "original_name": "Jaya Bachchan",
          "character": "Jennifer Kapur",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2012,
          "name": "Nikkhil Advani",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2013,
          "name": "Shankar-Ehsaan-Loy",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Tomorrow May Never Come"
    ]
  },
  {
    "details": {
      "id": 200402,
      "title": "Varsham",
      "original_title": "వర్షం",
      "original_language": "te",
      "overview": "Two young lovers face violent opposition from an influential rogue and a ruthless filmmaker, bound together by the rains.",
      "release_date": "2004-01-14",
      "runtime": 160,
      "budget": 65000000,
      "revenue": 220000000,
      "vote_average": 7.5,
      "vote_count": 5300,
      "poster_path": "/varsham_poster.jpg",
      "genres": [
        {
          "id": 10749,
          "name": "Romance"
        },
        {
          "id": 28,
          "name": "Action"
        }
      ],
      "production_companies": [
        {
          "id": 106,
          "name": "Sumanth Art Productions"
        }
      ]
    },
    "credits": {
      "id": 200402,
      "cast": [
        {
          "id": 1033,
          "name": "Prabhas",
          "original_name": "Prabhas",
          "character": "Venkat",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1034,
          "name": "Trisha Krishnan",
          "original_name": "Trisha",
          "character": "Sailaja",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1035,
          "name": "Gopichand",
          "original_name": "Gopichand",
          "character": "Bhadranna",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1004,
          "name": "Prakash Raj",
          "original_name": "Prakash Raj",
          "character": "Ranga Rao",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2017,
          "name": "Sobhan",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2004,
          "name": "Devi Sri Prasad",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Rain"
    ]
  },
  {
    "details": {
      "id": 200401,
      "title": "Arya",
      "original_title": "ఆర్య",
      "original_language": "te",
      "overview": "A cheerful, free-spirited student practices pure one-sided love toward a girl whose arrogant boyfriend threatens him.",
      "release_date": "2004-05-07",
      "runtime": 150,
      "budget": 40000000,
      "revenue": 250000000,
      "vote_average": 7.9,
      "vote_count": 6700,
      "poster_path": "/arya_2004_poster.jpg",
      "genres": [
        {
          "id": 10749,
          "name": "Romance"
        },
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 35,
          "name": "Comedy"
        }
      ],
      "production_companies": [
        {
          "id": 110,
          "name": "Sri Venkateswara Creations"
        }
      ]
    },
    "credits": {
      "id": 200401,
      "cast": [
        {
          "id": 1029,
          "name": "Allu Arjun",
          "original_name": "Allu Arjun",
          "character": "Arya",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1030,
          "name": "Anuradha Mehta",
          "original_name": "Anuradha Mehta",
          "character": "Geetha",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1031,
          "name": "Siva Balaji",
          "original_name": "Siva Balaji",
          "character": "Ajay",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1032,
          "name": "Subbaraju",
          "original_name": "Subbaraju",
          "character": "Subbu",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2016,
          "name": "Sukumar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2004,
          "name": "Devi Sri Prasad",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Arya: One Sided Love"
    ]
  },
  {
    "details": {
      "id": 200404,
      "title": "Dhoom",
      "original_title": "धूम",
      "original_language": "hi",
      "overview": "A Mumbai cop teams up with a street-smart bike mechanic to nab a gang of motorcycle-riding robbers.",
      "release_date": "2004-08-27",
      "runtime": 129,
      "budget": 110000000,
      "revenue": 470000000,
      "vote_average": 6.7,
      "vote_count": 9200,
      "poster_path": "/dhoom_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 53,
          "name": "Thriller"
        },
        {
          "id": 80,
          "name": "Crime"
        }
      ],
      "production_companies": [
        {
          "id": 104,
          "name": "Yash Raj Films"
        }
      ]
    },
    "credits": {
      "id": 200404,
      "cast": [
        {
          "id": 1037,
          "name": "Abhishek Bachchan",
          "original_name": "Abhishek Bachchan",
          "character": "ACP Jai Dixit",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1038,
          "name": "John Abraham",
          "original_name": "John Abraham",
          "character": "Kabir",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1039,
          "name": "Uday Chopra",
          "original_name": "Uday Chopra",
          "character": "Ali Khan",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1040,
          "name": "Esha Deol",
          "original_name": "Esha Deol",
          "character": "Sheena",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2020,
          "name": "Sanjay Gadhvi",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2021,
          "name": "Pritam",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Dhoom 1"
    ]
  },
  {
    "details": {
      "id": 200403,
      "title": "Veer-Zaara",
      "original_title": "वीर-ज़ारा",
      "original_language": "hi",
      "overview": "An Indian Air Force pilot and a Pakistani woman fall in love, enduring 22 years of separation and sacrifice.",
      "release_date": "2004-11-12",
      "runtime": 192,
      "budget": 250000000,
      "revenue": 975000000,
      "vote_average": 7.8,
      "vote_count": 16000,
      "poster_path": "/veer_zaara_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 104,
          "name": "Yash Raj Films"
        }
      ]
    },
    "credits": {
      "id": 200403,
      "cast": [
        {
          "id": 1009,
          "name": "Shah Rukh Khan",
          "original_name": "Shah Rukh Khan",
          "character": "Veer Pratap Singh",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1023,
          "name": "Preity Zinta",
          "original_name": "Preity Zinta",
          "character": "Zaara Haayat Khan",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1015,
          "name": "Rani Mukerji",
          "original_name": "Rani Mukerji",
          "character": "Saamiya Siddiqui",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1036,
          "name": "Amitabh Bachchan",
          "original_name": "Amitabh Bachchan",
          "character": "Chaudhary Sumer Singh",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2018,
          "name": "Yash Chopra",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2019,
          "name": "Madan Mohan",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "A Love Legend"
    ]
  },
  {
    "details": {
      "id": 200502,
      "title": "Black",
      "original_title": "ब्लैक",
      "original_language": "hi",
      "overview": "The cathartic relationship between a deaf-blind girl and her alcoholic teacher who brings light and knowledge into her dark world.",
      "release_date": "2005-02-04",
      "runtime": 122,
      "budget": 220000000,
      "revenue": 660000000,
      "vote_average": 8.1,
      "vote_count": 14000,
      "poster_path": "/black_2005_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 112,
          "name": "SLB Films"
        }
      ]
    },
    "credits": {
      "id": 200502,
      "cast": [
        {
          "id": 1036,
          "name": "Amitabh Bachchan",
          "original_name": "Amitabh Bachchan",
          "character": "Debraj Sahai",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1015,
          "name": "Rani Mukerji",
          "original_name": "Rani Mukerji",
          "character": "Michelle McNally",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1044,
          "name": "Ayesha Kapur",
          "original_name": "Ayesha Kapur",
          "character": "Young Michelle",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1045,
          "name": "Shernaz Patel",
          "original_name": "Shernaz Patel",
          "character": "Catherine McNally",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2005,
          "name": "Sanjay Leela Bhansali",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2022,
          "name": "Monty Sharma",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Black: Light in the Darkness"
    ]
  },
  {
    "details": {
      "id": 200503,
      "title": "Bunty Aur Babli",
      "original_title": "बंटी और बबली",
      "original_language": "hi",
      "overview": "Two small-town dreamers team up to become India’s most daring and flamboyant con artists.",
      "release_date": "2005-05-27",
      "runtime": 170,
      "budget": 120000000,
      "revenue": 630000000,
      "vote_average": 6.4,
      "vote_count": 7500,
      "poster_path": "/bunty_aur_babli_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 80,
          "name": "Crime"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 104,
          "name": "Yash Raj Films"
        }
      ]
    },
    "credits": {
      "id": 200503,
      "cast": [
        {
          "id": 1037,
          "name": "Abhishek Bachchan",
          "original_name": "Abhishek Bachchan",
          "character": "Rakesh Trivedi (Bunty)",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1015,
          "name": "Rani Mukerji",
          "original_name": "Rani Mukerji",
          "character": "Vimmi Saluja (Babli)",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1036,
          "name": "Amitabh Bachchan",
          "original_name": "Amitabh Bachchan",
          "character": "DCP Dashrath Singh",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1046,
          "name": "Raj Babbar",
          "original_name": "Raj Babbar",
          "character": "Trivedi",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2007,
          "name": "Shaad Ali",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2013,
          "name": "Shankar-Ehsaan-Loy",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Bunty & Babli"
    ]
  },
  {
    "details": {
      "id": 200501,
      "title": "Chatrapathi",
      "original_title": "ఛత్రపతి",
      "original_language": "te",
      "overview": "A displaced Sri Lankan refugee stands up against local port oppressors in Vizag to protect his community and reunite with his mother.",
      "release_date": "2005-09-30",
      "runtime": 168,
      "budget": 125000000,
      "revenue": 320000000,
      "vote_average": 7.7,
      "vote_count": 6800,
      "poster_path": "/chatrapathi_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 111,
          "name": "Sri Venkateswara Cine Chitra"
        }
      ]
    },
    "credits": {
      "id": 200501,
      "cast": [
        {
          "id": 1033,
          "name": "Prabhas",
          "original_name": "Prabhas",
          "character": "Sivaji / Chatrapathi",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1041,
          "name": "Shriya Saran",
          "original_name": "Shriya Saran",
          "character": "Neelu",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1042,
          "name": "Bhanupriya",
          "original_name": "Bhanupriya",
          "character": "Rajya Lakshmi",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1043,
          "name": "Shafi",
          "original_name": "Shafi",
          "character": "Ashok",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2010,
          "name": "S. S. Rajamouli",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2011,
          "name": "M. M. Keeravaani",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Chatrapati: The Warrior"
    ]
  },
  {
    "details": {
      "id": 200602,
      "title": "Rang De Basanti",
      "original_title": "रंग दे बसंती",
      "original_language": "hi",
      "overview": "A British filmmaker casts five carefree university students in a documentary about Indian freedom fighters, awakening their civic conscience.",
      "release_date": "2006-01-26",
      "runtime": 167,
      "budget": 250000000,
      "revenue": 970000000,
      "vote_average": 8.1,
      "vote_count": 22000,
      "poster_path": "/rang_de_basanti_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 36,
          "name": "History"
        }
      ],
      "production_companies": [
        {
          "id": 113,
          "name": "ROMP Pictures"
        }
      ]
    },
    "credits": {
      "id": 200602,
      "cast": [
        {
          "id": 1050,
          "name": "Aamir Khan",
          "original_name": "Aamir Khan",
          "character": "Daljit (DJ) / Chandrashekhar Azad",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1047,
          "name": "Siddharth",
          "original_name": "Siddharth",
          "character": "Karan Singhania / Bhagat Singh",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1051,
          "name": "Sharman Joshi",
          "original_name": "Sharman Joshi",
          "character": "Sukhi / Rajguru",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1052,
          "name": "Soha Ali Khan",
          "original_name": "Soha Ali Khan",
          "character": "Sonia / Durga Vohra",
          "order": 3,
          "gender": 1
        },
        {
          "id": 1053,
          "name": "Kunal Kapoor",
          "original_name": "Kunal Kapoor",
          "character": "Aslam / Ashfaqullah Khan",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2024,
          "name": "Rakeysh Omprakash Mehra",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2008,
          "name": "A. R. Rahman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Paint It Yellow"
    ]
  },
  {
    "details": {
      "id": 200601,
      "title": "Bommarillu",
      "original_title": "బొమ్మరిల్లు",
      "original_language": "te",
      "overview": "A son who feels stifled by his over-protective father falls for a carefree girl and struggles to express his true desires.",
      "release_date": "2006-08-09",
      "runtime": 168,
      "budget": 60000000,
      "revenue": 310000000,
      "vote_average": 8.2,
      "vote_count": 9100,
      "poster_path": "/bommarillu_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 110,
          "name": "Sri Venkateswara Creations"
        }
      ]
    },
    "credits": {
      "id": 200601,
      "cast": [
        {
          "id": 1047,
          "name": "Siddharth",
          "original_name": "Siddharth",
          "character": "Siddharth (Siddhu)",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1048,
          "name": "Genelia D’Souza",
          "original_name": "Genelia D’Souza",
          "character": "Hasini Rao",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1004,
          "name": "Prakash Raj",
          "original_name": "Prakash Raj",
          "character": "Aravind",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1049,
          "name": "Jayasudha",
          "original_name": "Jayasudha",
          "character": "Lakshmi",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2023,
          "name": "Bhaskar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2004,
          "name": "Devi Sri Prasad",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Dollhouse"
    ]
  },
  {
    "details": {
      "id": 200603,
      "title": "Lage Raho Munna Bhai",
      "original_title": "लगे रहो मुन्ना भाई",
      "original_language": "hi",
      "overview": "A lovable Mumbai underworld don starts seeing the spirit of Mahatma Gandhi and adopts Gandhigiri to resolve societal conflicts.",
      "release_date": "2006-09-01",
      "runtime": 144,
      "budget": 190000000,
      "revenue": 1260000000,
      "vote_average": 8,
      "vote_count": 17000,
      "poster_path": "/lage_raho_munna_bhai_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 114,
          "name": "Vinod Chopra Films"
        }
      ]
    },
    "credits": {
      "id": 200603,
      "cast": [
        {
          "id": 1054,
          "name": "Sanjay Dutt",
          "original_name": "Sanjay Dutt",
          "character": "Munna Bhai / Murali Prasad Sharma",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1055,
          "name": "Arshad Warsi",
          "original_name": "Arshad Warsi",
          "character": "Circuit",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1056,
          "name": "Vidya Balan",
          "original_name": "Vidya Balan",
          "character": "Jhanvi",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1057,
          "name": "Boman Irani",
          "original_name": "Boman Irani",
          "character": "Lucky Singh",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1058,
          "name": "Dilip Prabhavalkar",
          "original_name": "Dilip Prabhavalkar",
          "character": "Mahatma Gandhi",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2025,
          "name": "Rajkumar Hirani",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2026,
          "name": "Shantanu Moitra",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Munna Bhai 2"
    ]
  },
  {
    "details": {
      "id": 200604,
      "title": "Don",
      "original_title": "डॉन",
      "original_language": "hi",
      "overview": "When an international cartel boss is critically injured, a simple lookalike is recruited by police to infiltrate the underworld.",
      "release_date": "2006-10-20",
      "runtime": 171,
      "budget": 380000000,
      "revenue": 1060000000,
      "vote_average": 7.1,
      "vote_count": 13500,
      "poster_path": "/don_2006_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 53,
          "name": "Thriller"
        },
        {
          "id": 80,
          "name": "Crime"
        }
      ],
      "production_companies": [
        {
          "id": 115,
          "name": "Excel Entertainment"
        }
      ]
    },
    "credits": {
      "id": 200604,
      "cast": [
        {
          "id": 1009,
          "name": "Shah Rukh Khan",
          "original_name": "Shah Rukh Khan",
          "character": "Don / Vijay",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1059,
          "name": "Priyanka Chopra",
          "original_name": "Priyanka Chopra",
          "character": "Roma Bhagat",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1060,
          "name": "Arjun Rampal",
          "original_name": "Arjun Rampal",
          "character": "Jasjit (JJ)",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1057,
          "name": "Boman Irani",
          "original_name": "Boman Irani",
          "character": "DCP DeSilva",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2027,
          "name": "Farhan Akhtar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2013,
          "name": "Shankar-Ehsaan-Loy",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Don: The Chase Begins Again"
    ]
  },
  {
    "details": {
      "id": 200704,
      "title": "Desamuduru",
      "original_title": "దేశముదురు",
      "original_language": "te",
      "overview": "A crime reporter gets sent to Kullu Manali after a feud with a politician’s son, falling in love with a young woman on the run from a syndicate.",
      "release_date": "2007-01-12",
      "runtime": 156,
      "budget": 100000000,
      "revenue": 290000000,
      "vote_average": 7.7,
      "vote_count": 5800,
      "poster_path": "/desamuduru_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 150,
          "name": "Vaishno Academy"
        }
      ]
    },
    "credits": {
      "id": 200704,
      "cast": [
        {
          "id": 1036,
          "name": "Allu Arjun",
          "original_name": "Allu Arjun",
          "character": "Bala Govind",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1163,
          "name": "Hansika Motwani",
          "original_name": "Hansika Motwani",
          "character": "Vaishali",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1164,
          "name": "Pradeep Rawat",
          "original_name": "Pradeep Rawat",
          "character": "Tambi Durai",
          "order": 2,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2086,
          "name": "Puri Jagannadh",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2008,
          "name": "Chakri",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Desamuduru Telugu"
    ]
  },
  {
    "details": {
      "id": 200702,
      "title": "Chak De! India",
      "original_title": "चक दे! इंडिया",
      "original_language": "hi",
      "overview": "A disgraced former captain takes on the coaching mantle of the neglected Indian national women’s field hockey team to redeem his honor.",
      "release_date": "2007-08-10",
      "runtime": 153,
      "budget": 200000000,
      "revenue": 1080000000,
      "vote_average": 8.1,
      "vote_count": 24000,
      "poster_path": "/chak_de_india_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10402,
          "name": "Music"
        }
      ],
      "production_companies": [
        {
          "id": 104,
          "name": "Yash Raj Films"
        }
      ]
    },
    "credits": {
      "id": 200702,
      "cast": [
        {
          "id": 1009,
          "name": "Shah Rukh Khan",
          "original_name": "Shah Rukh Khan",
          "character": "Kabir Khan",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1064,
          "name": "Vidya Malvade",
          "original_name": "Vidya Malvade",
          "character": "Vidya Sharma",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1065,
          "name": "Shilpa Shukla",
          "original_name": "Shilpa Shukla",
          "character": "Bindia Naik",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1066,
          "name": "Sagarika Ghatge",
          "original_name": "Sagarika Ghatge",
          "character": "Preeti Sabarwal",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2028,
          "name": "Shimit Amin",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2029,
          "name": "Salim-Sulaiman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Go For It India!"
    ]
  },
  {
    "details": {
      "id": 200701,
      "title": "Yamadonga",
      "original_title": "యమదొంగ",
      "original_language": "te",
      "overview": "A street-smart con thief is killed and sent to Yamaloka, where he creates havoc and challenges Lord Yama himself.",
      "release_date": "2007-08-15",
      "runtime": 184,
      "budget": 180000000,
      "revenue": 490000000,
      "vote_average": 7.3,
      "vote_count": 6100,
      "poster_path": "/yamadonga_poster.jpg",
      "genres": [
        {
          "id": 14,
          "name": "Fantasy"
        },
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 35,
          "name": "Comedy"
        }
      ],
      "production_companies": [
        {
          "id": 116,
          "name": "Viswamitra Creations"
        }
      ]
    },
    "credits": {
      "id": 200701,
      "cast": [
        {
          "id": 1020,
          "name": "N. T. Rama Rao Jr.",
          "original_name": "Jr NTR",
          "character": "Raja",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1061,
          "name": "Priyamani",
          "original_name": "Priyamani",
          "character": "Maheswari",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1062,
          "name": "Mamta Mohandas",
          "original_name": "Mamta Mohandas",
          "character": "Dhanalakshmi",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1063,
          "name": "Mohan Babu",
          "original_name": "Mohan Babu",
          "character": "Lord Yama",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1005,
          "name": "Brahmanandam",
          "original_name": "Brahmanandam",
          "character": "Chitragupta",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2010,
          "name": "S. S. Rajamouli",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2011,
          "name": "M. M. Keeravaani",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Yama Donga"
    ]
  },
  {
    "details": {
      "id": 200703,
      "title": "Taare Zameen Par",
      "original_title": "तारे ज़मीन पर",
      "original_language": "hi",
      "overview": "An eight-year-old boy struggling with dyslexia finds understanding, empathy, and artistic inspiration in an unconventional art teacher.",
      "release_date": "2007-12-21",
      "runtime": 165,
      "budget": 120000000,
      "revenue": 890000000,
      "vote_average": 8.3,
      "vote_count": 28000,
      "poster_path": "/taare_zameen_par_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10751,
          "name": "Family"
        }
      ],
      "production_companies": [
        {
          "id": 117,
          "name": "Aamir Khan Productions"
        }
      ]
    },
    "credits": {
      "id": 200703,
      "cast": [
        {
          "id": 1067,
          "name": "Darsheel Safary",
          "original_name": "Darsheel Safary",
          "character": "Ishaan Awasthi",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1050,
          "name": "Aamir Khan",
          "original_name": "Aamir Khan",
          "character": "Ram Shankar Nikumbh",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1068,
          "name": "Tisca Chopra",
          "original_name": "Tisca Chopra",
          "character": "Maya Awasthi",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1069,
          "name": "Vipin Sharma",
          "original_name": "Vipin Sharma",
          "character": "Nandkishore Awasthi",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2030,
          "name": "Aamir Khan",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2013,
          "name": "Shankar-Ehsaan-Loy",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Like Stars on Earth"
    ]
  },
  {
    "details": {
      "id": 200803,
      "title": "Jodhaa Akbar",
      "original_title": "जोधा अकबर",
      "original_language": "hi",
      "overview": "A sixteenth-century love story about a political marriage of convenience between a Mughal emperor and a Rajput princess that evolves into true love.",
      "release_date": "2008-02-15",
      "runtime": 213,
      "budget": 400000000,
      "revenue": 1200000000,
      "vote_average": 7.6,
      "vote_count": 17000,
      "poster_path": "/jodhaa_akbar_poster.jpg",
      "genres": [
        {
          "id": 36,
          "name": "History"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 120,
          "name": "Ashutosh Gowariker Productions"
        }
      ]
    },
    "credits": {
      "id": 200803,
      "cast": [
        {
          "id": 1026,
          "name": "Hrithik Roshan",
          "original_name": "Hrithik Roshan",
          "character": "Jalaluddin Mohammad Akbar",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1010,
          "name": "Aishwarya Rai Bachchan",
          "original_name": "Aishwarya Rai",
          "character": "Jodhaa Bai",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1080,
          "name": "Sonu Sood",
          "original_name": "Sonu Sood",
          "character": "Rajkumar Sujamal",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1081,
          "name": "Kulbhushan Kharbanda",
          "original_name": "Kulbhushan Kharbanda",
          "character": "Raja Bharmal",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2034,
          "name": "Ashutosh Gowariker",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2008,
          "name": "A. R. Rahman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Jodha Akbar"
    ]
  },
  {
    "details": {
      "id": 200801,
      "title": "Jalsa",
      "original_title": "జల్సా",
      "original_language": "te",
      "overview": "A young man reformed from extremism works as a radio jockey, but his past collides with an eccentric mafia don.",
      "release_date": "2008-04-02",
      "runtime": 160,
      "budget": 150000000,
      "revenue": 380000000,
      "vote_average": 7.6,
      "vote_count": 8200,
      "poster_path": "/jalsa_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 119,
          "name": "Geetha Arts"
        }
      ]
    },
    "credits": {
      "id": 200801,
      "cast": [
        {
          "id": 1074,
          "name": "Pawan Kalyan",
          "original_name": "Pawan Kalyan",
          "character": "Sanjay Sahu",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1075,
          "name": "Ileana D'Cruz",
          "original_name": "Ileana D'Cruz",
          "character": "Bhagyamathi",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1076,
          "name": "Parvati Melton",
          "original_name": "Parvati Melton",
          "character": "Jyothsna",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1004,
          "name": "Prakash Raj",
          "original_name": "Prakash Raj",
          "character": "Indu’s Father",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1005,
          "name": "Brahmanandam",
          "original_name": "Brahmanandam",
          "character": "Pranav",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2032,
          "name": "Trivikram Srinivas",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2004,
          "name": "Devi Sri Prasad",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Celebration"
    ]
  },
  {
    "details": {
      "id": 200804,
      "title": "Ready",
      "original_title": "రెడీ",
      "original_language": "te",
      "overview": "A good-hearted engineering graduate mistakenly abducts a bride-to-be from a wedding, finding himself trapped in violent Rayalaseema family feuds.",
      "release_date": "2008-06-19",
      "runtime": 160,
      "budget": 80000000,
      "revenue": 300000000,
      "vote_average": 7.9,
      "vote_count": 6700,
      "poster_path": "/ready_telugu_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 10749,
          "name": "Romance"
        },
        {
          "id": 28,
          "name": "Action"
        }
      ],
      "production_companies": [
        {
          "id": 116,
          "name": "Sri Sravanthi Movies"
        }
      ]
    },
    "credits": {
      "id": 200804,
      "cast": [
        {
          "id": 1165,
          "name": "Ram Pothineni",
          "original_name": "Ram Pothineni",
          "character": "Chandu / Danayya",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1166,
          "name": "Genelia D’Souza",
          "original_name": "Genelia D’Souza",
          "character": "Pooja",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1005,
          "name": "Brahmanandam",
          "original_name": "Brahmanandam",
          "character": "McDowell Murthy",
          "order": 2,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2045,
          "name": "Srinu Vaitla",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2004,
          "name": "Devi Sri Prasad",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Ready Telugu"
    ]
  },
  {
    "details": {
      "id": 200802,
      "title": "Ghajini",
      "original_title": "गजनी",
      "original_language": "hi",
      "overview": "A tycoon suffering from anterograde amnesia uses Polaroid photographs, body tattoos, and notes to hunt down his lover’s murderers.",
      "release_date": "2008-12-25",
      "runtime": 186,
      "budget": 520000000,
      "revenue": 2320000000,
      "vote_average": 7.3,
      "vote_count": 29000,
      "poster_path": "/ghajini_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 53,
          "name": "Thriller"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 119,
          "name": "Geetha Arts"
        }
      ]
    },
    "credits": {
      "id": 200802,
      "cast": [
        {
          "id": 1050,
          "name": "Aamir Khan",
          "original_name": "Aamir Khan",
          "character": "Sanjay Singhania",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1077,
          "name": "Asin Thottumkal",
          "original_name": "Asin",
          "character": "Kalpana Shetty",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1078,
          "name": "Jiah Khan",
          "original_name": "Jiah Khan",
          "character": "Sunita",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1079,
          "name": "Pradeep Rawat",
          "original_name": "Pradeep Rawat",
          "character": "Ghajini Dharmatma",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2033,
          "name": "A. R. Murugadoss",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2008,
          "name": "A. R. Rahman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Ghajini Hindi"
    ]
  },
  {
    "details": {
      "id": 200901,
      "title": "Arundhati",
      "original_title": "అరుంధతి",
      "original_language": "te",
      "overview": "A courageous woman battles an evil mystic who has returned from beyond the grave to seek vengeance against her royal family.",
      "release_date": "2009-01-16",
      "runtime": 130,
      "budget": 130000000,
      "revenue": 700000000,
      "vote_average": 7.4,
      "vote_count": 7800,
      "poster_path": "/arundhati_poster.jpg",
      "genres": [
        {
          "id": 14,
          "name": "Fantasy"
        },
        {
          "id": 27,
          "name": "Horror"
        },
        {
          "id": 53,
          "name": "Thriller"
        }
      ],
      "production_companies": [
        {
          "id": 121,
          "name": "Mallemala Entertainments"
        }
      ]
    },
    "credits": {
      "id": 200901,
      "cast": [
        {
          "id": 1082,
          "name": "Anushka Shetty",
          "original_name": "Anushka Shetty",
          "character": "Arundhati / Jejamma",
          "order": 0,
          "gender": 1
        },
        {
          "id": 1080,
          "name": "Sonu Sood",
          "original_name": "Sonu Sood",
          "character": "Pasupathi",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1083,
          "name": "Sayaji Shinde",
          "original_name": "Sayaji Shinde",
          "character": "Anwar",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1084,
          "name": "Manorama",
          "original_name": "Manorama",
          "character": "Chandramma",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2035,
          "name": "Kodi Ramakrishna",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2036,
          "name": "Koti",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Arundhati 2009"
    ]
  },
  {
    "details": {
      "id": 200903,
      "title": "Arundhati",
      "original_title": "అరుంధతి",
      "original_language": "te",
      "overview": "A young woman visiting her ancestral palace in Gadwal learns she is the reincarnation of a valiant queen who vanquished an evil sorcerer.",
      "release_date": "2009-01-16",
      "runtime": 130,
      "budget": 130000000,
      "revenue": 700000000,
      "vote_average": 8.2,
      "vote_count": 9800,
      "poster_path": "/arundhati_poster.jpg",
      "genres": [
        {
          "id": 14,
          "name": "Fantasy"
        },
        {
          "id": 27,
          "name": "Horror"
        },
        {
          "id": 28,
          "name": "Action"
        }
      ],
      "production_companies": [
        {
          "id": 151,
          "name": "Mallemala Entertainments"
        }
      ]
    },
    "credits": {
      "id": 200903,
      "cast": [
        {
          "id": 1050,
          "name": "Anushka Shetty",
          "original_name": "Anushka Shetty",
          "character": "Arundhati / Jejamma",
          "order": 0,
          "gender": 1
        },
        {
          "id": 1167,
          "name": "Sonu Sood",
          "original_name": "Sonu Sood",
          "character": "Pasupathi",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1168,
          "name": "Sayaji Shinde",
          "original_name": "Sayaji Shinde",
          "character": "Anwar",
          "order": 2,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2087,
          "name": "Kodi Ramakrishna",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2088,
          "name": "Koti",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Arundhati Jejamma"
    ]
  },
  {
    "details": {
      "id": 200902,
      "title": "Dev.D",
      "original_title": "देव डी",
      "original_language": "hi",
      "overview": "A modern, psychedelic reimagining of the classic tragic romance Devdas set against modern Delhi and Chandigarh.",
      "release_date": "2009-02-06",
      "runtime": 144,
      "budget": 60000000,
      "revenue": 215000000,
      "vote_average": 7.9,
      "vote_count": 11000,
      "poster_path": "/dev_d_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 122,
          "name": "UTV Spotboy"
        }
      ]
    },
    "credits": {
      "id": 200902,
      "cast": [
        {
          "id": 1085,
          "name": "Abhay Deol",
          "original_name": "Abhay Deol",
          "character": "Devendra Dhillon (Dev)",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1086,
          "name": "Mahie Gill",
          "original_name": "Mahie Gill",
          "character": "Parminder (Paro)",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1087,
          "name": "Kalki Koechlin",
          "original_name": "Kalki Koechlin",
          "character": "Lenny / Chanda",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1088,
          "name": "Dibyendu Bhattacharya",
          "original_name": "Dibyendu Bhattacharya",
          "character": "Chunni",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2037,
          "name": "Anurag Kashyap",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2038,
          "name": "Amit Trivedi",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Dev D"
    ]
  },
  {
    "details": {
      "id": 200904,
      "title": "Magadheera",
      "original_title": "మగధీర",
      "original_language": "te",
      "overview": "A modern bike stuntman in Vizag remembers his past 400-year-old life as an invincible Rajput warrior sworn to protect his royal princess.",
      "release_date": "2009-07-31",
      "runtime": 166,
      "budget": 400000000,
      "revenue": 1500000000,
      "vote_average": 8.3,
      "vote_count": 14200,
      "poster_path": "/magadheera_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 14,
          "name": "Fantasy"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 152,
          "name": "Geetha Arts"
        }
      ]
    },
    "credits": {
      "id": 200904,
      "cast": [
        {
          "id": 1156,
          "name": "Ram Charan",
          "original_name": "Ram Charan",
          "character": "Harsha / Kala Bhairava",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1169,
          "name": "Kajal Aggarwal",
          "original_name": "Kajal Aggarwal",
          "character": "Indu / Mithravinda Devi",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1170,
          "name": "Dev Gill",
          "original_name": "Dev Gill",
          "character": "Raghu Veer / Ranadev Billa",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1171,
          "name": "Srihari",
          "original_name": "Srihari",
          "character": "Solomon / Sher Khan",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2016,
          "name": "S. S. Rajamouli",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2017,
          "name": "M. M. Keeravani",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Magadheera Telugu"
    ]
  },
  {
    "details": {
      "id": 200905,
      "title": "3 Idiots",
      "original_title": "3 इडियट्स",
      "original_language": "hi",
      "overview": "Two college friends search for their long-lost classmate who inspired them to think independently rather than follow blind rote learning.",
      "release_date": "2009-12-25",
      "runtime": 170,
      "budget": 550000000,
      "revenue": 4600000000,
      "vote_average": 8.4,
      "vote_count": 24500,
      "poster_path": "/3_idiots_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 131,
          "name": "Vinod Chopra Films"
        }
      ]
    },
    "credits": {
      "id": 200905,
      "cast": [
        {
          "id": 1052,
          "name": "Aamir Khan",
          "original_name": "Aamir Khan",
          "character": "Ranchhoddas Chanchad / Phunsukh Wangdu",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1172,
          "name": "R. Madhavan",
          "original_name": "R. Madhavan",
          "character": "Farhan Qureshi",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1054,
          "name": "Sharman Joshi",
          "original_name": "Sharman Joshi",
          "character": "Raju Rastogi",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1057,
          "name": "Kareena Kapoor Khan",
          "original_name": "Kareena Kapoor Khan",
          "character": "Pia Sahastrabuddhe",
          "order": 3,
          "gender": 1
        },
        {
          "id": 1044,
          "name": "Boman Irani",
          "original_name": "Boman Irani",
          "character": "Dr. Viru Sahastrabuddhe (Virus)",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2052,
          "name": "Rajkumar Hirani",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2053,
          "name": "Shantanu Moitra",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Three Idiots"
    ]
  },
  {
    "details": {
      "id": 201001,
      "title": "Vedam",
      "original_title": "వేదం",
      "original_language": "te",
      "overview": "Five distinct individuals from different walks of life find their paths converging at a hospital during a terrorist siege.",
      "release_date": "2010-06-04",
      "runtime": 135,
      "budget": 110000000,
      "revenue": 250000000,
      "vote_average": 8.1,
      "vote_count": 7300,
      "poster_path": "/vedam_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 28,
          "name": "Action"
        }
      ],
      "production_companies": [
        {
          "id": 123,
          "name": "Arka Media Works"
        }
      ]
    },
    "credits": {
      "id": 201001,
      "cast": [
        {
          "id": 1029,
          "name": "Allu Arjun",
          "original_name": "Allu Arjun",
          "character": "Cable Raju",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1082,
          "name": "Anushka Shetty",
          "original_name": "Anushka Shetty",
          "character": "Saroja",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1089,
          "name": "Manchu Manoj",
          "original_name": "Manchu Manoj",
          "character": "Vivek Chakravarthy",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1090,
          "name": "Manoj Bajpayee",
          "original_name": "Manoj Bajpayee",
          "character": "Raheemuddin Qureshi",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2039,
          "name": "Krish Jagarlamudi",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2011,
          "name": "M. M. Keeravaani",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "The Chant"
    ]
  },
  {
    "details": {
      "id": 201003,
      "title": "Udaan",
      "original_title": "उड़ान",
      "original_language": "hi",
      "overview": "Expelled from boarding school, a young aspiring poet returns to Jamshedpur to confront his authoritarian, abusive father.",
      "release_date": "2010-07-16",
      "runtime": 134,
      "budget": 50000000,
      "revenue": 33500000,
      "vote_average": 8.1,
      "vote_count": 14200,
      "poster_path": "/udaan_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 122,
          "name": "UTV Spotboy"
        }
      ]
    },
    "credits": {
      "id": 201003,
      "cast": [
        {
          "id": 1095,
          "name": "Rajat Barmecha",
          "original_name": "Rajat Barmecha",
          "character": "Rohan Gagra",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1096,
          "name": "Ronit Roy",
          "original_name": "Ronit Roy",
          "character": "Bhairav Gagra",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1097,
          "name": "Ram Kapoor",
          "original_name": "Ram Kapoor",
          "character": "Jimmy",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1098,
          "name": "Aayan Boradia",
          "original_name": "Aayan Boradia",
          "character": "Arjun Gagra",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2042,
          "name": "Vikramaditya Motwane",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2038,
          "name": "Amit Trivedi",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Flight"
    ]
  },
  {
    "details": {
      "id": 201002,
      "title": "Dabangg",
      "original_title": "दबंग",
      "original_language": "hi",
      "overview": "A corrupt yet heroic police officer encounters challenges from his family and a treacherous local politician.",
      "release_date": "2010-09-10",
      "runtime": 126,
      "budget": 420000000,
      "revenue": 2190000000,
      "vote_average": 6.3,
      "vote_count": 19500,
      "poster_path": "/dabangg_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 80,
          "name": "Crime"
        }
      ],
      "production_companies": [
        {
          "id": 124,
          "name": "Arbaaz Khan Productions"
        }
      ]
    },
    "credits": {
      "id": 201002,
      "cast": [
        {
          "id": 1091,
          "name": "Salman Khan",
          "original_name": "Salman Khan",
          "character": "Inspector Chulbul Pandey",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1092,
          "name": "Sonakshi Sinha",
          "original_name": "Sonakshi Sinha",
          "character": "Rajjo Pandey",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1080,
          "name": "Sonu Sood",
          "original_name": "Sonu Sood",
          "character": "Chedi Singh",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1093,
          "name": "Arbaaz Khan",
          "original_name": "Arbaaz Khan",
          "character": "Makkhi Pandey",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1094,
          "name": "Vinod Khanna",
          "original_name": "Vinod Khanna",
          "character": "Prajapati Pandey",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2040,
          "name": "Abhinav Kashyap",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2041,
          "name": "Sajid-Wajid",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Fearless"
    ]
  },
  {
    "details": {
      "id": 201103,
      "title": "Ala Modalaindi",
      "original_title": "అలా మొదలైంది",
      "original_language": "te",
      "overview": "A young man kidnapped on his way to his ex-girlfriend’s wedding narrates the comical and chaotic tale of his serendipitous romance.",
      "release_date": "2011-01-21",
      "runtime": 138,
      "budget": 40000000,
      "revenue": 180000000,
      "vote_average": 7.9,
      "vote_count": 6500,
      "poster_path": "/alamodalaindi_poster.jpg",
      "genres": [
        {
          "id": 10749,
          "name": "Romance"
        },
        {
          "id": 35,
          "name": "Comedy"
        }
      ],
      "production_companies": [
        {
          "id": 153,
          "name": "Sri Ranjith Movies"
        }
      ]
    },
    "credits": {
      "id": 201103,
      "cast": [
        {
          "id": 1065,
          "name": "Nani",
          "original_name": "Nani",
          "character": "Gautham",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1173,
          "name": "Nithya Menen",
          "original_name": "Nithya Menen",
          "character": "Nithya",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1174,
          "name": "Sneha Ullal",
          "original_name": "Sneha Ullal",
          "character": "Kavya",
          "order": 2,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2089,
          "name": "Nandini Reddy",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2036,
          "name": "Kalyani Malik",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "That is How it Started"
    ]
  },
  {
    "details": {
      "id": 201104,
      "title": "Zindagi Na Milegi Dobara",
      "original_title": "ज़िंदगी ना मिलेगी दोबारा",
      "original_language": "hi",
      "overview": "Three school friends embark on a bachelor road trip across Spain, confronting their deep-seated phobias, unresolved regrets, and learning to seize life.",
      "release_date": "2011-07-15",
      "runtime": 155,
      "budget": 550000000,
      "revenue": 1530000000,
      "vote_average": 8.2,
      "vote_count": 17800,
      "poster_path": "/znmd_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 12,
          "name": "Adventure"
        }
      ],
      "production_companies": [
        {
          "id": 114,
          "name": "Excel Entertainment"
        }
      ]
    },
    "credits": {
      "id": 201104,
      "cast": [
        {
          "id": 1042,
          "name": "Hrithik Roshan",
          "original_name": "Hrithik Roshan",
          "character": "Arjun Saluja",
          "order": 0,
          "gender": 2
        },
        {
          "id": 2024,
          "name": "Farhan Akhtar",
          "original_name": "Farhan Akhtar",
          "character": "Imran Qureshi",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1077,
          "name": "Abhay Deol",
          "original_name": "Abhay Deol",
          "character": "Kabir Dewan",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1175,
          "name": "Katrina Kaif",
          "original_name": "Katrina Kaif",
          "character": "Laila",
          "order": 3,
          "gender": 1
        },
        {
          "id": 1176,
          "name": "Kalki Koechlin",
          "original_name": "Kalki Koechlin",
          "character": "Natasha",
          "order": 4,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2067,
          "name": "Zoya Akhtar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2019,
          "name": "Shankar-Ehsaan-Loy",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "ZNMD",
      "You Won’t Get Life Again"
    ]
  },
  {
    "details": {
      "id": 201101,
      "title": "Dookudu",
      "original_title": "దూకుడు",
      "original_language": "te",
      "overview": "An undercover IPS officer orchestrates an elaborate charade to shield his comatose politician father from the reality of his enemies.",
      "release_date": "2011-09-23",
      "runtime": 170,
      "budget": 350000000,
      "revenue": 1010000000,
      "vote_average": 7.4,
      "vote_count": 9800,
      "poster_path": "/dookudu_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 125,
          "name": "14 Reels Entertainment"
        }
      ]
    },
    "credits": {
      "id": 201101,
      "cast": [
        {
          "id": 1017,
          "name": "Mahesh Babu",
          "original_name": "Mahesh Babu",
          "character": "Ajay Kumar IPS",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1099,
          "name": "Samantha Ruth Prabhu",
          "original_name": "Samantha",
          "character": "Prashanthi",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1004,
          "name": "Prakash Raj",
          "original_name": "Prakash Raj",
          "character": "Shankar Narayana",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1080,
          "name": "Sonu Sood",
          "original_name": "Sonu Sood",
          "character": "Nayak",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1005,
          "name": "Brahmanandam",
          "original_name": "Brahmanandam",
          "character": "Padmasri",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2043,
          "name": "Srinu Vaitla",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2044,
          "name": "S. Thaman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Aggression"
    ]
  },
  {
    "details": {
      "id": 201102,
      "title": "Rockstar",
      "original_title": "रॉकस्टार",
      "original_language": "hi",
      "overview": "An aspiring musician discovers that musical greatness demands intense emotional heartbreak, leading to international stardom and personal ruin.",
      "release_date": "2011-11-11",
      "runtime": 159,
      "budget": 600000000,
      "revenue": 1090000000,
      "vote_average": 7.7,
      "vote_count": 21000,
      "poster_path": "/rockstar_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10402,
          "name": "Music"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 126,
          "name": "Eros International"
        }
      ]
    },
    "credits": {
      "id": 201102,
      "cast": [
        {
          "id": 1100,
          "name": "Ranbir Kapoor",
          "original_name": "Ranbir Kapoor",
          "character": "Janardhan Jakhar (Jordan)",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1101,
          "name": "Nargis Fakhri",
          "original_name": "Nargis Fakhri",
          "character": "Heer Kaul",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1102,
          "name": "Shammi Kapoor",
          "original_name": "Shammi Kapoor",
          "character": "Ustad Jameel Khan",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1103,
          "name": "Kumud Mishra",
          "original_name": "Kumud Mishra",
          "character": "Khatana Bhai",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2031,
          "name": "Imtiaz Ali",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2008,
          "name": "A. R. Rahman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Rockstar Jordan"
    ]
  },
  {
    "details": {
      "id": 201203,
      "title": "Gangs of Wasseypur",
      "original_title": "गैंग्स ऑफ वासेपुर",
      "original_language": "hi",
      "overview": "A clash between Sultan and Shahid Khan leads to the expulsion of Khan from Wasseypur and ignites a deadly, multi-generational blood feud.",
      "release_date": "2012-06-22",
      "runtime": 160,
      "budget": 185000000,
      "revenue": 510000000,
      "vote_average": 8.2,
      "vote_count": 31000,
      "poster_path": "/gangs_of_wasseypur_poster.jpg",
      "genres": [
        {
          "id": 80,
          "name": "Crime"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 28,
          "name": "Action"
        }
      ],
      "production_companies": [
        {
          "id": 129,
          "name": "Viacom18 Studios"
        }
      ]
    },
    "credits": {
      "id": 201203,
      "cast": [
        {
          "id": 1090,
          "name": "Manoj Bajpayee",
          "original_name": "Manoj Bajpayee",
          "character": "Sardar Khan",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1108,
          "name": "Nawazuddin Siddiqui",
          "original_name": "Nawazuddin Siddiqui",
          "character": "Faizal Khan",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1109,
          "name": "Richa Chadha",
          "original_name": "Richa Chadha",
          "character": "Nagma Khatoon",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1110,
          "name": "Pankaj Tripathi",
          "original_name": "Pankaj Tripathi",
          "character": "Sultan Qureshi",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1111,
          "name": "Tigmanshu Dhulia",
          "original_name": "Tigmanshu Dhulia",
          "character": "Ramadhir Singh",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2037,
          "name": "Anurag Kashyap",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2046,
          "name": "Sneha Khanwalkar",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "GOW Part 1"
    ]
  },
  {
    "details": {
      "id": 201201,
      "title": "Eega",
      "original_title": "ఈగ",
      "original_language": "te",
      "overview": "A murdered lover is reincarnated as a common housefly to seek vengeance against a ruthless industrialist and protect his true love.",
      "release_date": "2012-07-06",
      "runtime": 145,
      "budget": 300000000,
      "revenue": 1250000000,
      "vote_average": 7.7,
      "vote_count": 16500,
      "poster_path": "/eega_poster.jpg",
      "genres": [
        {
          "id": 14,
          "name": "Fantasy"
        },
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 35,
          "name": "Comedy"
        }
      ],
      "production_companies": [
        {
          "id": 127,
          "name": "Varahi Chalana Chitram"
        }
      ]
    },
    "credits": {
      "id": 201201,
      "cast": [
        {
          "id": 1104,
          "name": "Nani",
          "original_name": "Nani",
          "character": "Nani",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1099,
          "name": "Samantha Ruth Prabhu",
          "original_name": "Samantha",
          "character": "Bindu",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1105,
          "name": "Kichcha Sudeep",
          "original_name": "Sudeep",
          "character": "Sudeep",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1106,
          "name": "Adithya Menon",
          "original_name": "Adithya Menon",
          "character": "Doctor",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2010,
          "name": "S. S. Rajamouli",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2011,
          "name": "M. M. Keeravaani",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "The Fly",
      "Makkhi"
    ]
  },
  {
    "details": {
      "id": 201202,
      "title": "Barfi!",
      "original_title": "बर्फी!",
      "original_language": "hi",
      "overview": "A charming deaf-mute young man forms an unconventional bond with two beautiful women in the picturesque hills of Darjeeling.",
      "release_date": "2012-09-14",
      "runtime": 151,
      "budget": 350000000,
      "revenue": 1750000000,
      "vote_average": 8.1,
      "vote_count": 26000,
      "poster_path": "/barfi_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 128,
          "name": "UTV Motion Pictures"
        }
      ]
    },
    "credits": {
      "id": 201202,
      "cast": [
        {
          "id": 1100,
          "name": "Ranbir Kapoor",
          "original_name": "Ranbir Kapoor",
          "character": "Murphy (Barfi) Johnson",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1059,
          "name": "Priyanka Chopra",
          "original_name": "Priyanka Chopra",
          "character": "Jhilmil Chatterjee",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1075,
          "name": "Ileana D'Cruz",
          "original_name": "Ileana D'Cruz",
          "character": "Shruti Ghosh",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1107,
          "name": "Saurabh Shukla",
          "original_name": "Saurabh Shukla",
          "character": "Sudhanshu Dutta",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2045,
          "name": "Anurag Basu",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2021,
          "name": "Pritam",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Barfi"
    ]
  },
  {
    "details": {
      "id": 201302,
      "title": "Yeh Jawaani Hai Deewani",
      "original_title": "ये जवानी है दीवानी",
      "original_language": "hi",
      "overview": "Four friends experience love, ambition, and shifting perspectives as they navigate youth, a trekking trip in Manali, and a lavish Udaipur wedding.",
      "release_date": "2013-05-31",
      "runtime": 160,
      "budget": 450000000,
      "revenue": 3190000000,
      "vote_average": 7.2,
      "vote_count": 25000,
      "poster_path": "/yjhd_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 108,
          "name": "Dharma Productions"
        }
      ]
    },
    "credits": {
      "id": 201302,
      "cast": [
        {
          "id": 1100,
          "name": "Ranbir Kapoor",
          "original_name": "Ranbir Kapoor",
          "character": "Kabir (Bunny) Thapar",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1114,
          "name": "Deepika Padukone",
          "original_name": "Deepika Padukone",
          "character": "Naina Talwar",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1115,
          "name": "Aditya Roy Kapur",
          "original_name": "Aditya Roy Kapur",
          "character": "Avinash (Avi) Yog",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1116,
          "name": "Kalki Koechlin",
          "original_name": "Kalki Koechlin",
          "character": "Aditi Mehra",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2047,
          "name": "Ayan Mukerji",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2021,
          "name": "Pritam",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "YJHD"
    ]
  },
  {
    "details": {
      "id": 201303,
      "title": "The Lunchbox",
      "original_title": "द लंचबॉक्स",
      "original_language": "hi",
      "overview": "A mistaken delivery in Mumbai’s famously efficient lunchbox delivery system connects a lonely widower with an unhappy housewife through letters.",
      "release_date": "2013-09-20",
      "runtime": 104,
      "budget": 100000000,
      "revenue": 1100000000,
      "vote_average": 7.8,
      "vote_count": 18000,
      "poster_path": "/lunchbox_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 130,
          "name": "DAR Motion Pictures"
        },
        {
          "id": 131,
          "name": "Sikhya Entertainment"
        }
      ]
    },
    "credits": {
      "id": 201303,
      "cast": [
        {
          "id": 1117,
          "name": "Irrfan Khan",
          "original_name": "Irrfan Khan",
          "character": "Saajan Fernandes",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1118,
          "name": "Nimrat Kaur",
          "original_name": "Nimrat Kaur",
          "character": "Ila",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1108,
          "name": "Nawazuddin Siddiqui",
          "original_name": "Nawazuddin Siddiqui",
          "character": "Shaikh",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1119,
          "name": "Lillete Dubey",
          "original_name": "Lillete Dubey",
          "character": "Ila’s Mother",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2048,
          "name": "Ritesh Batra",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2049,
          "name": "Max Richter",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Dabba"
    ]
  },
  {
    "details": {
      "id": 201301,
      "title": "Attarintiki Daredi",
      "original_title": "అత్తారింటికి దారేది",
      "original_language": "te",
      "overview": "A billionaire heir enters his estranged aunt’s household disguised as a driver to reconcile her with his grandfather.",
      "release_date": "2013-09-27",
      "runtime": 170,
      "budget": 450000000,
      "revenue": 1870000000,
      "vote_average": 7.3,
      "vote_count": 10500,
      "poster_path": "/attarintiki_daredi_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 28,
          "name": "Action"
        }
      ],
      "production_companies": [
        {
          "id": 111,
          "name": "Sri Venkateswara Cine Chitra"
        }
      ]
    },
    "credits": {
      "id": 201301,
      "cast": [
        {
          "id": 1074,
          "name": "Pawan Kalyan",
          "original_name": "Pawan Kalyan",
          "character": "Goutham Nanda / Siddhu",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1099,
          "name": "Samantha Ruth Prabhu",
          "original_name": "Samantha",
          "character": "Sashi",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1112,
          "name": "Pranitha Subhash",
          "original_name": "Pranitha Subhash",
          "character": "Prameela",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1113,
          "name": "Nadhiya",
          "original_name": "Nadhiya",
          "character": "Sunanda",
          "order": 3,
          "gender": 1
        },
        {
          "id": 1057,
          "name": "Boman Irani",
          "original_name": "Boman Irani",
          "character": "Raghunandan",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2032,
          "name": "Trivikram Srinivas",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2004,
          "name": "Devi Sri Prasad",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Which Way to Auntie's House?"
    ]
  },
  {
    "details": {
      "id": 201403,
      "title": "Queen",
      "original_title": "क्वीन",
      "original_language": "hi",
      "overview": "After her fiancé calls off their wedding, a sheltered Delhi girl embarks on her pre-booked solo honeymoon in Paris and Amsterdam, discovering her true self.",
      "release_date": "2014-03-07",
      "runtime": 144,
      "budget": 125000000,
      "revenue": 970000000,
      "vote_average": 8.1,
      "vote_count": 22500,
      "poster_path": "/queen_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 132,
          "name": "Phantom Films"
        }
      ]
    },
    "credits": {
      "id": 201403,
      "cast": [
        {
          "id": 1124,
          "name": "Kangana Ranaut",
          "original_name": "Kangana Ranaut",
          "character": "Rani Mehra",
          "order": 0,
          "gender": 1
        },
        {
          "id": 1125,
          "name": "Rajkummar Rao",
          "original_name": "Rajkummar Rao",
          "character": "Vijay Dhingra",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1126,
          "name": "Lisa Haydon",
          "original_name": "Lisa Haydon",
          "character": "Vijayalakshmi",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1127,
          "name": "Mish Boyko",
          "original_name": "Mish Boyko",
          "character": "Oleksander (Roxane)",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2052,
          "name": "Vikas Bahl",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2038,
          "name": "Amit Trivedi",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Queen 2014"
    ]
  },
  {
    "details": {
      "id": 201401,
      "title": "Manam",
      "original_title": "మనం",
      "original_language": "te",
      "overview": "A sprawling multi-generational reincarnation romance where past reincarnations cross paths across a hundred years to unite true lovers.",
      "release_date": "2014-05-23",
      "runtime": 163,
      "budget": 280000000,
      "revenue": 620000000,
      "vote_average": 7.9,
      "vote_count": 8500,
      "poster_path": "/manam_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 14,
          "name": "Fantasy"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 102,
          "name": "Annapurna Studios"
        }
      ]
    },
    "credits": {
      "id": 201401,
      "cast": [
        {
          "id": 1120,
          "name": "Akkineni Nageswara Rao",
          "original_name": "ANR",
          "character": "Chaitanya",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1006,
          "name": "Nagarjuna Akkineni",
          "original_name": "Nagarjuna",
          "character": "Nageswara Rao / Bittu",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1121,
          "name": "Naga Chaitanya",
          "original_name": "Naga Chaitanya",
          "character": "Radha Mohan / Nagarjuna",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1099,
          "name": "Samantha Ruth Prabhu",
          "original_name": "Samantha",
          "character": "Krishna Veni / Anjali",
          "order": 3,
          "gender": 1
        },
        {
          "id": 1041,
          "name": "Shriya Saran",
          "original_name": "Shriya Saran",
          "character": "Ramalakshmi / Anjali",
          "order": 4,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2050,
          "name": "Vikram Kumar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2051,
          "name": "Anup Rubens",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Us"
    ]
  },
  {
    "details": {
      "id": 201402,
      "title": "PK",
      "original_title": "पीके",
      "original_language": "hi",
      "overview": "An innocent humanoid alien stranded on Earth questions human superstitions, organized religion, and dogma while trying to recover his remote.",
      "release_date": "2014-12-19",
      "runtime": 153,
      "budget": 850000000,
      "revenue": 8320000000,
      "vote_average": 8.1,
      "vote_count": 36000,
      "poster_path": "/pk_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 878,
          "name": "Science Fiction"
        }
      ],
      "production_companies": [
        {
          "id": 114,
          "name": "Vinod Chopra Films"
        }
      ]
    },
    "credits": {
      "id": 201402,
      "cast": [
        {
          "id": 1050,
          "name": "Aamir Khan",
          "original_name": "Aamir Khan",
          "character": "PK",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1122,
          "name": "Anushka Sharma",
          "original_name": "Anushka Sharma",
          "character": "Jagat Janani (Jagu)",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1123,
          "name": "Sushant Singh Rajput",
          "original_name": "Sushant Singh Rajput",
          "character": "Sarfaraz Yousuf",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1057,
          "name": "Boman Irani",
          "original_name": "Boman Irani",
          "character": "Cherry Bajwa",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1111,
          "name": "Saurabh Shukla",
          "original_name": "Saurabh Shukla",
          "character": "Tapasvi Maharaj",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2025,
          "name": "Rajkumar Hirani",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2026,
          "name": "Shantanu Moitra",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Peekay"
    ]
  },
  {
    "details": {
      "id": 201503,
      "title": "Piku",
      "original_title": "पीकू",
      "original_language": "hi",
      "overview": "A quirky road trip from Delhi to Kolkata brings an independent architect closer to her hypochondriac aging father and a patient cab service owner.",
      "release_date": "2015-05-08",
      "runtime": 123,
      "budget": 420000000,
      "revenue": 1410000000,
      "vote_average": 7.6,
      "vote_count": 22000,
      "poster_path": "/piku_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 134,
          "name": "MSM Motion Pictures"
        },
        {
          "id": 135,
          "name": "Rising Sun Films"
        }
      ]
    },
    "credits": {
      "id": 201503,
      "cast": [
        {
          "id": 1114,
          "name": "Deepika Padukone",
          "original_name": "Deepika Padukone",
          "character": "Piku Banerjee",
          "order": 0,
          "gender": 1
        },
        {
          "id": 1036,
          "name": "Amitabh Bachchan",
          "original_name": "Amitabh Bachchan",
          "character": "Bhashkor Banerjee",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1117,
          "name": "Irrfan Khan",
          "original_name": "Irrfan Khan",
          "character": "Rana Chaudhary",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1133,
          "name": "Moushumi Chatterjee",
          "original_name": "Moushumi Chatterjee",
          "character": "Chobi Mashi",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2054,
          "name": "Shoojit Sircar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2055,
          "name": "Anupam Roy",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Piku 2015"
    ]
  },
  {
    "details": {
      "id": 201501,
      "title": "Baahubali: The Beginning",
      "original_title": "బాహుబలి: ద బిగినింగ్",
      "original_language": "te",
      "overview": "In ancient Mahishmati kingdom, an adventurous tribal youth discovers his royal lineage and sets out to rescue his biological mother.",
      "release_date": "2015-07-10",
      "runtime": 159,
      "budget": 1800000000,
      "revenue": 6500000000,
      "vote_average": 8,
      "vote_count": 42000,
      "poster_path": "/baahubali_beginning_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 12,
          "name": "Adventure"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 123,
          "name": "Arka Media Works"
        }
      ]
    },
    "credits": {
      "id": 201501,
      "cast": [
        {
          "id": 1033,
          "name": "Prabhas",
          "original_name": "Prabhas",
          "character": "Shivudu / Amarendra Baahubali",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1128,
          "name": "Rana Daggubati",
          "original_name": "Rana Daggubati",
          "character": "Bhallaladeva",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1082,
          "name": "Anushka Shetty",
          "original_name": "Anushka Shetty",
          "character": "Devasena",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1129,
          "name": "Tamannaah Bhatia",
          "original_name": "Tamannaah",
          "character": "Avanthika",
          "order": 3,
          "gender": 1
        },
        {
          "id": 1130,
          "name": "Ramya Krishnan",
          "original_name": "Ramya Krishnan",
          "character": "Sivagami Devi",
          "order": 4,
          "gender": 1
        },
        {
          "id": 1131,
          "name": "Sathyaraj",
          "original_name": "Sathyaraj",
          "character": "Kattappa",
          "order": 5,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2010,
          "name": "S. S. Rajamouli",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2011,
          "name": "M. M. Keeravaani",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Baahubali 1"
    ]
  },
  {
    "details": {
      "id": 201502,
      "title": "Bajrangi Bhaijaan",
      "original_title": "बजरंगी भाईजान",
      "original_language": "hi",
      "overview": "A compassionate, devout Hanuman devotee embarks on a perilous journey across the Indo-Pak border to reunite a mute Pakistani child with her parents.",
      "release_date": "2015-07-17",
      "runtime": 163,
      "budget": 900000000,
      "revenue": 9690000000,
      "vote_average": 8.1,
      "vote_count": 39000,
      "poster_path": "/bajrangi_bhaijaan_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 12,
          "name": "Adventure"
        }
      ],
      "production_companies": [
        {
          "id": 133,
          "name": "Salman Khan Films"
        }
      ]
    },
    "credits": {
      "id": 201502,
      "cast": [
        {
          "id": 1091,
          "name": "Salman Khan",
          "original_name": "Salman Khan",
          "character": "Pawan Kumar Chaturvedi (Bajrangi)",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1132,
          "name": "Harshaali Malhotra",
          "original_name": "Harshaali Malhotra",
          "character": "Shahida (Munni)",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1071,
          "name": "Kareena Kapoor Khan",
          "original_name": "Kareena Kapoor",
          "character": "Rasika Pandey",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1108,
          "name": "Nawazuddin Siddiqui",
          "original_name": "Nawazuddin Siddiqui",
          "character": "Chand Nawab",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2053,
          "name": "Kabir Khan",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2021,
          "name": "Pritam",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Brother Bajrangi"
    ]
  },
  {
    "details": {
      "id": 201601,
      "title": "Pelli Choopulu",
      "original_title": "పెళ్లి చూపులు",
      "original_language": "te",
      "overview": "Two mismatched youths meet during an arranged matchmaking meeting and end up partnering to start a successful food truck business.",
      "release_date": "2016-07-29",
      "runtime": 125,
      "budget": 15000000,
      "revenue": 350000000,
      "vote_average": 8.2,
      "vote_count": 11500,
      "poster_path": "/pelli_choopulu_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 136,
          "name": "Dharmapath Creations"
        }
      ]
    },
    "credits": {
      "id": 201601,
      "cast": [
        {
          "id": 1134,
          "name": "Vijay Deverakonda",
          "original_name": "Vijay Deverakonda",
          "character": "Prashanth",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1135,
          "name": "Ritu Varma",
          "original_name": "Ritu Varma",
          "character": "Chitra",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1136,
          "name": "Priyadarshi Pulikonda",
          "original_name": "Priyadarshi",
          "character": "Kaushik",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1137,
          "name": "Abhay Bethiganti",
          "original_name": "Abhay Bethiganti",
          "character": "Vishnu",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2056,
          "name": "Tharun Bhascker",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2057,
          "name": "Vivek Sagar",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Matchmaking"
    ]
  },
  {
    "details": {
      "id": 201602,
      "title": "Pink",
      "original_title": "पिंक",
      "original_language": "hi",
      "overview": "When three independent young women are falsely accused of a crime after resisting sexual assault, a retired lawyer steps in to fight for their consent.",
      "release_date": "2016-09-16",
      "runtime": 136,
      "budget": 230000000,
      "revenue": 1070000000,
      "vote_average": 8.1,
      "vote_count": 24000,
      "poster_path": "/pink_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 53,
          "name": "Thriller"
        },
        {
          "id": 80,
          "name": "Crime"
        }
      ],
      "production_companies": [
        {
          "id": 135,
          "name": "Rising Sun Films"
        }
      ]
    },
    "credits": {
      "id": 201602,
      "cast": [
        {
          "id": 1036,
          "name": "Amitabh Bachchan",
          "original_name": "Amitabh Bachchan",
          "character": "Deepak Sehgal",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1138,
          "name": "Taapsee Pannu",
          "original_name": "Taapsee Pannu",
          "character": "Minal Arora",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1139,
          "name": "Kirti Kulhari",
          "original_name": "Kirti Kulhari",
          "character": "Falak Ali",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1140,
          "name": "Andrea Tariang",
          "original_name": "Andrea Tariang",
          "character": "Andrea",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2058,
          "name": "Aniruddha Roy Chowdhury",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2026,
          "name": "Shantanu Moitra",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Pink: No Means No"
    ]
  },
  {
    "details": {
      "id": 201701,
      "title": "Arjun Reddy",
      "original_title": "అర్జున్ రెడ్డి",
      "original_language": "te",
      "overview": "A brilliant house surgeon with extreme anger-management issues spirals into substance abuse when his girlfriend is forced to marry another man.",
      "release_date": "2017-08-25",
      "runtime": 182,
      "budget": 50000000,
      "revenue": 510000000,
      "vote_average": 8,
      "vote_count": 19500,
      "poster_path": "/arjun_reddy_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        }
      ],
      "production_companies": [
        {
          "id": 137,
          "name": "Bhadrakali Pictures"
        }
      ]
    },
    "credits": {
      "id": 201701,
      "cast": [
        {
          "id": 1134,
          "name": "Vijay Deverakonda",
          "original_name": "Vijay Deverakonda",
          "character": "Dr. Arjun Reddy Deshmukh",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1141,
          "name": "Shalini Pandey",
          "original_name": "Shalini Pandey",
          "character": "Dr. Preethi Shetty",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1142,
          "name": "Rahul Ramakrishna",
          "original_name": "Rahul Ramakrishna",
          "character": "Shiva",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1143,
          "name": "Jia Sharma",
          "original_name": "Jia Sharma",
          "character": "Jia",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2059,
          "name": "Sandeep Reddy Vanga",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2060,
          "name": "Radhan",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Arjun Reddy 2017"
    ]
  },
  {
    "details": {
      "id": 201702,
      "title": "Secret Superstar",
      "original_title": "सीक्रेट सुपरस्टार",
      "original_language": "hi",
      "overview": "A passionate 14-year-old Muslim girl from Vadodara aspires to be a singer while wearing a niqab on YouTube to hide her identity from her abusive father.",
      "release_date": "2017-10-19",
      "runtime": 150,
      "budget": 150000000,
      "revenue": 9650000000,
      "vote_average": 7.8,
      "vote_count": 26000,
      "poster_path": "/secret_superstar_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10402,
          "name": "Music"
        }
      ],
      "production_companies": [
        {
          "id": 117,
          "name": "Aamir Khan Productions"
        }
      ]
    },
    "credits": {
      "id": 201702,
      "cast": [
        {
          "id": 1144,
          "name": "Zaira Wasim",
          "original_name": "Zaira Wasim",
          "character": "Insia Malik",
          "order": 0,
          "gender": 1
        },
        {
          "id": 1145,
          "name": "Meher Vij",
          "original_name": "Meher Vij",
          "character": "Najma Malik",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1050,
          "name": "Aamir Khan",
          "original_name": "Aamir Khan",
          "character": "Shakti Kumar",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1146,
          "name": "Raj Arjun",
          "original_name": "Raj Arjun",
          "character": "Farookh Malik",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2061,
          "name": "Advait Chandan",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2038,
          "name": "Amit Trivedi",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Secret Singer"
    ]
  },
  {
    "details": {
      "id": 201801,
      "title": "Mahanati",
      "original_title": "మహానటి",
      "original_language": "te",
      "overview": "The biographical saga charting the turbulent life, unparalleled stardom, and tragic fall of South Indian cinema legend Savitri.",
      "release_date": "2018-05-09",
      "runtime": 177,
      "budget": 350000000,
      "revenue": 830000000,
      "vote_average": 8.5,
      "vote_count": 14000,
      "poster_path": "/mahanati_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 36,
          "name": "History"
        }
      ],
      "production_companies": [
        {
          "id": 101,
          "name": "Vyjayanthi Movies"
        },
        {
          "id": 138,
          "name": "Swapna Cinema"
        }
      ]
    },
    "credits": {
      "id": 201801,
      "cast": [
        {
          "id": 1147,
          "name": "Keerthy Suresh",
          "original_name": "Keerthy Suresh",
          "character": "Savitri",
          "order": 0,
          "gender": 1
        },
        {
          "id": 1148,
          "name": "Dulquer Salmaan",
          "original_name": "Dulquer Salmaan",
          "character": "Gemini Ganesan",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1099,
          "name": "Samantha Ruth Prabhu",
          "original_name": "Samantha",
          "character": "Madhuravani",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1134,
          "name": "Vijay Deverakonda",
          "original_name": "Vijay Deverakonda",
          "character": "Vijay Anthony",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2062,
          "name": "Nag Ashwin",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2063,
          "name": "Mickey J. Meyer",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Nadigaiyar Thilagam"
    ]
  },
  {
    "details": {
      "id": 201803,
      "title": "Raazi",
      "original_title": "राज़ी",
      "original_language": "hi",
      "overview": "Prior to the 1971 Indo-Pak war, a young Kashmiri woman is trained as an undercover RAW spy and married into a Pakistani military family.",
      "release_date": "2018-05-11",
      "runtime": 138,
      "budget": 350000000,
      "revenue": 1960000000,
      "vote_average": 7.7,
      "vote_count": 23500,
      "poster_path": "/raazi_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 53,
          "name": "Thriller"
        }
      ],
      "production_companies": [
        {
          "id": 108,
          "name": "Dharma Productions"
        },
        {
          "id": 140,
          "name": "Junglee Pictures"
        }
      ]
    },
    "credits": {
      "id": 201803,
      "cast": [
        {
          "id": 1152,
          "name": "Alia Bhatt",
          "original_name": "Alia Bhatt",
          "character": "Sehmat Khan Syed",
          "order": 0,
          "gender": 1
        },
        {
          "id": 1153,
          "name": "Vicky Kaushal",
          "original_name": "Vicky Kaushal",
          "character": "Iqbal Syed",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1154,
          "name": "Jaideep Ahlawat",
          "original_name": "Jaideep Ahlawat",
          "character": "Khalid Mir",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1155,
          "name": "Shishir Sharma",
          "original_name": "Shishir Sharma",
          "character": "Brigadier Parvez Syed",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2066,
          "name": "Meghna Gulzar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2013,
          "name": "Shankar-Ehsaan-Loy",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Agree"
    ]
  },
  {
    "details": {
      "id": 201802,
      "title": "Stree",
      "original_title": "स्त्री",
      "original_language": "hi",
      "overview": "In the small town of Chanderi, a legendary female ghost abducts men during festival nights, prompting an eccentric tailor and friends to save the town.",
      "release_date": "2018-08-31",
      "runtime": 128,
      "budget": 240000000,
      "revenue": 1810000000,
      "vote_average": 7.5,
      "vote_count": 27000,
      "poster_path": "/stree_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 27,
          "name": "Horror"
        }
      ],
      "production_companies": [
        {
          "id": 139,
          "name": "Maddock Films"
        }
      ]
    },
    "credits": {
      "id": 201802,
      "cast": [
        {
          "id": 1125,
          "name": "Rajkummar Rao",
          "original_name": "Rajkummar Rao",
          "character": "Vicky",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1149,
          "name": "Shraddha Kapoor",
          "original_name": "Shraddha Kapoor",
          "character": "The Mysterious Woman",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1110,
          "name": "Pankaj Tripathi",
          "original_name": "Pankaj Tripathi",
          "character": "Rudra",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1150,
          "name": "Aparshakti Khurana",
          "original_name": "Aparshakti Khurana",
          "character": "Bittu",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1151,
          "name": "Abhishek Banerjee",
          "original_name": "Abhishek Banerjee",
          "character": "Jana",
          "order": 4,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2064,
          "name": "Amar Kaushik",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2065,
          "name": "Sachin-Jigar",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Stree 1"
    ]
  },
  {
    "details": {
      "id": 201903,
      "title": "Uri: The Surgical Strike",
      "original_title": "उरी: द सर्जिकल स्ट्राइक",
      "original_language": "hi",
      "overview": "Indian army special forces execute a covert surgical strike against terrorist launchpads across the Line of Control following the 2016 Uri terror attack.",
      "release_date": "2019-01-11",
      "runtime": 138,
      "budget": 250000000,
      "revenue": 3590000000,
      "vote_average": 8.2,
      "vote_count": 38000,
      "poster_path": "/uri_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 36,
          "name": "History"
        }
      ],
      "production_companies": [
        {
          "id": 143,
          "name": "RSVP Movies"
        }
      ]
    },
    "credits": {
      "id": 201903,
      "cast": [
        {
          "id": 1153,
          "name": "Vicky Kaushal",
          "original_name": "Vicky Kaushal",
          "character": "Major Vihaan Singh Shergill",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1162,
          "name": "Yami Gautam",
          "original_name": "Yami Gautam",
          "character": "Pallavi Sharma / Jasmine Almeida",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1163,
          "name": "Paresh Rawal",
          "original_name": "Paresh Rawal",
          "character": "Govind Bhardwaj",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1164,
          "name": "Mohit Raina",
          "original_name": "Mohit Raina",
          "character": "Major Karan Kashyap",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2071,
          "name": "Aditya Dhar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2072,
          "name": "Shashwat Sachdev",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Uri"
    ]
  },
  {
    "details": {
      "id": 201902,
      "title": "Gully Boy",
      "original_title": "गली बॉय",
      "original_language": "hi",
      "overview": "An underprivileged young man from the slums of Dharavi discovers his voice and triumphs over socioeconomic hurdles through underground rap.",
      "release_date": "2019-02-14",
      "runtime": 154,
      "budget": 600000000,
      "revenue": 2380000000,
      "vote_average": 7.9,
      "vote_count": 32000,
      "poster_path": "/gully_boy_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10402,
          "name": "Music"
        }
      ],
      "production_companies": [
        {
          "id": 115,
          "name": "Excel Entertainment"
        },
        {
          "id": 142,
          "name": "Tiger Baby Films"
        }
      ]
    },
    "credits": {
      "id": 201902,
      "cast": [
        {
          "id": 1159,
          "name": "Ranveer Singh",
          "original_name": "Ranveer Singh",
          "character": "Murad Ahmed (Gully Boy)",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1152,
          "name": "Alia Bhatt",
          "original_name": "Alia Bhatt",
          "character": "Safeena Firdausi",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1160,
          "name": "Siddhant Chaturvedi",
          "original_name": "Siddhant Chaturvedi",
          "character": "Shrikant Bhosle (MC Sher)",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1161,
          "name": "Vijay Raaz",
          "original_name": "Vijay Raaz",
          "character": "Aftab Shakir Ahmed",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2069,
          "name": "Zoya Akhtar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2070,
          "name": "Karsh Kale",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Street Boy"
    ]
  },
  {
    "details": {
      "id": 201901,
      "title": "Jersey",
      "original_title": "జెర్సీ",
      "original_language": "te",
      "overview": "A gifted but failed cricketer in his late thirties attempts a heroic comeback to the Ranji Trophy to fulfill his young son's wish for an Indian jersey.",
      "release_date": "2019-04-19",
      "runtime": 157,
      "budget": 250000000,
      "revenue": 550000000,
      "vote_average": 8.5,
      "vote_count": 17500,
      "poster_path": "/jersey_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10751,
          "name": "Family"
        }
      ],
      "production_companies": [
        {
          "id": 141,
          "name": "Sithara Entertainments"
        }
      ]
    },
    "credits": {
      "id": 201901,
      "cast": [
        {
          "id": 1104,
          "name": "Nani",
          "original_name": "Nani",
          "character": "Arjun",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1156,
          "name": "Shraddha Srinath",
          "original_name": "Shraddha Srinath",
          "character": "Sarah",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1157,
          "name": "Sathyaraj",
          "original_name": "Sathyaraj",
          "character": "Coach Murthy",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1158,
          "name": "Ronit Kamra",
          "original_name": "Ronit Kamra",
          "character": "Nani",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2067,
          "name": "Gowtam Tinnanuri",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2068,
          "name": "Anirudh Ravichander",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Jersey 2019"
    ]
  },
  {
    "details": {
      "id": 202001,
      "title": "Tanhaji: The Unsung Warrior",
      "original_title": "तान्हाजी: द अनसंग वॉरियर",
      "original_language": "hi",
      "overview": "Subedar Tanaji Malusare leads Maratha warriors in a daring night assault to recapture the strategic fortress of Kondhana from Mughal forces.",
      "release_date": "2020-01-10",
      "runtime": 135,
      "budget": 1500000000,
      "revenue": 3680000000,
      "vote_average": 7.5,
      "vote_count": 24000,
      "poster_path": "/tanhaji_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 36,
          "name": "History"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 144,
          "name": "Ajay Devgn FFilms"
        },
        {
          "id": 145,
          "name": "T-Series"
        }
      ]
    },
    "credits": {
      "id": 202001,
      "cast": [
        {
          "id": 1165,
          "name": "Ajay Devgn",
          "original_name": "Ajay Devgn",
          "character": "Tanaji Malusare",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1024,
          "name": "Saif Ali Khan",
          "original_name": "Saif Ali Khan",
          "character": "Udaybhan Singh Rathore",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1166,
          "name": "Kajol",
          "original_name": "Kajol",
          "character": "Savitribai Malusare",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1167,
          "name": "Sharad Kelkar",
          "original_name": "Sharad Kelkar",
          "character": "Chhatrapati Shivaji Maharaj",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2073,
          "name": "Om Raut",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2074,
          "name": "Ajay-Atul",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Tanhaji"
    ]
  },
  {
    "details": {
      "id": 202002,
      "title": "Ala Vaikunthapurramuloo",
      "original_title": "అల వైకుంఠపురములో",
      "original_language": "te",
      "overview": "Swapped at birth by an envious clerk, an intelligent young man discovers his true billionaire parents and enters their palatial estate to set things right.",
      "release_date": "2020-01-12",
      "runtime": 163,
      "budget": 1000000000,
      "revenue": 2800000000,
      "vote_average": 7.9,
      "vote_count": 14500,
      "poster_path": "/alavaikunthapurramuloo_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 152,
          "name": "Geetha Arts"
        },
        {
          "id": 154,
          "name": "Haarika & Hassine Creations"
        }
      ]
    },
    "credits": {
      "id": 202002,
      "cast": [
        {
          "id": 1036,
          "name": "Allu Arjun",
          "original_name": "Allu Arjun",
          "character": "Bantu",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1177,
          "name": "Pooja Hegde",
          "original_name": "Pooja Hegde",
          "character": "Amulya",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1178,
          "name": "Tabu",
          "original_name": "Tabu",
          "character": "Yasoda",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1179,
          "name": "Jayaram",
          "original_name": "Jayaram",
          "character": "Ramachandra",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2048,
          "name": "Trivikram Srinivas",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2041,
          "name": "S. Thaman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "AVPL"
    ]
  },
  {
    "details": {
      "id": 202102,
      "title": "Jathi Ratnalu",
      "original_title": "జాతి రత్నాలు",
      "original_language": "te",
      "overview": "Three naive small-town friends travel to Hyderabad for better jobs, only to find themselves framed for the attempted murder of a state minister.",
      "release_date": "2021-03-11",
      "runtime": 145,
      "budget": 40000000,
      "revenue": 750000000,
      "vote_average": 7.4,
      "vote_count": 12000,
      "poster_path": "/jathi_ratnalu_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        }
      ],
      "production_companies": [
        {
          "id": 138,
          "name": "Swapna Cinema"
        }
      ]
    },
    "credits": {
      "id": 202102,
      "cast": [
        {
          "id": 1172,
          "name": "Naveen Polishetty",
          "original_name": "Naveen Polishetty",
          "character": "Srikanth",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1136,
          "name": "Priyadarshi Pulikonda",
          "original_name": "Priyadarshi",
          "character": "Sekhar",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1142,
          "name": "Rahul Ramakrishna",
          "original_name": "Rahul Ramakrishna",
          "character": "Ravi",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1173,
          "name": "Faria Abdullah",
          "original_name": "Faria Abdullah",
          "character": "Chitti",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2077,
          "name": "Anudeep K. V.",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2060,
          "name": "Radhan",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Gems of the Nation"
    ]
  },
  {
    "details": {
      "id": 202101,
      "title": "Shershaah",
      "original_title": "शेरशाह",
      "original_language": "hi",
      "overview": "The heroic life and supreme sacrifice of Param Vir Chakra awardee Captain Vikram Batra during the 1999 Kargil War.",
      "release_date": "2021-08-12",
      "runtime": 135,
      "budget": 500000000,
      "revenue": 1200000000,
      "vote_average": 8.4,
      "vote_count": 36000,
      "poster_path": "/shershaah_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 36,
          "name": "History"
        }
      ],
      "production_companies": [
        {
          "id": 108,
          "name": "Dharma Productions"
        }
      ]
    },
    "credits": {
      "id": 202101,
      "cast": [
        {
          "id": 1168,
          "name": "Sidharth Malhotra",
          "original_name": "Sidharth Malhotra",
          "character": "Captain Vikram Batra / Vishal Batra",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1169,
          "name": "Kiara Advani",
          "original_name": "Kiara Advani",
          "character": "Dimple Cheema",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1170,
          "name": "Shiv Panditt",
          "original_name": "Shiv Panditt",
          "character": "Captain Sanjeev Jamwal",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1171,
          "name": "Nikitin Dheer",
          "original_name": "Nikitin Dheer",
          "character": "Major Ajay Singh Jasrotia",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2075,
          "name": "Vishnuvardhan",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2076,
          "name": "Tanishk Bagchi",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Lion King of Kargil"
    ]
  },
  {
    "details": {
      "id": 202103,
      "title": "Pushpa: The Rise",
      "original_title": "పుష్ప: ది రైజ్",
      "original_language": "te",
      "overview": "A fearless red sandalwood smuggler in the Seshachalam forests of Andhra Pradesh rises through the ranks of an illegal syndicate, defying ruthless police chiefs.",
      "release_date": "2021-12-17",
      "runtime": 179,
      "budget": 2000000000,
      "revenue": 3730000000,
      "vote_average": 7.8,
      "vote_count": 19500,
      "poster_path": "/pushpa_rise_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 80,
          "name": "Crime"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 155,
          "name": "Mythri Movie Makers"
        }
      ]
    },
    "credits": {
      "id": 202103,
      "cast": [
        {
          "id": 1036,
          "name": "Allu Arjun",
          "original_name": "Allu Arjun",
          "character": "Pushpa Raj",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1146,
          "name": "Rashmika Mandanna",
          "original_name": "Rashmika Mandanna",
          "character": "Srivalli",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1180,
          "name": "Fahadh Faasil",
          "original_name": "Fahadh Faasil",
          "character": "SP Bhanwar Singh Shekhawat IPS",
          "order": 2,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2022,
          "name": "Sukumar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2004,
          "name": "Devi Sri Prasad",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Pushpa Part 1",
      "Pushpa The Rise"
    ]
  },
  {
    "details": {
      "id": 202201,
      "title": "Sita Ramam",
      "original_title": "సీతా రామం",
      "original_language": "te",
      "overview": "An orphaned Indian Army lieutenant stationed in Kashmir receives anonymous romantic letters from a woman named Sita, sparking an epic timeless love story.",
      "release_date": "2022-08-05",
      "runtime": 163,
      "budget": 300000000,
      "revenue": 1050000000,
      "vote_average": 8.5,
      "vote_count": 29000,
      "poster_path": "/sita_ramam_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 10749,
          "name": "Romance"
        },
        {
          "id": 10752,
          "name": "War"
        }
      ],
      "production_companies": [
        {
          "id": 101,
          "name": "Vyjayanthi Movies"
        },
        {
          "id": 138,
          "name": "Swapna Cinema"
        }
      ]
    },
    "credits": {
      "id": 202201,
      "cast": [
        {
          "id": 1148,
          "name": "Dulquer Salmaan",
          "original_name": "Dulquer Salmaan",
          "character": "Lieutenant Ram",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1174,
          "name": "Mrunal Thakur",
          "original_name": "Mrunal Thakur",
          "character": "Sita Mahalakshmi / Princess Noor Jahan",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1175,
          "name": "Rashmika Mandanna",
          "original_name": "Rashmika Mandanna",
          "character": "Afreen",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1176,
          "name": "Sumanth",
          "original_name": "Sumanth",
          "character": "Brigadier Vishnu Sharma",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2078,
          "name": "Hanu Raghavapudi",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2079,
          "name": "Vishal Chandrashekhar",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Sita Ramam 2022"
    ]
  },
  {
    "details": {
      "id": 202202,
      "title": "Brahmāstra: Part One – Shiva",
      "original_title": "ब्रह्मास्त्र: पहला भाग – शिवा",
      "original_language": "hi",
      "overview": "A Mumbai DJ with a mysterious connection to the element of fire learns of his divine ancestry in the secret society of Astras.",
      "release_date": "2022-09-09",
      "runtime": 167,
      "budget": 3750000000,
      "revenue": 4310000000,
      "vote_average": 6.6,
      "vote_count": 28000,
      "poster_path": "/brahmastra_poster.jpg",
      "genres": [
        {
          "id": 14,
          "name": "Fantasy"
        },
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 12,
          "name": "Adventure"
        }
      ],
      "production_companies": [
        {
          "id": 108,
          "name": "Dharma Productions"
        }
      ]
    },
    "credits": {
      "id": 202202,
      "cast": [
        {
          "id": 1100,
          "name": "Ranbir Kapoor",
          "original_name": "Ranbir Kapoor",
          "character": "Shiva",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1152,
          "name": "Alia Bhatt",
          "original_name": "Alia Bhatt",
          "character": "Isha Chatterjee",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1036,
          "name": "Amitabh Bachchan",
          "original_name": "Amitabh Bachchan",
          "character": "Guruji (Raghu)",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1006,
          "name": "Nagarjuna Akkineni",
          "original_name": "Nagarjuna",
          "character": "Anish Shetty",
          "order": 3,
          "gender": 2
        },
        {
          "id": 1177,
          "name": "Mouni Roy",
          "original_name": "Mouni Roy",
          "character": "Junoon",
          "order": 4,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2047,
          "name": "Ayan Mukerji",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2021,
          "name": "Pritam",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Brahmastra"
    ]
  },
  {
    "details": {
      "id": 202302,
      "title": "12th Fail",
      "original_title": "12वीं फेल",
      "original_language": "hi",
      "overview": "The biographical account of Manoj Kumar Sharma, who overcomes extreme poverty and academic failure in Chambal to become an IPS officer.",
      "release_date": "2023-10-27",
      "runtime": 147,
      "budget": 200000000,
      "revenue": 690000000,
      "vote_average": 8.9,
      "vote_count": 54000,
      "poster_path": "/12th_fail_poster.jpg",
      "genres": [
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 36,
          "name": "History"
        }
      ],
      "production_companies": [
        {
          "id": 114,
          "name": "Vinod Chopra Films"
        }
      ]
    },
    "credits": {
      "id": 202302,
      "cast": [
        {
          "id": 1181,
          "name": "Vikrant Massey",
          "original_name": "Vikrant Massey",
          "character": "Manoj Kumar Sharma",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1182,
          "name": "Medha Shankr",
          "original_name": "Medha Shankr",
          "character": "Shraddha Joshi",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1183,
          "name": "Anant V Joshi",
          "original_name": "Anant V Joshi",
          "character": "Pritam Pandey",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1184,
          "name": "Anshumaan Pushkar",
          "original_name": "Anshumaan Pushkar",
          "character": "Gauri Bhaiya",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2082,
          "name": "Vidhu Vinod Chopra",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2026,
          "name": "Shantanu Moitra",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Twelfth Fail"
    ]
  },
  {
    "details": {
      "id": 202301,
      "title": "Salaar: Part 1 – Ceasefire",
      "original_title": "సలార్: పార్ట్ 1 – సీజ్‌ఫైర్",
      "original_language": "te",
      "overview": "In the lawless fortress city-state of Khansaar, a fearsome warrior rises to honor an unbreakable childhood oath to protect the rightful prince.",
      "release_date": "2023-12-22",
      "runtime": 175,
      "budget": 2700000000,
      "revenue": 7150000000,
      "vote_average": 7.2,
      "vote_count": 32000,
      "poster_path": "/salaar_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 80,
          "name": "Crime"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 146,
          "name": "Hombale Films"
        }
      ]
    },
    "credits": {
      "id": 202301,
      "cast": [
        {
          "id": 1033,
          "name": "Prabhas",
          "original_name": "Prabhas",
          "character": "Deva / Salaar",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1178,
          "name": "Prithviraj Sukumaran",
          "original_name": "Prithviraj Sukumaran",
          "character": "Varadharaja Mannaar",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1179,
          "name": "Shruti Haasan",
          "original_name": "Shruti Haasan",
          "character": "Aadhya",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1180,
          "name": "Jagapathi Babu",
          "original_name": "Jagapathi Babu",
          "character": "Raja Mannaar",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2080,
          "name": "Prashanth Neel",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2081,
          "name": "Ravi Basrur",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Salaar 1"
    ]
  },
  {
    "details": {
      "id": 202401,
      "title": "Hanu-Man",
      "original_title": "హను-మాన్",
      "original_language": "te",
      "overview": "In the fictional village of Anjanadri, a petty thief stumbles upon a celestial totem that grants him the boundless powers of Lord Hanuman.",
      "release_date": "2024-01-12",
      "runtime": 158,
      "budget": 400000000,
      "revenue": 3500000000,
      "vote_average": 8,
      "vote_count": 24000,
      "poster_path": "/hanuman_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 14,
          "name": "Fantasy"
        },
        {
          "id": 12,
          "name": "Adventure"
        }
      ],
      "production_companies": [
        {
          "id": 147,
          "name": "Primeshow Entertainment"
        }
      ]
    },
    "credits": {
      "id": 202401,
      "cast": [
        {
          "id": 1185,
          "name": "Teja Sajja",
          "original_name": "Teja Sajja",
          "character": "Hanumanthu",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1186,
          "name": "Amritha Aiyer",
          "original_name": "Amritha Aiyer",
          "character": "Meenakshi",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1187,
          "name": "Varalaxmi Sarathkumar",
          "original_name": "Varalaxmi Sarathkumar",
          "character": "Anjamma",
          "order": 2,
          "gender": 1
        },
        {
          "id": 1188,
          "name": "Vinay Rai",
          "original_name": "Vinay Rai",
          "character": "Michael",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2083,
          "name": "Prasanth Varma",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2084,
          "name": "GowraHari",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "HanuMan"
    ]
  },
  {
    "details": {
      "id": 202402,
      "title": "Kalki 2898 AD",
      "original_title": "కల్కి 2898 ఏ.డీ",
      "original_language": "te",
      "overview": "In a dystopian post-apocalyptic future in 2898 AD, an immortal warrior from the Mahabharata awaits the birth of Lord Kalki, protecting an expectant mother from a supreme tyrant.",
      "release_date": "2024-06-27",
      "runtime": 181,
      "budget": 6000000000,
      "revenue": 12000000000,
      "vote_average": 7.7,
      "vote_count": 21000,
      "poster_path": "/kalki_2898_ad_poster.jpg",
      "genres": [
        {
          "id": 878,
          "name": "Science Fiction"
        },
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 14,
          "name": "Fantasy"
        }
      ],
      "production_companies": [
        {
          "id": 101,
          "name": "Vyjayanthi Movies"
        }
      ]
    },
    "credits": {
      "id": 202402,
      "cast": [
        {
          "id": 1039,
          "name": "Prabhas",
          "original_name": "Prabhas",
          "character": "Bhairava / Karna",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1043,
          "name": "Amitabh Bachchan",
          "original_name": "Amitabh Bachchan",
          "character": "Ashwatthama",
          "order": 1,
          "gender": 2
        },
        {
          "id": 1181,
          "name": "Kamal Haasan",
          "original_name": "Kamal Haasan",
          "character": "Supreme Yaskin",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1101,
          "name": "Deepika Padukone",
          "original_name": "Deepika Padukone",
          "character": "SUM-80 / Sumathi",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2061,
          "name": "Nag Ashwin",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2090,
          "name": "Santhosh Narayanan",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Project K",
      "Kalki 2898AD"
    ]
  },
  {
    "details": {
      "id": 202403,
      "title": "Stree 2: Sarkate Ka Aatank",
      "original_title": "स्त्री 2",
      "original_language": "hi",
      "overview": "The town of Chanderi is haunted once more by a headless entity named Sarkata that abducts progressive women, requiring the townspeople and the female spirit to unite.",
      "release_date": "2024-08-15",
      "runtime": 147,
      "budget": 600000000,
      "revenue": 8740000000,
      "vote_average": 7.7,
      "vote_count": 18500,
      "poster_path": "/stree_2_poster.jpg",
      "genres": [
        {
          "id": 35,
          "name": "Comedy"
        },
        {
          "id": 27,
          "name": "Horror"
        }
      ],
      "production_companies": [
        {
          "id": 139,
          "name": "Maddock Films"
        },
        {
          "id": 156,
          "name": "Jio Studios"
        }
      ]
    },
    "credits": {
      "id": 202403,
      "cast": [
        {
          "id": 1123,
          "name": "Rajkummar Rao",
          "original_name": "Rajkummar Rao",
          "character": "Vicky",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1124,
          "name": "Shraddha Kapoor",
          "original_name": "Shraddha Kapoor",
          "character": "Stree",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1097,
          "name": "Pankaj Tripathi",
          "original_name": "Pankaj Tripathi",
          "character": "Rudra",
          "order": 2,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2062,
          "name": "Amar Kaushik",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2063,
          "name": "Sachin-Jigar",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Stree 2",
      "Sarkata"
    ]
  },
  {
    "details": {
      "id": 202501,
      "title": "Game Changer",
      "original_title": "గేమ్ ఛేంజర్",
      "original_language": "te",
      "overview": "An honest Indian Administrative Service officer launches a fierce crusade against electoral corruption to overhaul governance.",
      "release_date": "2025-01-10",
      "runtime": 168,
      "budget": 3500000000,
      "revenue": 2200000000,
      "vote_average": 6.8,
      "vote_count": 8500,
      "poster_path": "/game_changer_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 18,
          "name": "Drama"
        },
        {
          "id": 53,
          "name": "Thriller"
        }
      ],
      "production_companies": [
        {
          "id": 110,
          "name": "Sri Venkateswara Creations"
        }
      ]
    },
    "credits": {
      "id": 202501,
      "cast": [
        {
          "id": 1193,
          "name": "Ram Charan",
          "original_name": "Ram Charan",
          "character": "Ram Nandan IAS",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1169,
          "name": "Kiara Advani",
          "original_name": "Kiara Advani",
          "character": "Deepika",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1194,
          "name": "S. J. Suryah",
          "original_name": "S. J. Suryah",
          "character": "Bobbili Raja",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1195,
          "name": "Anjali",
          "original_name": "Anjali",
          "character": "Geetha",
          "order": 3,
          "gender": 1
        }
      ],
      "crew": [
        {
          "id": 2087,
          "name": "S. Shankar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2044,
          "name": "S. Thaman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Game Changer 2025"
    ]
  },
  {
    "details": {
      "id": 202502,
      "title": "Chhaava",
      "original_title": "छावा",
      "original_language": "hi",
      "overview": "The epic historical biography of Chhatrapati Sambhaji Maharaj, the fearless son of Shivaji Maharaj, who defied the mighty Mughal Empire.",
      "release_date": "2025-02-14",
      "runtime": 160,
      "budget": 1400000000,
      "revenue": 3100000000,
      "vote_average": 7.9,
      "vote_count": 12000,
      "poster_path": "/chhaava_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 36,
          "name": "History"
        },
        {
          "id": 18,
          "name": "Drama"
        }
      ],
      "production_companies": [
        {
          "id": 139,
          "name": "Maddock Films"
        }
      ]
    },
    "credits": {
      "id": 202502,
      "cast": [
        {
          "id": 1153,
          "name": "Vicky Kaushal",
          "original_name": "Vicky Kaushal",
          "character": "Chhatrapati Sambhaji Maharaj",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1175,
          "name": "Rashmika Mandanna",
          "original_name": "Rashmika Mandanna",
          "character": "Yesubai Bhonsale",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1196,
          "name": "Akshaye Khanna",
          "original_name": "Akshaye Khanna",
          "character": "Aurangzeb",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1197,
          "name": "Ashutosh Rana",
          "original_name": "Ashutosh Rana",
          "character": "Hambirrao Mohite",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2088,
          "name": "Laxman Utekar",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2008,
          "name": "A. R. Rahman",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Lion Cub"
    ]
  },
  {
    "details": {
      "id": 202601,
      "title": "Spirit",
      "original_title": "స్పిరిట్",
      "original_language": "te",
      "overview": "A ferocious, no-holds-barred cop battles rampant international syndicate operations in a high-octane gritty universe.",
      "release_date": "2026-08-15",
      "runtime": 172,
      "budget": 3500000000,
      "revenue": 5500000000,
      "vote_average": 8.2,
      "vote_count": 15000,
      "poster_path": "/spirit_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 80,
          "name": "Crime"
        },
        {
          "id": 53,
          "name": "Thriller"
        }
      ],
      "production_companies": [
        {
          "id": 145,
          "name": "T-Series"
        },
        {
          "id": 137,
          "name": "Bhadrakali Pictures"
        }
      ]
    },
    "credits": {
      "id": 202601,
      "cast": [
        {
          "id": 1033,
          "name": "Prabhas",
          "original_name": "Prabhas",
          "character": "Inspector Arjun",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1198,
          "name": "Kareena Kapoor Khan",
          "original_name": "Kareena Kapoor",
          "character": "Avantika",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1194,
          "name": "S. J. Suryah",
          "original_name": "S. J. Suryah",
          "character": "Vikramaditya",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1004,
          "name": "Prakash Raj",
          "original_name": "Prakash Raj",
          "character": "Commissioner Raghunath",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2059,
          "name": "Sandeep Reddy Vanga",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2089,
          "name": "Harshavardhan Rameshwar",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "Spirit 2026"
    ]
  },
  {
    "details": {
      "id": 202602,
      "title": "King",
      "original_title": "किंग",
      "original_language": "hi",
      "overview": "A ruthless underworld syndicate don mentors a sharp young protégé while taking on global crime syndicates in high-stakes action.",
      "release_date": "2026-11-06",
      "runtime": 165,
      "budget": 3000000000,
      "revenue": 6200000000,
      "vote_average": 8,
      "vote_count": 16000,
      "poster_path": "/king_poster.jpg",
      "genres": [
        {
          "id": 28,
          "name": "Action"
        },
        {
          "id": 80,
          "name": "Crime"
        },
        {
          "id": 53,
          "name": "Thriller"
        }
      ],
      "production_companies": [
        {
          "id": 148,
          "name": "Red Chillies Entertainment"
        }
      ]
    },
    "credits": {
      "id": 202602,
      "cast": [
        {
          "id": 1009,
          "name": "Shah Rukh Khan",
          "original_name": "Shah Rukh Khan",
          "character": "King",
          "order": 0,
          "gender": 2
        },
        {
          "id": 1199,
          "name": "Suhana Khan",
          "original_name": "Suhana Khan",
          "character": "Zoya",
          "order": 1,
          "gender": 1
        },
        {
          "id": 1137,
          "name": "Abhishek Bachchan",
          "original_name": "Abhishek Bachchan",
          "character": "Vikramaditya",
          "order": 2,
          "gender": 2
        },
        {
          "id": 1154,
          "name": "Jaideep Ahlawat",
          "original_name": "Jaideep Ahlawat",
          "character": "Malik",
          "order": 3,
          "gender": 2
        }
      ],
      "crew": [
        {
          "id": 2090,
          "name": "Sujoy Ghosh",
          "job": "Director",
          "department": "Directing"
        },
        {
          "id": 2068,
          "name": "Anirudh Ravichander",
          "job": "Original Music Composer",
          "department": "Sound"
        }
      ]
    },
    "alternativeTitles": [
      "King 2026"
    ]
  }
];
