import aboutJson from "@/lib/data/about.json";

export const socials = {
  email: "jaedonaspurlock@outlook.com",
  linkedin: "https://www.linkedin.com/in/jaedon-spurlock/",
  github: "https://github.com/JaedonSpurlock01",
  instagram: "https://www.instagram.com/jaedonspurlock",
  youtube: "https://www.youtube.com/channel/UC_kzjV049b2XQlKe306re5g",
} as const;

export const info = {
  name: "Jaedon Spurlock",
  role: "Software Engineer",
  resume: "/resume.pdf",
  location: "Orlando, FL",
  description: aboutJson.summary,
} as const;

export const education = {
  school: "California State University, San Marcos",
  degree: "Bachelors of Science in Software Engineering",
  gpa: "3.95/4.00",
  date: "Aug 2022 - May 2026",
  imageSrc: "/education/csu.jpg",
  href: "https://www.csusm.edu/",
  desc: "Courses: Data Structures & Algorithms, Software Design & Development, Database Management Systems, Calculus I-II, Real-Time Concepts For Embedded Systems, Physics | GPA: 3.95/4.00",
} as const;
