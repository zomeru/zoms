import { AiFillGithub, AiOutlineInstagram, AiOutlineMail } from "react-icons/ai";
import { IoLogoLinkedin } from "react-icons/io";

export const socials = [
  {
    url: "mailto:zomergregorio@gmail.com",
    Icon: AiOutlineMail
  },
  {
    url: "/linkedin",
    Icon: IoLogoLinkedin
  },
  {
    url: "/github",
    Icon: AiFillGithub
  },
  {
    url: "/instagram",
    Icon: AiOutlineInstagram
  }
];

export const navigation = [
  {
    name: "About",
    url: "/#about"
  },
  {
    name: "Experience",
    url: "/#experience"
  },
  {
    name: "Projects",
    url: "/#projects"
  },
  {
    name: "Blog",
    url: "/#blog"
  }
];

export const technologies = [
  { name: "Typescript", color: "#3178c6" },
  { name: "React.js", color: "#61dafb" },
  { name: "Next.js", color: "#000000" },
  { name: "React Native", color: "#61dafb" },
  { name: "Styled-Components", color: "#db7093" },
  { name: "Tailwind CSS", color: "#38bdf8" },
  { name: "Node.js", color: "#339933" },
  { name: "tRPC", color: "#398ccb" },
  { name: "Express.js", color: "#000000" },
  { name: "ElysiaJS", color: "#cccccc" },
  { name: "MongoDB", color: "#47a248" },
  { name: "PostgreSQL", color: "#336791" },
  { name: "Firebase", color: "#ffca28" },
  { name: "Supabase", color: "#3ecf8e" },
  { name: "Github", color: "#333" },
  { name: "Git", color: "#f34f29" },
  { name: "AI & LLMs", color: "#8a2be2" }
];

export const MAX_PORTFOLIO_BLOG_POSTS = 6;
export const BLOG_POSTS_PAGE_SIZE = 24;
export const MAX_TITLE_LENGTH = 100;
export const MAX_SUMMARY_LENGTH = 300;
export const TITLE = "Zomer Gregorio";
