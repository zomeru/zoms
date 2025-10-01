#!/usr/bin/env node

/**
 * Script to seed initial experience data from constants to Sanity CMS
 *
 * Usage:
 * 1. Make sure you have .env.local with NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET
 * 2. Get a write token from Sanity and add it to .env.local as SANITY_API_TOKEN
 * 3. Run: node scripts/seed-experience.js
 */

const { createClient } = require('@sanity/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

// Experience data from constants
const experienceData = [
  {
    title: 'Software Engineer',
    company: 'Seansoft Corporation',
    location: 'Makati City, Philippines (Remote)',
    range: 'Jan. 2024 - Present',
    duties: [],
    order: 0
  },
  {
    title: 'Full Stack Web Developer',
    company: 'Evelan GmbH',
    location: 'Hamburg, Germany (Remote)',
    range: 'Aug. 2023 - Dec. 2023',
    duties: [
      'Joined an existing project aimed at developing and enhancing all-in-one management system, a comprehensive master data, company holdings, tasks, and document management system for corporate and holding structures.',
      'Created responsive React web components utilizing Chakra UI, ensuring an intuitive user interface.',
      'Developed backend API within Next.js using tRPC for integrated, high-performance functionality.',
      'Created unit tests using jest to guarantee flawless functionality of core business logic.',
      'Designed and optimized PostgreSQL database schemas using Prisma for efficient data structure and accessibility.',
      'Established unified client-server validation using Zod, ensuring seamless data integrity across the system.',
      'Collaborated with designers, project managers, and other engineers to deliver high quality products for clients.',
      'Took charge of reviewing pull requests and refining onboarding procedures, enhancing team productivity and effectiveness.'
    ],
    order: 1
  },
  {
    title: 'Software Engineer',
    company: 'Beyonder Inc.',
    location: 'Makati City, Philippines (Remote)',
    range: 'Feb. 2022 - Aug. 2023',
    duties: [
      'Developed robust, full-stack applications for diverse clients using React, React Native, Node.js, and Tailwind CSS.',
      'Implemented CI/CD pipelines using GitHub Actions for automated and efficient deployment workflows.',
      'Created prototypes using Figma to visualize design concepts and guide the development process.',
      'Successfully delivered multiple full-stack web and mobile applications, including Kokuban, スマホdeマップ, and Doko?.',
      'Worked remotely and collaborated with teams of engineers to ensure project success.',
      'Led the front-end development team, mentoring junior developers and fostering a collaborative, high-achieving environment.'
    ],
    order: 2
  },
  {
    title: 'Full Stack Developer',
    company: 'Freelance',
    location: 'Bulacan, Philippines (Remote)',
    range: 'Apr. 2021 - Feb. 2022',
    duties: [
      'Collaborated with a team of three developers to deliver web applications for small businesses and individuals, utilizing skills in ReactJS, NextJS, and other relevant technologies.',
      'Translated PSD designs into high-quality web pages, ensuring a seamless user experience.',
      'Created prototypes using Figma to guide the development process.'
    ],
    order: 3
  }
];

async function seedExperience() {
  console.log('🌱 Seeding experience data to Sanity...');

  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    console.error('❌ Error: NEXT_PUBLIC_SANITY_PROJECT_ID is not set in .env.local');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
    console.error('❌ Error: NEXT_PUBLIC_SANITY_DATASET is not set in .env.local');
    process.exit(1);
  }

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ Error: SANITY_API_TOKEN is not set in .env.local');
    console.error('   Get a token with "Editor" role from https://www.sanity.io/manage');
    process.exit(1);
  }

  try {
    // Create experience documents
    const promises = experienceData.map(async (experience) => {
      const doc = {
        _type: 'experience',
        ...experience
      };

      const result = await client.create(doc);
      console.log(`✅ Created: ${experience.title} at ${experience.company}`);
      return result;
    });

    await Promise.all(promises);

    console.log('\n🎉 Successfully seeded all experience data to Sanity!');
    console.log(
      '   You can now view and edit them at http://localhost:3333 (run: pnpm studio:dev)'
    );
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    if (error.statusCode === 401) {
      console.error('   Authentication failed. Check your SANITY_API_TOKEN');
    }
    process.exit(1);
  }
}

seedExperience();
