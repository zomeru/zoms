import { AiFillGithub, AiOutlineInstagram, AiOutlineMail } from 'react-icons/ai';
import { FaGitAlt, FaNodeJs, FaReact, FaRobot } from 'react-icons/fa';
import { GiFox } from 'react-icons/gi';
import { IoLogoLinkedin } from 'react-icons/io';
import {
  SiExpress,
  SiFirebase,
  SiMongodb,
  SiNextdotjs,
  SiPostgresql,
  SiStyledcomponents,
  SiTailwindcss,
  SiTrpc,
  SiTypescript
} from 'react-icons/si';
import { TbBrandSupabase } from 'react-icons/tb';

export const socials = [
  {
    url: 'mailto:zomergregorio@gmail.com',
    Icon: AiOutlineMail
  },
  {
    url: '/linkedin',
    Icon: IoLogoLinkedin
  },
  {
    url: '/github',
    Icon: AiFillGithub
  },
  {
    url: '/instagram',
    Icon: AiOutlineInstagram
  }
];

export const navigation = [
  {
    name: 'About',
    url: '/#about'
  },
  {
    name: 'Experience',
    url: '/#experience'
  },
  {
    name: 'Projects',
    url: '/#projects'
  },
  {
    name: 'Blog',
    url: '/#blog'
  }
];

export const technologies = [
  {
    name: 'Typescript',
    Icon: SiTypescript,
    color: '#3178c6'
  },
  {
    name: 'React.js',
    Icon: FaReact,
    color: '#61dafb'
  },
  {
    name: 'Next.js',
    Icon: SiNextdotjs,
    color: '#000000'
  },
  {
    name: 'React Native',
    Icon: FaReact,
    color: '#61dafb'
  },
  {
    name: 'Styled-Components',
    Icon: SiStyledcomponents,
    color: '#db7093'
  },
  {
    name: 'Tailwind CSS',
    Icon: SiTailwindcss,
    color: '#38bdf8'
  },
  {
    name: 'Node.js',
    Icon: FaNodeJs,
    color: '#339933'
  },
  {
    name: 'tRPC',
    Icon: SiTrpc,
    color: '#398ccb'
  },
  {
    name: 'Express.js',
    Icon: SiExpress,
    color: '#000000'
  },
  {
    name: 'ElysiaJS',
    Icon: GiFox,
    color: '#cccccc'
  },
  {
    name: 'MongoDB',
    Icon: SiMongodb,
    color: '#47a248'
  },
  {
    name: 'PostgreSQL',
    Icon: SiPostgresql,
    color: '#336791'
  },
  // {
  //   name: 'GraphQL',
  //   Icon: GrGraphQl,
  //   color: '#e10098'
  // },
  // {
  //   name: 'REST API',
  //   Icon: AiFillApi,
  //   color: '#61dafb'
  // },
  {
    name: 'Firebase',
    Icon: SiFirebase,
    color: '#ffca28'
  },
  {
    name: 'Supabase',
    Icon: TbBrandSupabase,
    color: '#3ecf8e'
  },
  {
    name: 'Github',
    Icon: AiFillGithub,
    color: '#333'
  },
  {
    name: 'Git',
    Icon: FaGitAlt,
    color: '#f34f29'
  },
  {
    name: 'AI & LLMs',
    Icon: FaRobot,
    color: '#8a2be2'
  }
];

export const MAX_PORTFOLIO_BLOG_POSTS = 5;
export const BLOG_POSTS_PAGE_SIZE = 25;
export const MAX_TITLE_LENGTH = 100;
export const MAX_SUMMARY_LENGTH = 300;
