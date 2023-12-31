import { AiOutlineInstagram, AiFillGithub, AiFillApi, AiOutlineMail } from 'react-icons/ai';
import { IoLogoLinkedin } from 'react-icons/io';
import { GrGraphQl } from 'react-icons/gr';
import {
  SiTypescript,
  SiTailwindcss,
  SiFirebase,
  SiMongodb,
  SiStyledcomponents,
  SiPostgresql,
  SiTiktok,
  SiTrpc
} from 'react-icons/si';
import { FaReact, FaNodeJs, FaGitAlt } from 'react-icons/fa';
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
  },
  {
    url: '/tiktok',
    Icon: SiTiktok
  }
];

export const navigation = [
  {
    name: 'About',
    url: '/#about'
  },
  {
    name: 'Technologies',
    url: '/#technologies'
  },
  {
    name: 'Experience',
    url: '/#experience'
  },
  {
    name: 'Projects',
    url: '/#projects'
  }
];

export const technologies = [
  {
    name: 'Typescript',
    Icon: SiTypescript
  },
  {
    name: 'React.js',
    Icon: FaReact
  },
  {
    name: 'React Native',
    Icon: FaReact
  },
  {
    name: 'Styled-Components',
    Icon: SiStyledcomponents
  },
  {
    name: 'Tailwind CSS',
    Icon: SiTailwindcss
  },
  {
    name: 'tRPC',
    Icon: SiTrpc
  },
  {
    name: 'Node.js',
    Icon: FaNodeJs
  },
  {
    name: 'MongoDB',
    Icon: SiMongodb
  },
  {
    name: 'PostgreSQL',
    Icon: SiPostgresql
  },
  {
    name: 'GraphQL',
    Icon: GrGraphQl
  },
  {
    name: 'REST API',
    Icon: AiFillApi
  },
  {
    name: 'Firebase',
    Icon: SiFirebase
  },
  {
    name: 'Supabase',
    Icon: TbBrandSupabase
  },
  {
    name: 'Github',
    Icon: AiFillGithub
  },
  {
    name: 'Git',
    Icon: FaGitAlt
  }
];
