import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Document, Page } from 'react-pdf';

export default function Home() {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedPDFFile, setSelectedPDFFile] = useState();

  const handleImage = (event: any) => {
    const file = event.target.files[0];

    !!file?.type?.length && file.type === 'application/pdf'
      ? setSelectedPDFFile(file)
      : !!file?.type?.length && setImageUrl(URL.createObjectURL(file));
  };

  const onRenderSuccess = () => {
    const importPDFCanvas: HTMLCanvasElement = document.querySelector(
      '.import-pdf-page canvas'
    );

    importPDFCanvas.toBlob((blob) => {
      setImageUrl(URL.createObjectURL(blob));
    });
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>PDF to PNG</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>PDF to PNG client-side conversion</h1>
        <label htmlFor="upload" className={styles.download}>
          Upload PDF
        </label>
        <input
          style={{ display: 'none' }}
          id="upload"
          type="file"
          onChange={handleImage}
        />

        {selectedPDFFile && (
          <>
            <div style={{ display: 'none', width: '100vw' }}>
              <Document file={selectedPDFFile}>
                <Page
                  className="import-pdf-page"
                  pageNumber={1}
                  onRenderSuccess={onRenderSuccess}
                  width={1024}
                />
              </Document>
            </div>
          </>
        )}

        {imageUrl && (
          <>
            <img
              className={styles.image}
              src={imageUrl}
              style={{ width: '50vw' }}
            />
            <a className={styles.download} href={imageUrl} download>
              download file
            </a>
          </>
        )}
      </main>
    </div>
  );
}
