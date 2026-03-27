export const ALLOWED_COLLEGE_DOMAINS: Record<string, string> = {
  // Karnataka
  "bmsce.ac.in": "BMS College of Engineering",
  "pes.edu": "PES University",
  "rvce.edu.in": "RV College of Engineering",
  "msrit.edu": "MS Ramaiah Institute of Technology",
  "nie.ac.in": "National Institute of Engineering",
  "vtu.ac.in": "Visvesvaraya Technological University",
  "dsce.edu.in": "Dayananda Sagar College of Engineering",
  "sit.ac.in": "Siddaganga Institute of Technology",
  "jssateb.ac.in": "JSS Academy of Technical Education",
  "cmrit.ac.in": "CMR Institute of Technology",
  
  // Tamil Nadu
  "annauniv.edu": "Anna University",
  "iitm.ac.in": "IIT Madras",
  "nitt.edu": "NIT Trichy",
  "sastra.edu": "SASTRA University",
  "vit.ac.in": "VIT University",
  "srm.edu.in": "SRM Institute",
  "srmist.edu.in": "SRM Institute of Science and Technology",
  "ssn.edu.in": "SSN College of Engineering",
  "ce.annauniv.edu": "College of Engineering Guindy",
  "mitindia.edu": "MIT Campus Anna University",
  
  // Maharashtra
  "iitb.ac.in": "IIT Bombay",
  "vjti.ac.in": "VJTI Mumbai",
  "coep.org.in": "COEP Technological University",
  "pict.edu": "PICT Pune",
  "mitaoe.ac.in": "MIT Academy of Engineering",
  "spit.ac.in": "SPIT Mumbai",
  "tsec.edu": "Thadomal Shahani Engineering College",
  
  // Delhi / North India
  "iitd.ac.in": "IIT Delhi",
  "dtu.ac.in": "Delhi Technological University",
  "nsit.net": "Netaji Subhas Institute of Technology",
  "igdtuw.ac.in": "IGDTUW",
  "jiit.ac.in": "Jaypee Institute of Information Technology",
  
  // Telangana / Andhra Pradesh
  "iith.ac.in": "IIT Hyderabad",
  "nitw.ac.in": "NIT Warangal",
  "bits-pilani.ac.in": "BITS Pilani",
  "cbit.ac.in": "Chaitanya Bharathi Institute of Technology",
  "mgit.ac.in": "Mahatma Gandhi Institute of Technology",
  
  // West Bengal
  "iitk.ac.in": "IIT Kanpur",
  "jadavpur.edu": "Jadavpur University",
  "iiest.ac.in": "IIEST Shibpur",
  "makautexams.in": "MAKAUT",
  
  // Kerala
  "cusat.ac.in": "Cochin University of Science and Technology",
  "nitc.ac.in": "NIT Calicut",
  "cet.ac.in": "College of Engineering Trivandrum",
  "ktu.edu.in": "APJ Abdul Kalam Technological University",
  
  // Gujarat
  "iitgn.ac.in": "IIT Gandhinagar",
  "nirmauni.ac.in": "Nirma University",
  "ddu.ac.in": "Dharmsinh Desai University",
  "charusat.ac.in": "Charotar University",

  // National/General
  "iitbhu.ac.in": "IIT BHU",
  "nit.ac.in": "NIT",
  "iitr.ac.in": "IIT Roorkee",
  "iitkgp.ac.in": "IIT Kharagpur",
  "iitg.ac.in": "IIT Guwahati",
  "iisc.ac.in": "IISc Bangalore",
  "manipal.edu": "Manipal Academy",
  "mu.ac.in": "Mumbai University",
  "du.ac.in": "Delhi University",
  "christuniversity.in": "Christ University",
  "reva.edu.in": "REVA University",
  "rvei.edu.in": "RV Educational Institutions",
  "kletech.ac.in": "KLE Technological University",
  "bub.ernet.in": "Bangalore University",
  "bvrit.ac.in": "BVRIT",
  "gmrit.edu.in": "GMRIT",
  "srkrec.ac.in": "SRKREC",
  "kluniversity.in": "KL University",
  "gitam.edu": "GITAM University",
  "sathyabama.ac.in": "Sathyabama Institute",
  "psgtech.ac.in": "PSG College of Technology",
  "tcetmumbai.in": "Thakur College",
  "ldrp.ac.in": "LDRP Institute",
  "marwadiuniversity.ac.in": "Marwadi University",
  "poornima.org": "Poornima University",
  "jaipur.manipal.edu": "Manipal Jaipur",
  "tiet.ac.in": "Thapar Institute",
  "chitkara.edu.in": "Chitkara University",
  "lpu.in": "Lovely Professional University",
  "amity.edu": "Amity University",
  "sharda.ac.in": "Sharda University",
  "ggsipu.ac.in": "GGSIPU",
  "upes.ac.in": "UPES Dehradun",
};

export function getCollegeName(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return ALLOWED_COLLEGE_DOMAINS[domain] || null;
}

export function isCollegeEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return domain in ALLOWED_COLLEGE_DOMAINS;
}
