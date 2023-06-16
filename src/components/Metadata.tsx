import React from 'react';

const Metadata = (): React.JSX.Element => {
  return (
    <head>
      <link rel='apple-touch-icon' sizes='180x180' href='/assets/icons/apple-touch-icon.png' />
      <link rel='icon' type='image/png' sizes='32x32' href='/assets/icons/favicon-32x32.png' />
      <link rel='icon' type='image/png' sizes='16x16' href='/assets/icons/favicon-16x16.png' />
      <link rel='manifest' href='/assets/icons/site.webmanifest' />
      <link rel='mask-icon' href='/assets/icons/safari-pinned-tab.svg' color='#0e0e0e' />
      <link rel='icon' href='/favicon.ico' sizes='any' />
      <meta name='msapplication-TileColor' content='#0e0e0e' />
      <meta name='msapplication-config' content='/assets/icons/browserconfig.xml' />
      <meta name='theme-color' content='#ad5aff' />
    </head>
  );
};

export default Metadata;
